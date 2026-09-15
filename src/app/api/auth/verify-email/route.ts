import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token é obrigatório" }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken || verificationToken.type !== "EMAIL_VERIFICATION") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { id: verificationToken.id } });
      return NextResponse.json({ error: "O token expirou. Cadastre-se novamente." }, { status: 400 });
    }

    // Atualiza o usuário
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    // Remove o token para que não seja reusado
    await prisma.verificationToken.deleteMany({ where: { id: verificationToken.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
  }
}
