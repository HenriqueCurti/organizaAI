import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Para não expor quais e-mails estão cadastrados, retornamos sucesso de qualquer forma
      return NextResponse.json({ success: true });
    }

    // Gera um token aleatório
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora de validade

    // Salva o token no banco, apagando os antigos se houver
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
      },
    });

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/redefinir-senha?token=${resetToken}`;

    // Envia o e-mail
    await sendEmail({
      to: user.email,
      subject: "Recuperação de Senha - Organiza.AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperação de Senha</h2>
          <p>Olá ${user.name},</p>
          <p>Recebemos um pedido para redefinir sua senha no Organiza.AI.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Redefinir Senha</a>
          <p>Este link é válido por 1 hora.</p>
          <p>Se você não solicitou isso, pode ignorar este e-mail.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
  }
}
