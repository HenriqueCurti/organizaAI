import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    console.warn("SMTP_EMAIL ou SMTP_PASSWORD não configurados. E-mail não enviado.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Organiza.AI" <${smtpEmail}>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw error;
  }
}
