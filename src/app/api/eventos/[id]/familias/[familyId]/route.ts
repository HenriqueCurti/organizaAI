import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateFamilySchema = z.object({
  familyName: z.string().min(2).optional(),
  responsibleName: z.string().min(2).optional(),
  responsiblePhone: z.string().optional().nullable(),
  responsibleEmail: z.string().email().optional().nullable().or(z.literal("")),
  paymentStatus: z.enum(["PENDING", "PAID"]).optional(),
  receiptNote: z.string().optional().nullable(),
  members: z
    .array(
      z.object({
        name: z.string().min(2),
        gender: z.string().default("OTHER"),
        age: z.coerce.number().min(0),
      })
    )
    .min(1)
    .optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; familyId: string }> }
) {
  const { id: eventId, familyId } = await params;
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
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateFamilySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { members, ...familyData } = parsed.data;

    // Atualizar dados da família
    const updated = await prisma.family.update({
      where: { id: familyId, eventId },
      data: {
        ...(familyData.familyName && { familyName: familyData.familyName }),
        ...(familyData.responsibleName && { responsibleName: familyData.responsibleName }),
        ...(familyData.responsiblePhone !== undefined && { responsiblePhone: familyData.responsiblePhone }),
        ...(familyData.responsibleEmail !== undefined && { responsibleEmail: familyData.responsibleEmail || null }),
        ...(familyData.paymentStatus && { paymentStatus: familyData.paymentStatus }),
        ...(familyData.receiptNote !== undefined && { receiptNote: familyData.receiptNote }),
      },
    });

    // Se membros foram enviados, sincronizar
    if (members && members.length > 0) {
      await prisma.participant.deleteMany({
        where: { familyId },
      });

      await prisma.participant.createMany({
        data: members.map((m) => ({
          familyId,
          name: m.name,
          gender: m.gender,
          age: m.age,
          isPaying: m.age >= event.minPayingAge,
        })),
      });
    }

    const fullFamily = await prisma.family.findUnique({
      where: { id: familyId },
      include: { members: true },
    });

    return NextResponse.json({ family: fullFamily });
  } catch (error) {
    console.error("Erro ao atualizar família:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar família" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; familyId: string }> }
) {
  const { id: eventId, familyId } = await params;
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
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.family.delete({
    where: { id: familyId, eventId },
  });

  return NextResponse.json({ message: "Família removida com sucesso" });
}
