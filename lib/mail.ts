import nodemailer from "nodemailer";

function boolEnv(v: string | undefined) {
  return (v ?? "").toLowerCase() === "true";
}

export async function sendMail(subject: string, text: string) {
  if (!boolEnv(process.env.MAIL_ENABLE)) return;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = (process.env.SMTP_SECURE ?? "").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const from = process.env.MAIL_FROM;
  const to = process.env.MAIL_TO;

  if (!host || !user || !pass || !from || !to) {
    throw new Error("Missing mail env vars (SMTP_HOST/USER/PASS, MAIL_FROM/TO)");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
}
