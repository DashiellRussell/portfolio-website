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

// best-effort flood control per instance: 5 sends per IP per 10 minutes
const WINDOW_MS = 10 * 60 * 1000
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 5
}

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
  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // honeypot: real people never fill the hidden field
  if (typeof data.website === "string" && data.website.trim() !== "") return NextResponse.json({ ok: true })

  const str = (k: keyof typeof LIMITS) => (typeof data[k] === "string" ? (data[k] as string).trim().slice(0, LIMITS[k]) : "")
  const name = str("name")
  const email = str("email")
  const org = str("org")
  const message = str("message")
  const subject = str("subject")

  if (!name) return NextResponse.json({ error: "Add your name." }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 })

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"
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
      replyTo: `"${name.replace(/"/g, "")}" <${email}>`,
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

    // confirmation to them
    await transport.sendMail({
      from: `"Dashiell Russell" <${from}>`,
      to: email,
      replyTo: to,
      subject: "Thanks for getting in touch",
      text: `Hi ${name},\n\nThanks for reaching out. I've got your message and will get back to you soon.${message ? `\n\nWhat you sent:\n${message}` : ""}\n\nDashiell`,
      html: shell(
        "Message received",
        `<p style="margin:0 0 16px">Hi ${safe.name},</p>
         <p style="margin:0 0 16px">Thanks for reaching out. I've got your message and will get back to you soon.</p>
         ${message || subject ? `<p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8b97ad">What you sent</p>
         <div style="margin:0 0 20px;padding:14px 16px;border-left:2px solid #ff6b2c;background:#0e1422">${subject ? `<p style="margin:0 0 6px;color:#e8ecf5">${safe.subject}</p>` : ""}<p style="margin:0">${safe.message || noMessage}</p></div>` : ""}
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
