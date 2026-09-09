import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateMemberSchema = z.object({
  canEdit: z.boolean().optional(),
  role: z.enum(["CO_ORGANIZER", "PARTICIPANT"]).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: eventId, memberId } = await params;
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

  if (event.creatorId !== user.id) {
    return NextResponse.json(
      { error: "Apenas o criador do evento pode alterar permissões de outros membros" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const updated = await prisma.eventMember.update({
      where: { id: memberId, eventId },
      data: parsed.data,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Erro ao atualizar permissão:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: eventId, memberId } = await params;
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

  if (event.creatorId !== user.id) {
    return NextResponse.json(
      { error: "Apenas o criador do evento pode remover membros e administradores" },
      { status: 403 }
    );
  }

  const member = await prisma.eventMember.findUnique({
    where: { id: memberId, eventId },
  });

  if (member && member.userId === event.creatorId) {
    return NextResponse.json(
      { error: "O criador do evento não pode ser removido da administração" },
      { status: 400 }
    );
  }

  await prisma.eventMember.delete({
    where: { id: memberId, eventId },
  });

  return NextResponse.json({ message: "Membro removido da administração com sucesso" });
}
