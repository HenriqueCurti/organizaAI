import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { calculateFamilyQuotas } from "@/lib/quotaUtils";

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locationName: z.string().optional().nullable(),
  locationUrl: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  pixKey: z.string().optional().nullable(),
  pixKeyType: z.string().optional().nullable(),
  pixReceiverName: z.string().optional().nullable(),
  pixCity: z.string().optional().nullable(),
  minPayingAge: z.coerce.number().min(0).optional(),
  enableBbq: z.boolean().optional(),
  creationMode: z.enum(["QUICK", "DETAILED"]).optional(),
  status: z.enum(["OPEN", "CLOSED", "COMPLETED"]).optional(),
  estimatedAttendees: z.coerce.number().min(1).optional().nullable(),
  estimatedPayingAttendees: z.coerce.number().min(0).optional().nullable(),
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

  if (!event || event.deletedAt) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const isOwner = user ? event.creatorId === user.id : false;
  const memberRecord = user ? event.members.find((m) => m.userId === user.id) : null;
  const canEdit = isOwner || Boolean(memberRecord?.canEdit);

  // Fórmulas de Rateio
  const totalCosts = event.costs.reduce((sum, cost) => sum + cost.amount, 0);
  const isClosed = event.status === "CLOSED";
  const paymentsEnabled = isClosed;

  const {
    familyQuotas,
    actualPayingParticipants,
    actualExemptParticipants,
    effectiveDivisor,
    costPerQuota
  } = calculateFamilyQuotas({
    families: event.families,
    totalCosts,
    minPayingAge: event.minPayingAge,
    estimatedPayingAttendees: event.estimatedPayingAttendees,
    isClosed
  });

  const isProjectedQuota = !isClosed;
  const isEstimatedRateio = actualPayingParticipants === 0;

  const effectivePayingParticipants = effectiveDivisor;

  const effectiveTotalParticipants = isClosed
    ? (actualPayingParticipants + actualExemptParticipants)
    : Math.max(actualPayingParticipants + actualExemptParticipants, event.estimatedAttendees || effectiveDivisor);

  const effectiveExemptParticipants = isClosed
    ? actualExemptParticipants
    : Math.max(0, effectiveTotalParticipants - effectivePayingParticipants);

  // Resumo por família
  const familiesSummary = event.families.map((family) => {
    const payingCount = family.members.filter((m) => m.age >= event.minPayingAge).length;
    const exemptCount = family.members.length - payingCount;
    const familyTotalCost = familyQuotas.get(family.id) || 0;

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
      status: event.status || "OPEN",
      isClosed,
      paymentsEnabled,
      isProjectedQuota,
      isOwner,
      canEdit,
      totalCosts,
      totalPayingParticipants: effectivePayingParticipants,
      totalExemptParticipants: effectiveExemptParticipants,
      totalParticipants: effectiveTotalParticipants,
      actualPayingParticipants,
      actualExemptParticipants,
      actualTotalParticipants: actualPayingParticipants + actualExemptParticipants,
      isEstimatedRateio,
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

  if (!existingEvent || existingEvent.deletedAt) {
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

  if (!existingEvent || existingEvent.deletedAt) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  if (existingEvent.creatorId !== user.id) {
    return NextResponse.json(
      { error: "Apenas o criador do evento pode excluí-lo" },
      { status: 403 }
    );
  }

  await prisma.event.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({ message: "Evento excluído com sucesso" });
}
