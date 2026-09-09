import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const addMemberSchema = z.object({
  email: z.string().email("E-mail inválido"),
  canEdit: z.boolean().default(true),
  role: z.enum(["CO_ORGANIZER", "PARTICIPANT"]).default("CO_ORGANIZER"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    creator: event.creator,
    members: event.members,
    isOwner: event.creatorId === user.id,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  // Apenas o criador do evento pode atribuir administradores / co-organizadores
  if (event.creatorId !== user.id) {
    return NextResponse.json(
      { error: "Apenas o criador do evento pode gerenciar os administradores e co-organizadores" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = addMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { email, canEdit, role } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          error:
            "Nenhum usuário encontrado com este e-mail. Peça para a pessoa se cadastrar na plataforma primeiro.",
        },
        { status: 404 }
      );
    }

    if (targetUser.id === event.creatorId) {
      return NextResponse.json(
        { error: "Você já é o criador e proprietário deste evento" },
        { status: 400 }
      );
    }

    // Upsert em EventMember
    const member = await prisma.eventMember.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: targetUser.id,
        },
      },
      update: {
        role,
        canEdit,
      },
      create: {
        eventId,
        userId: targetUser.id,
        role,
        canEdit,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      { message: "Co-organizador adicionado com sucesso!", member },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao adicionar membro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
