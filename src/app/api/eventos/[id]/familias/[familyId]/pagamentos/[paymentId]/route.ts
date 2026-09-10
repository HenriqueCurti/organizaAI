import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; familyId: string; paymentId: string }> }
) {
  const { id: eventId, familyId, paymentId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      members: { where: { userId: user.id } },
      costs: true,
      families: {
        include: { members: true },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const canEdit = event.creatorId === user.id || Boolean(event.members[0]?.canEdit);
  if (!canEdit) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId, familyId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Lançamento de pagamento não encontrado" }, { status: 404 });
  }

  await prisma.payment.delete({
    where: { id: paymentId },
  });

  // Recalcular status da família
  const remainingPayments = await prisma.payment.findMany({
    where: { familyId },
  });
  const newTotalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

  const totalCosts = event.costs.reduce((sum, c) => sum + c.amount, 0);
  let totalPayingParticipants = 0;
  event.families.forEach((f) => {
    f.members.forEach((m) => {
      if (m.age >= event.minPayingAge) totalPayingParticipants++;
    });
  });
  const costPerQuota = totalPayingParticipants > 0 ? totalCosts / totalPayingParticipants : 0;
  const family = event.families.find((f) => f.id === familyId);
  const payingCount = family
    ? family.members.filter((m) => m.age >= event.minPayingAge).length
    : 0;
  const familyTotalCost = Number((payingCount * costPerQuota).toFixed(2));

  let newStatus: string = "PENDING";
  if (newTotalPaid >= familyTotalCost && familyTotalCost > 0) {
    newStatus = "PAID";
  } else if (newTotalPaid > 0) {
    newStatus = "PARTIAL";
  }

  await prisma.family.update({
    where: { id: familyId },
    data: { paymentStatus: newStatus },
  });

  return NextResponse.json({
    message: "Pagamento estornado com sucesso",
    summary: {
      familyTotalCost,
      familyTotalPaid: Number(newTotalPaid.toFixed(2)),
      familyPendingAmount: Number(Math.max(0, familyTotalCost - newTotalPaid).toFixed(2)),
      paymentStatus: newStatus,
    },
  });
}
