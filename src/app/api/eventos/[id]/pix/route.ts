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

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      costs: true,
      families: {
        include: { members: true },
      },
    },
  });

  if (!event) {
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

  const costPerQuota = totalPayingParticipants > 0 ? totalCosts / totalPayingParticipants : 0;

  let amountToPay = costPerQuota;

  if (familyId) {
    const family = event.families.find((f) => f.id === familyId);
    if (family) {
      const payingCount = family.members.filter((m) => m.age >= event.minPayingAge).length;
      amountToPay = payingCount * costPerQuota;
    }
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
      payload,
      qrCode,
    },
  });
}
