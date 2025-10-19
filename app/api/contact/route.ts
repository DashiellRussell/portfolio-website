import nodemailer from "nodemailer"
import { NextResponse } from "next/server"

function stripQuotes(v?: string) {
  if (!v) return v
  return v.replace(/^"(.*)"$/, "$1")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, subject, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const SMTP_HOST = process.env.SMTP_HOST
    const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
    const SMTP_USER = process.env.SMTP_USER
    const SMTP_PASS = stripQuotes(process.env.SMTP_PASS)
    const EMAIL_TO = process.env.EMAIL_TO
    const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
      console.error("Missing SMTP env vars:", {
        SMTP_HOST: !!SMTP_HOST,
        SMTP_USER: !!SMTP_USER,
        SMTP_PASS: !!SMTP_PASS,
        EMAIL_TO: !!EMAIL_TO,
      })
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    // verify connection configuration early to give clearer errors
    try {
      await transporter.verify()
    } catch (verifyErr) {
      console.error("SMTP verify failed:", verifyErr)
      return NextResponse.json({ error: "SMTP verify failed" }, { status: 500 })
    }

    const mailInfo = {
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `[Website] ${subject || "New message"} — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong></p>
             <p>${String(message).replace(/\n/g, "<br/>")}</p>`,
    }

    await transporter.sendMail(mailInfo)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Email send failed:", err)
    return NextResponse.json({ error: err?.message || "Failed to send email" }, { status: 500 })
  }
}