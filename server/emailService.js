import nodemailer from 'nodemailer';

/**
 * UPLOOKZ Real Email Delivery Service
 * Delivers branded verification codes via Gmail, SMTP, or Resend
 */

let cachedTransporter = null;

function getTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASS;

  // 1. Direct Gmail Configuration (Highest reliability with Gmail App Password)
  if (gmailUser && gmailPass) {
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser.trim(),
          pass: gmailPass.replace(/\s+/g, ''), // Strip spaces from Google 16-character App Passwords
        },
      });
    }
    return cachedTransporter;
  }

  // 2. Standard SMTP Gateway (Brevo, SendGrid, Amazon SES, Custom SMTP)
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }
    return cachedTransporter;
  }

  return null;
}

/**
 * Generate branded HTML email template for UPLOOKZ OTP
 */
function buildOtpEmailHtml(otp, email) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your UPLOOKZ Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #0EA5E9, #38BDF8);"></td>
          </tr>

          <!-- Content Wrapper -->
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              
              <!-- Brand Logo -->
              <div style="margin-bottom: 24px; display: inline-block;">
                <table role="presentation" cellspacing="0" cellpadding="0" align="center">
                  <tr>
                    <td style="background-color: #0EA5E9; width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle; color: #FFFFFF; font-weight: bold; font-size: 22px;">
                      U
                    </td>
                    <td style="padding-left: 10px; font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">
                      UPLOOKZ<span style="color: #0EA5E9;">.</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Heading -->
              <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 10px 0; letter-spacing: -0.3px;">
                Your Verification Code
              </h1>
              
              <p style="font-size: 14px; color: #64748B; margin: 0 0 28px 0; line-height: 1.5;">
                Enter this 6-digit code to complete your verification for <strong style="color: #111827;">${email}</strong>.
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #F0F9FF; border: 2px dashed #BAE6FD; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                <span style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0284C7; display: block;">
                  ${otp}
                </span>
              </div>

              <!-- Expiry & Safety Notices -->
              <p style="font-size: 12px; color: #94A3B8; margin: 0 0 8px 0;">
                ⏱ Valid for <strong>5 minutes</strong>.
              </p>
              <p style="font-size: 12px; color: #94A3B8; margin: 0; line-height: 1.4;">
                🔒 If you did not request this code, you can safely ignore this email. Never share your verification code with anyone.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 32px; text-align: center;">
              <p style="font-size: 11px; color: #94A3B8; margin: 0;">
                © ${new Date().getFullYear()} UPLOOKZ. Upgrade Your Look. Without Waiting.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send OTP to email address
 */
export async function sendEmailVerification(email, otp) {
  // 1. Check for Resend API Key
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'UPLOOKZ <onboarding@resend.dev>',
          to: email,
          subject: `Your UPLOOKZ Verification Code: ${otp}`,
          html: buildOtpEmailHtml(otp, email),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[UPLOOKZ EMAIL SERVICE] OTP successfully delivered via Resend API to: ${email}`);
        return {
          success: true,
          provider: 'resend',
          message: 'Verification code sent to your email inbox.',
        };
      }
      console.error('[UPLOOKZ EMAIL SERVICE] Resend API error:', data);
    } catch (err) {
      console.error('[UPLOOKZ EMAIL SERVICE] Resend fetch error:', err.message);
    }
  }

  // 2. Check for SMTP / Gmail Transporter
  const transporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.GMAIL_USER || `"UPLOOKZ Verification" <noreply@uplookz.com>`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Your UPLOOKZ Verification Code: ${otp}`,
        text: `Your UPLOOKZ verification code is: ${otp}. It is valid for 5 minutes. Do not share this code.`,
        html: buildOtpEmailHtml(otp, email),
      });

      console.log(`[UPLOOKZ EMAIL SERVICE] OTP successfully sent via SMTP to: ${email}`);
      return {
        success: true,
        provider: 'smtp',
        message: 'Verification code sent to your email inbox.',
      };
    } catch (err) {
      console.error(`[UPLOOKZ EMAIL SERVICE] SMTP dispatch error:`, err.message);
      return {
        success: false,
        provider: 'smtp_failed',
        error: err.message,
        devCode: otp,
        message: `Failed to deliver email: ${err.message}. Please verify your SMTP credentials in .env.`,
      };
    }
  }

  // 3. Fallback Dev Mode (when no SMTP credentials are configured yet)
  console.log('---------------------------------------------------------');
  console.log(`[UPLOOKZ EMAIL NOTIFICATION]`);
  console.log(`Recipient: ${email}`);
  console.log(`Code: [ ${otp} ]`);
  console.log(`Note: To deliver real emails to actual inboxes, configure GMAIL_USER & GMAIL_APP_PASS or SMTP credentials in .env!`);
  console.log('---------------------------------------------------------');

  return {
    success: true,
    provider: 'dev_logger',
    devCode: otp,
    message: 'Verification code generated. (Configure .env to send to real inbox).',
  };
}
