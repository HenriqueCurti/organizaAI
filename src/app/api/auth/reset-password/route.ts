import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token e nova senha são obrigatórios" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken || verificationToken.type !== "PASSWORD_RESET") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.json({ error: "O token expirou. Solicite uma nova recuperação." }, { status: 400 });
    }

    // Atualiza a senha
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { passwordHash },
    });

    // Remove o token para que não seja reusado
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
  }
}
