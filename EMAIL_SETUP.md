# Email Contact Form Setup Guide

Your contact form is ready to go! It's already connected with nodemailer. You just need to configure your Gmail account to allow the app to send emails.

## Quick Setup (3 Steps)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", enable "2-Step Verification"
4. Follow the prompts to set it up (you'll need your phone)

### Step 2: Create an App Password

1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Enter a name like "Portfolio Website Contact Form"
6. Click **Generate**
7. Google will show you a 16-character password (example: `abcd efgh ijkl mnop`)
8. **Copy this password** (you won't be able to see it again)

### Step 3: Add the Password to Your .env.local File

1. Open the `.env.local` file in your project root
2. Find the line that says `SMTP_PASS=your-16-character-app-password-here`
3. Replace `your-16-character-app-password-here` with your app password
4. **Important**: Remove all spaces from the password
   - Example: Change `abcd efgh ijkl mnop` to `abcdefghijklmnop`

Your `.env.local` should look like this:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dashiell.russell@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_TO=dashiell.russell@gmail.com
EMAIL_FROM=dashiell.russell@gmail.com
```

## Testing the Contact Form

1. Make sure your dev server is running: `npm run dev`
2. Go to the Contact section on your site
3. Fill out the form and click "Send Message"
4. Check your email inbox (dashiell.russell@gmail.com)
5. You should receive the test message!

## Troubleshooting

### "Invalid login" error
- Make sure you've enabled 2-Factor Authentication
- Double-check your app password has no spaces
- Try generating a new app password

### "Email service not configured" error
- Check that all environment variables are set in `.env.local`
- Restart your dev server after changing `.env.local`

### Emails not arriving
- Check your spam folder
- Verify `EMAIL_TO` matches your email address
- Make sure the app password is correct

## Alternative Email Providers

If you prefer not to use Gmail, you can use other providers:

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your.email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
SMTP_USER=your.email@yahoo.com
SMTP_PASS=your-app-password
```

### SendGrid (for production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Deploying to Vercel

When you deploy to Vercel:

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add all your SMTP variables there
4. Redeploy your site

**Never commit your `.env.local` file to Git!** (It's already in `.gitignore`)

## How It Works

1. User fills out the contact form
2. Form data is sent to `/api/contact` endpoint
3. The API route uses nodemailer to send an email via Gmail's SMTP
4. Email arrives in your inbox with the user's message
5. User sees a success toast notification

## Features Included

✅ Form validation (all fields required)
✅ Email validation
✅ Loading state while sending
✅ Beautiful toast notifications (success/error)
✅ Form reset after successful submission
✅ Error handling with user-friendly messages

## Need Help?

If you run into issues:
1. Check the browser console for errors
2. Check your terminal where the dev server is running
3. Verify all environment variables are set correctly
4. Make sure your dev server was restarted after changing `.env.local`
