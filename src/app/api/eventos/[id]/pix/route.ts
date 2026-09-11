import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePixPayload, generatePixQrCode } from "@/lib/pix";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");
  const customAmountParam = searchParams.get("amount");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      costs: true,
      families: {
        include: { members: true, payments: true },
      },
    },
  });

  if (!event || event.deletedAt) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  if (!event.pixKey) {
    return NextResponse.json(
      { error: "Organizador ainda não cadastrou a chave Pix para este evento" },
      { status: 400 }
    );
  }

  // Rateio
  const totalCosts = event.costs.reduce((sum, c) => sum + c.amount, 0);
  let totalPayingParticipants = 0;
  event.families.forEach((f) => {
    f.members.forEach((m) => {
      if (m.age >= event.minPayingAge) totalPayingParticipants++;
    });
  });

  const isClosed = event.status === "CLOSED";
  const effectiveDivisor = isClosed
    ? (totalPayingParticipants > 0 ? totalPayingParticipants : (event.estimatedPayingAttendees || 1))
    : Math.max(totalPayingParticipants, event.estimatedPayingAttendees || 1);

  const costPerQuota = effectiveDivisor > 0 ? totalCosts / effectiveDivisor : 0;

  let amountToPay = costPerQuota;
  let familyTotalCost = costPerQuota;
  let familyTotalPaid = 0;
  let pendingAmount = costPerQuota;
  let isFullyPaid = false;

  if (familyId) {
    const family = event.families.find((f) => f.id === familyId);
    if (family) {
      const payingCount = family.members.filter((m) => m.age >= event.minPayingAge).length;
      familyTotalCost = Number((payingCount * costPerQuota).toFixed(2));
      const paymentsSum = family.payments.reduce((sum, p) => sum + p.amount, 0);
      familyTotalPaid = Number(
        (family.payments.length > 0
          ? paymentsSum
          : family.paymentStatus === "PAID"
          ? familyTotalCost
          : 0
        ).toFixed(2)
      );
      pendingAmount = Number(Math.max(0, familyTotalCost - familyTotalPaid).toFixed(2));
      isFullyPaid = familyTotalPaid >= familyTotalCost && familyTotalCost > 0;

      if (customAmountParam && !isNaN(parseFloat(customAmountParam))) {
        amountToPay = Math.max(0, parseFloat(customAmountParam));
      } else {
        // Por padrão, gera com o saldo pendente (saldo devedor)
        amountToPay = pendingAmount;
      }
    }
  } else if (customAmountParam && !isNaN(parseFloat(customAmountParam))) {
    amountToPay = Math.max(0, parseFloat(customAmountParam));
  }

  const roundedAmount = Number(amountToPay.toFixed(2));

  const payload = generatePixPayload({
    key: event.pixKey,
    name: event.pixReceiverName || "ORGANIZADOR",
    city: event.pixCity || "BRASILIA",
    amount: roundedAmount > 0 ? roundedAmount : undefined,
    txId: familyId ? familyId.slice(-10) : undefined,
  });

  const qrCode = await generatePixQrCode(payload);

  return NextResponse.json({
    pix: {
      key: event.pixKey,
      receiverName: event.pixReceiverName || "ORGANIZADOR",
      amount: roundedAmount,
      totalCost: Number(familyTotalCost.toFixed(2)),
      totalPaid: Number(familyTotalPaid.toFixed(2)),
      pendingAmount: Number(pendingAmount.toFixed(2)),
      isFullyPaid,
      paymentsEnabled: isClosed,
      isClosed,
      status: event.status || "OPEN",
      payload,
      qrCode,
    },
  });
}
