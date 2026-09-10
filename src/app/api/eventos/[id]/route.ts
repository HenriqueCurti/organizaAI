import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locationName: z.string().optional(),
  pixKey: z.string().optional(),
  pixKeyType: z.string().optional(),
  pixReceiverName: z.string().optional(),
  minPayingAge: z.coerce.number().min(0).optional(),
  enableBbq: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      costs: {
        orderBy: { createdAt: "asc" },
      },
      families: {
        include: {
          members: {
            orderBy: { age: "desc" },
          },
          payments: {
            orderBy: { paidAt: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      bbqConfig: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const isOwner = user ? event.creatorId === user.id : false;
  const memberRecord = user ? event.members.find((m) => m.userId === user.id) : null;
  const canEdit = isOwner || Boolean(memberRecord?.canEdit);

  // Fórmulas de Rateio
  const totalCosts = event.costs.reduce((sum, cost) => sum + cost.amount, 0);

  // Participantes pagantes globais (idade >= minPayingAge)
  let totalPayingParticipants = 0;
  let totalExemptParticipants = 0;

  event.families.forEach((family) => {
    family.members.forEach((member) => {
      if (member.age >= event.minPayingAge) {
        totalPayingParticipants += 1;
      } else {
        totalExemptParticipants += 1;
      }
    });
  });

  const costPerQuota =
    totalPayingParticipants > 0 ? totalCosts / totalPayingParticipants : 0;

  // Resumo por família
  const familiesSummary = event.families.map((family) => {
    const payingCount = family.members.filter((m) => m.age >= event.minPayingAge).length;
    const exemptCount = family.members.length - payingCount;
    const familyTotalCost = Number((payingCount * costPerQuota).toFixed(2));

    const paymentsSum = family.payments.reduce((sum, p) => sum + p.amount, 0);
    const familyTotalPaid = Number(
      (family.payments.length > 0
        ? paymentsSum
        : family.paymentStatus === "PAID"
        ? familyTotalCost
        : 0
      ).toFixed(2)
    );
    const familyPendingAmount = Number(
      Math.max(0, familyTotalCost - familyTotalPaid).toFixed(2)
    );

    let status = family.paymentStatus;
    if (familyTotalPaid >= familyTotalCost && familyTotalCost > 0) {
      status = "PAID";
    } else if (familyTotalPaid > 0) {
      status = "PARTIAL";
    } else {
      status = "PENDING";
    }

    return {
      ...family,
      paymentStatus: status,
      payingCount,
      exemptCount,
      familyTotalCost,
      familyTotalPaid,
      familyPendingAmount,
    };
  });

  const totalPaidAmount = familiesSummary.reduce(
    (sum, f) => sum + f.familyTotalPaid,
    0
  );

  const totalPendingAmount = Math.max(0, totalCosts - totalPaidAmount);

  return NextResponse.json({
    event: {
      ...event,
      isOwner,
      canEdit,
      totalCosts,
      totalPayingParticipants,
      totalExemptParticipants,
      costPerQuota: Number(costPerQuota.toFixed(2)),
      totalPaidAmount: Number(totalPaidAmount.toFixed(2)),
      totalPendingAmount: Number(totalPendingAmount.toFixed(2)),
      families: familiesSummary,
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const existingEvent = await prisma.event.findUnique({
    where: { id },
    include: { members: { where: { userId: user.id } } },
  });

  if (!existingEvent) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const isOwner = existingEvent.creatorId === user.id;
  const canEdit = isOwner || Boolean(existingEvent.members[0]?.canEdit);

  if (!canEdit) {
    return NextResponse.json(
      { error: "Você não tem permissão para editar este evento" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const updated = await prisma.event.update({
      where: { id },
      data,
    });

    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const existingEvent = await prisma.event.findUnique({
    where: { id },
  });

  if (!existingEvent) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  if (existingEvent.creatorId !== user.id) {
    return NextResponse.json(
      { error: "Apenas o criador do evento pode excluí-lo" },
      { status: 403 }
    );
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ message: "Evento excluído com sucesso" });
}
