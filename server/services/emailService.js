const nodemailer = require('nodemailer');

/**
 * MedQuad Email Service
 * Uses Gmail SMTP with App Password for free, reliable email delivery.
 */

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

/**
 * Generates a professional HTML email template for MedQuad.
 */
const buildEmailTemplate = ({ title, message, link, buttonText = 'View Details' }) => {
    const appUrl = process.env.CLIENT_URL || 'https://medquadhealth.com';
    const actionUrl = `${appUrl}${link}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2744 0%,#c0392b 100%);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:1px;">
                🏥 MedQuad Health Solutions
              </h1>
              <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">
                Professional Medical Equipment Management
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1a2744;margin:0 0 16px;font-size:20px;font-weight:600;">${title}</h2>
              <p style="color:#4a5568;font-size:15px;line-height:1.7;margin:0 0 32px;">${message}</p>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#c0392b,#e74c3c);border-radius:8px;">
                    <a href="${actionUrl}" 
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">
                      ${buttonText} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="color:#a0aec0;font-size:12px;margin:0;line-height:1.6;">
                You're receiving this because you have an active account on MedQuad Health Solutions.<br/>
                <a href="${appUrl}" style="color:#c0392b;text-decoration:none;">Visit Portal</a> · 
                <a href="${appUrl}/login" style="color:#c0392b;text-decoration:none;">Login</a>
              </p>
              <p style="color:#cbd5e0;font-size:11px;margin:12px 0 0;">
                © ${new Date().getFullYear()} MedQuad Health Solutions. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Sends a transactional email.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.title - Email subject and heading
 * @param {string} options.message - Body message
 * @param {string} options.link - Deep link for CTA button
 * @param {string} [options.buttonText] - CTA button label
 */
const sendEmail = async ({ to, title, message, link, buttonText }) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.warn('[Email] EMAIL_USER or EMAIL_APP_PASSWORD not set. Skipping email.');
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'MedQuad Health Solutions'}" <${process.env.EMAIL_USER}>`,
            to,
            subject: title,
            html: buildEmailTemplate({ title, message, link, buttonText }),
        });
        console.log(`[Email] ✅ Sent to ${to}: "${title}"`);
        return true;
    } catch (error) {
        console.error(`[Email] ❌ Failed to send to ${to}:`, error.message);
        return false;
    }
};

module.exports = { sendEmail };
