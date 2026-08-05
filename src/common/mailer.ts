import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transporter;
}

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const t = getTransporter();
  if (!t) {
    // SMTP not configured (e.g. local dev) — log instead of throwing so
    // the calling flow (inquiry, contact) doesn't fail.
    console.log(`[mailer] SMTP not configured. Would send to ${to}: ${subject}`);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || "Aarnav Scientific <no-reply@aarnavscientific.co.in>",
    to,
    subject,
    html,
  });
}