import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createPaymentSchema = z.object({
  amount: z.coerce.number().positive("O valor do pagamento deve ser maior que zero"),
  method: z.enum(["PIX", "DINHEIRO", "TRANSFERENCIA", "CARTAO", "OUTRO"]).default("PIX"),
  paidAt: z.string().optional(),
  note: z.string().optional().nullable(),
});

export async function GET(
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

  const canView = event.creatorId === user.id || event.members.length > 0;
  if (!canView) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const family = await prisma.family.findUnique({
    where: { id: familyId, eventId },
    include: {
      members: true,
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!family) {
    return NextResponse.json({ error: "Família não encontrada" }, { status: 404 });
  }

  // Rateio
  const totalCosts = event.costs.reduce((sum, c) => sum + c.amount, 0);
  let totalPayingParticipants = 0;
  event.families.forEach((f) => {
    f.members.forEach((m) => {
      if (m.age >= event.minPayingAge) totalPayingParticipants++;
    });
  });

  const costPerQuota = totalPayingParticipants > 0 ? totalCosts / totalPayingParticipants : 0;
  const payingCount = family.members.filter((m) => m.age >= event.minPayingAge).length;
  const familyTotalCost = Number((payingCount * costPerQuota).toFixed(2));
  const familyTotalPaid = Number(
    family.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
  );
  const familyPendingAmount = Number(
    Math.max(0, familyTotalCost - familyTotalPaid).toFixed(2)
  );

  return NextResponse.json({
    payments: family.payments,
    summary: {
      familyTotalCost,
      familyTotalPaid,
      familyPendingAmount,
      payingCount,
      paymentStatus: family.paymentStatus,
    },
  });
}

export async function POST(
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
    return NextResponse.json({ error: "Sem permissão para registrar pagamento" }, { status: 403 });
  }

  if (event.status !== "CLOSED") {
    return NextResponse.json(
      { error: "Os pagamentos só podem ser lançados após a liberação do evento (fechamento da lista)." },
      { status: 400 }
    );
  }

  const family = await prisma.family.findUnique({
    where: { id: familyId, eventId },
    include: {
      members: true,
      payments: true,
    },
  });

  if (!family) {
    return NextResponse.json({ error: "Família não encontrada" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { amount, method, paidAt, note } = parsed.data;

    const payment = await prisma.payment.create({
      data: {
        familyId,
        amount,
        method,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        note: note || null,
      },
    });

    // Recalcular status da família
    const allPayments = await prisma.payment.findMany({
      where: { familyId },
    });
    const newTotalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const totalCosts = event.costs.reduce((sum, c) => sum + c.amount, 0);
    let totalPayingParticipants = 0;
    event.families.forEach((f) => {
      f.members.forEach((m) => {
        if (m.age >= event.minPayingAge) totalPayingParticipants++;
      });
    });
    const costPerQuota = totalPayingParticipants > 0 ? totalCosts / totalPayingParticipants : 0;
    const payingCount = family.members.filter((m) => m.age >= event.minPayingAge).length;
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
      payment,
      summary: {
        familyTotalCost,
        familyTotalPaid: Number(newTotalPaid.toFixed(2)),
        familyPendingAmount: Number(Math.max(0, familyTotalCost - newTotalPaid).toFixed(2)),
        paymentStatus: newStatus,
      },
    });
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json({ error: "Erro interno ao registrar pagamento" }, { status: 500 });
  }
}
