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
      text: `
    Name: ${name}
    Email: ${email}

    ${message}
      `.trim(),

      html: `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: #1a1a1a;
          background-color: #ffffff;
          padding: 36px;
          border-radius: 16px;
          border: 1px solid rgba(75, 99, 255, 0.15);
          box-shadow:
            0 0 12px rgba(75, 99, 255, 0.08),
            0 4px 24px rgba(0, 0, 0, 0.04);
          max-width: 640px;
          margin: auto;
          line-height: 1.7;
        ">

          <h2 style="
            color: #4b63ff; /* from --primary */
            margin-bottom: 18px;
            text-align: center;
            font-size: 22px;
            letter-spacing: 0.3px;
          ">
            ✉️ New Website Message
          </h2>

          <div style="
            background: linear-gradient(135deg, #f9fbff, #f4f7ff);
            border: 1px solid rgba(75, 99, 255, 0.15);
            border-radius: 14px;
            padding: 18px 22px;
            margin-bottom: 20px;
            box-shadow: 0 0 10px rgba(75, 99, 255, 0.06);
          ">
            <p style="margin: 8px 0;">
              <strong style="color: #0f0f11;">Name:</strong> ${name}
            </p>
            <p style="margin: 8px 0;">
              <strong style="color: #0f0f11;">Email:</strong>
              <a href="mailto:${email}" style="
                color: #3b7cd7;
                text-decoration: none;
                font-weight: 500;
              ">${email}</a>
            </p>
          </div>

          <p style="margin: 10px 0 6px; font-weight: 600; color: #0f0f11;">Message:</p>
          <div style="
            background-color: #fafbfc;
            border: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 14px;
            padding: 18px 20px;
            box-shadow: inset 0 0 12px rgba(75, 99, 255, 0.04);
          ">
            <p style="white-space: pre-line; margin: 0;">${String(message).replace(/\n/g, "<br/>")}</p>
          </div>

          <hr style="
            border: none;
            border-top: 1px solid #e5e5e5;
            margin: 28px 0 20px;
          " />

          <p style="
            font-size: 13px;
            color: #666;
            text-align: center;
          ">
            Sent from your website —
            <span style="
              color: #4b63ff;
              font-weight: 600;
            ">Dashiell Russell</span>
          </p>
        </div>
      `.trim(),
    };



    await transporter.sendMail(mailInfo)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Email send failed:", err)
    return NextResponse.json({ error: err?.message || "Failed to send email" }, { status: 500 })
  }
}