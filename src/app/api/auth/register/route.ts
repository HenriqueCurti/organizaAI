import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken } from "@/lib/auth";
import { z } from "zod";

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

    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      { message: "Cadastro realizado com sucesso", user },
      { status: 201 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao criar conta" },
      { status: 500 }
    );
  }
}
