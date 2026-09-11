import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createCostSchema = z.object({
  name: z.string().min(2, "O nome do custo é obrigatório"),
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  dueDate: z.string().optional().nullable(),
  category: z.string().default("OUTROS"),
});

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
    include: { members: { where: { userId: user.id } } },
  });

  if (!event || event.deletedAt) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const isOwner = event.creatorId === user.id;
  const canEdit = isOwner || Boolean(event.members[0]?.canEdit);

  if (!canEdit) {
    return NextResponse.json(
      { error: "Sem permissão para adicionar custos a este evento" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createCostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, amount, dueDate, category } = parsed.data;

    const cost = await prisma.cost.create({
      data: {
        eventId,
        name,
        amount,
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
      },
    });

    return NextResponse.json({ cost }, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar custo:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar custo" },
      { status: 500 }
    );
  }
}
