import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;
let warnedMissingConfig = false;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    if (!warnedMissingConfig) {
      console.error(
        "[mailer] SMTP_HOST is not set — emails will NOT be sent. " +
          "Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD as environment variables on the server."
      );
      warnedMissingConfig = true;
    }
    return null;
  }

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
    // SMTP not configured — logged loudly above so this is visible in server logs.
    return { sent: false, reason: "SMTP_HOST not configured" };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || "Aarnav Scientific <no-reply@aarnavscientific.co.in>",
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${to}:`, err);
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}