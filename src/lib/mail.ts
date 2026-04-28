import nodemailer from "nodemailer";
import { env } from "@/lib/env";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.password,
  },
});

export async function sendWelcomeEmail(to: string, name: string, verificationLink: string) {
  // Prevent sending if SMTP is not properly configured
  if (!env.smtp.host || env.smtp.host === "gmail" || env.smtp.host.trim() === "") {
    console.warn("⚠️ SMTP Host is missing or invalid ('gmail'). Please set SMTP_HOST=smtp.gmail.com in your .env file.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MenuVerse</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1a202c;
          margin: 0;
          padding: 0;
          background-color: #f7f3eb;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.08);
          border: 1px solid #e7dfd2;
        }
        .header {
          background-color: #0f766e;
          color: #ffffff;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-text {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 20px;
        }
        .message {
          color: #4b5563;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .cta-container {
          text-align: center;
          margin: 40px 0;
        }
        .button {
          background-color: #0f766e;
          color: #ffffff !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: bold;
          font-size: 16px;
          display: inline-block;
          transition: background-color 0.2s;
        }
        .footer {
          background-color: #fcfaf7;
          padding: 30px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          border-top: 1px solid #e7dfd2;
        }
        .unverified-badge {
          background-color: #fef2f2;
          color: #991b1b;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 30px;
          border: 1px solid #fee2e2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MenuVerse</h1>
        </div>
        <div class="content">
          <p class="welcome-text">Hi ${name}, welcome to the future of inventory management!</p>
          
          <div class="unverified-badge">
            <strong>Action Required:</strong> Your account is currently unverified. Please verify your email to unlock all features.
          </div>

          <p class="message">
            We're thrilled to have you on board. MenuVerse helps you transform your physical inventory into stunning 3D and AR experiences. 
            To get started and secure your account, please verify your email address by clicking the button below.
          </p>

          <div class="cta-container">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </div>

          <p class="message" style="font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${verificationLink}" style="color: #0f766e;">${verificationLink}</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MenuVerse AR. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: "Verify your MenuVerse account",
      html,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // We don't throw here to avoid breaking the signup flow if SMTP is not configured yet
  }
}
