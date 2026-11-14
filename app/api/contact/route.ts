import nodemailer from "nodemailer"
import { NextResponse } from "next/server"

/**
 * Contact form: sends the enquiry to me and a confirmation to the sender,
 * through the Gmail account configured by the SMTP_* env vars (an app
 * password, not the account password).
 *
 *   SMTP_HOST, SMTP_PORT (587 STARTTLS / 465 TLS), SMTP_USER, SMTP_PASS,
 *   EMAIL_TO (where enquiries land), EMAIL_FROM (optional, defaults to SMTP_USER)
 */

export const runtime = "nodejs"

const LIMITS = { name: 120, email: 200, org: 160, subject: 160, message: 5000 }

/** Largest request body accepted, in bytes: the limits above plus JSON overhead. */
const MAX_BODY = 16 * 1024

// Best-effort flood control per instance: 5 sends per IP per 10 minutes, and
// 30 in total per hour, so rotating IPs can't turn the form into a mailer.
const WINDOW_MS = 10 * 60 * 1000
const GLOBAL_WINDOW_MS = 60 * 60 * 1000
const GLOBAL_MAX = 30
const hits = new Map<string, number[]>()
let allHits: number[] = []
function limited(ip: string) {
  const now = Date.now()
  allHits = allHits.filter((t) => now - t < GLOBAL_WINDOW_MS)
  // drop idle IPs so the map can't grow without bound
  if (hits.size > 1000) for (const [k, v] of hits) if (now - v[v.length - 1] >= WINDOW_MS) hits.delete(k)
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (recent.length > 5 || allHits.length >= GLOBAL_MAX) return true
  allHits.push(now)
  return false
}

/** Same-origin check: browsers send Origin on every cross-site POST. */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin")
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site"
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
    return new URL(origin).host === host
  } catch {
    return false
  }
}

// one plain address, nothing nodemailer could read as a list or a display name
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/
// control characters (including CR/LF) never belong in a name or subject line
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim()
const looksLikeLink = (s: string) => /:\/\/|www\.|\.(com|net|org|io|ru|xyz|top|info)\b/i.test(s)

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
const unquote = (v?: string) => v?.replace(/^"(.*)"$/, "$1")

/** Shared shell for both emails: dark, plain, matches the site. */
function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#05070d;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e8ecf5">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;border:1px solid #1c2333;background:#0a0e18" cellspacing="0" cellpadding="0">
      <tr><td style="padding:28px 32px 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#ff6b2c">${title}</td></tr>
      <tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.65;color:#c9d1e0">${body}</td></tr>
      <tr><td style="padding:18px 32px;border-top:1px solid #1c2333;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b97ad">Dashiell Russell · Sydney, Australia</td></tr>
    </table>
  </td></tr></table></body></html>`
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid request." }, { status: 403 })
  if (!(req.headers.get("content-type") ?? "").includes("application/json"))
    return NextResponse.json({ error: "Invalid request." }, { status: 415 })
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY)
    return NextResponse.json({ error: "That message is too long." }, { status: 413 })

  let data: Record<string, unknown>
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY) return NextResponse.json({ error: "That message is too long." }, { status: 413 })
    data = JSON.parse(raw)
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("not an object")
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // honeypot: real people never fill the hidden field
  if (typeof data.website === "string" && data.website.trim() !== "") return NextResponse.json({ ok: true })

  const str = (k: keyof typeof LIMITS) => (typeof data[k] === "string" ? (data[k] as string).trim().slice(0, LIMITS[k]) : "")
  const name = oneLine(str("name"))
  const email = str("email")
  const org = oneLine(str("org"))
  const message = str("message")
  const subject = oneLine(str("subject"))

  // the name is the one thing the confirmation email repeats, so it can't carry a link
  if (!name || looksLikeLink(name)) return NextResponse.json({ error: "Add your name." }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 })

  // Vercel sets x-real-ip / x-forwarded-for itself and overwrites what clients send
  const ip = req.headers.get("x-real-ip") ?? ((req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown")
  if (limited(ip)) return NextResponse.json({ error: "Too many messages. Try again in a few minutes." }, { status: 429 })

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = unquote(process.env.SMTP_PASS)
  const to = process.env.EMAIL_TO
  const from = process.env.EMAIL_FROM || user
  if (!host || !user || !pass || !to || !from) {
    console.error("contact: SMTP not configured", { host: !!host, user: !!user, pass: !!pass, to: !!to })
    return NextResponse.json({ error: "Email isn't set up right now. Please email dashiell.russell@gmail.com." }, { status: 503 })
  }

  const transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  const who = org ? `${name}, ${org}` : name
  const safe = { name: escape(name), email: escape(email), org: escape(org), subject: escape(subject), message: escape(message).replace(/\n/g, "<br>") }
  const noMessage = '<span style="color:#8b97ad">(no message)</span>'

  try {
    // to me, replying goes straight to them
    await transport.sendMail({
      from: `"Portfolio contact" <${from}>`,
      to,
      replyTo: { name, address: email },
      subject: subject ? `${subject} · ${who}` : `New enquiry from ${who}`,
      text: `${subject ? subject + "\n\n" : ""}${message || "(no message)"}\n\n${who}\n${email}`,
      html: shell(
        "New enquiry",
        `<p style="margin:0 0 4px;font-size:20px;color:#e8ecf5">${safe.name}${org ? `<span style="color:#8b97ad">, ${safe.org}</span>` : ""}</p>
         <p style="margin:0 0 20px"><a href="mailto:${safe.email}" style="color:#35d6f0;text-decoration:none">${safe.email}</a></p>
         ${subject ? `<p style="margin:0 0 10px;font-size:17px;color:#e8ecf5">${safe.subject}</p>` : ""}
         <p style="margin:0 0 24px">${safe.message || noMessage}</p>
         <a href="mailto:${safe.email}" style="display:inline-block;padding:12px 22px;background:#e8ecf5;color:#05070d;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase">Reply to ${safe.name}</a>`
      ),
    })

    // Confirmation to them. It deliberately doesn't quote their message back:
    // the address is unverified, so echoing it would let anyone send any text
    // to anyone from this Gmail account (and get the account flagged as spam).
    await transport.sendMail({
      from: `"Dashiell Russell" <${from}>`,
      to: { name, address: email },
      replyTo: to,
      subject: "Thanks for getting in touch",
      text: `Hi ${name},\n\nThanks for reaching out. I've got your message and will get back to you soon.\n\nDashiell`,
      html: shell(
        "Message received",
        `<p style="margin:0 0 16px">Hi ${safe.name},</p>
         <p style="margin:0 0 16px">Thanks for reaching out. I've got your message and will get back to you soon.</p>
         <p style="margin:0 0 4px">Dashiell</p>
         <p style="margin:0"><a href="https://www.linkedin.com/in/dashiell-russell-9973482a1" style="color:#35d6f0;text-decoration:none">LinkedIn</a> · <a href="https://github.com/DashiellRussell" style="color:#35d6f0;text-decoration:none">GitHub</a></p>`
      ),
    })
  } catch (err) {
    console.error("contact: send failed", err)
    return NextResponse.json({ error: "Couldn't send right now. Please email dashiell.russell@gmail.com." }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
