import { Resend } from "resend";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada. E-mail não enviado.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Organiza.AI <onboarding@resend.dev>", // Endereço padrão de teste do Resend
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Erro do Resend:", error);
      throw error;
    }

    console.log("E-mail enviado via Resend:", data);
    return data;
  } catch (error) {
    console.error("Falha ao enviar e-mail:", error);
    throw error;
  }
}
