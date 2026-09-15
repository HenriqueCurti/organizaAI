import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe um usuário cadastrado com este e-mail" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 horas

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: verifyToken,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyLink = `${appUrl}/verificar-email?token=${verifyToken}`;

    await sendEmail({
      to: user.email,
      subject: "Bem-vindo! Confirme seu e-mail - Organiza.AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Confirmação de E-mail</h2>
          <p>Olá ${user.name},</p>
          <p>Obrigado por se cadastrar no Organiza.AI!</p>
          <p>Para ativar sua conta e acessar o painel, por favor confirme seu e-mail clicando no botão abaixo:</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Confirmar E-mail</a>
          <p>Este link é válido por 24 horas.</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Cadastro realizado. Verifique seu e-mail.", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao criar conta" },
      { status: 500 }
    );
  }
}
