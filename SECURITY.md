# Security Checklist for Portfolio Website

## ✅ Environment Variables Security

### Current Status
- [x] `.env.local` is in `.gitignore` (all `.env*` files except `.env.example`)
- [x] `.env.example` template created with placeholder values
- [x] SMTP credentials are loaded from environment variables only
- [x] No hardcoded secrets in the codebase

### Required Environment Variables
The following variables must be set in `.env.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` (or `465` for SSL) |
| `SMTP_USER` | Your email address | `your-email@gmail.com` |
| `SMTP_PASS` | App password (NOT regular password) | `"abcd efgh ijkl mnop"` |
| `EMAIL_TO` | Recipient email for contact form | `your-email@gmail.com` |
| `EMAIL_FROM` | Sender email address | `noreply@yourdomain.com` |

## 🔒 Best Practices

### 1. Gmail App Passwords
If using Gmail, you **must** use an App Password:
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate a new app password for "Mail"
4. Use this 16-character password in `SMTP_PASS`

### 2. Never Commit Secrets
- ✅ `.env.local` is gitignored
- ✅ Only commit `.env.example` with placeholder values
- ⚠️ Before committing, always run: `git status` to verify no env files are staged

### 3. Deployment Security
When deploying to production (Vercel, Netlify, etc.):
- Add environment variables through the hosting platform's dashboard
- Never add them to the repository
- Use the same variable names as in `.env.local`

### 4. Code Review Checklist
Before committing code changes:
- [ ] No `console.log()` statements with sensitive data
- [ ] No hardcoded emails, passwords, or API keys
- [ ] All secrets loaded from `process.env`
- [ ] Error messages don't expose sensitive information

## 🚨 What to Do If Credentials Are Exposed

If you accidentally commit credentials:

1. **Immediately revoke the exposed credentials**
   - For Gmail: Delete the App Password and generate a new one
   - For other services: Rotate API keys/passwords

2. **Remove from Git history**
   ```bash
   # Remove the file from history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (WARNING: This rewrites history)
   git push origin --force --all
   ```

3. **Update `.env.local` with new credentials**

4. **Consider the repository compromised** - If it was public, assume the credentials were accessed

## 📋 Regular Security Audits

### Monthly Checks
- [ ] Review who has access to your email account
- [ ] Check for any unauthorized login attempts
- [ ] Rotate App Passwords if needed
- [ ] Review `.gitignore` to ensure it's still protecting secrets

### Before Each Deployment
- [ ] Verify environment variables are set in production
- [ ] Test contact form with production credentials
- [ ] Check error logs for any exposed secrets

## 🔗 Additional Resources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Gmail App Passwords Guide](https://support.google.com/accounts/answer/185833)
