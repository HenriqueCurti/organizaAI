import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateCostSchema = z.object({
  name: z.string().min(2).optional(),
  amount: z.coerce.number().positive().optional(),
  dueDate: z.string().optional().nullable(),
  category: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  const { id: eventId, costId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { members: { where: { userId: user.id } } },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const canEdit = event.creatorId === user.id || Boolean(event.members[0]?.canEdit);
  if (!canEdit) {
    return NextResponse.json({ error: "Sem permissão para editar" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateCostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (data.dueDate !== undefined) {
      data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const updatedCost = await prisma.cost.update({
      where: { id: costId, eventId },
      data,
    });

    return NextResponse.json({ cost: updatedCost });
  } catch (error) {
    console.error("Erro ao atualizar custo:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar custo" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  const { id: eventId, costId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { members: { where: { userId: user.id } } },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const canEdit = event.creatorId === user.id || Boolean(event.members[0]?.canEdit);
  if (!canEdit) {
    return NextResponse.json({ error: "Sem permissão para excluir" }, { status: 403 });
  }

  await prisma.cost.delete({
    where: { id: costId, eventId },
  });

  return NextResponse.json({ message: "Custo removido com sucesso" });
}
