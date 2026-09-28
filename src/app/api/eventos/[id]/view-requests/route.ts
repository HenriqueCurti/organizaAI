import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: user.id } },
  });

  if (!membership || !membership.canEdit) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const requests = await prisma.eventViewRequest.findMany({
    where: { eventId: id },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId: id, userId: user.id } },
  });

  if (!membership || !membership.canEdit) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  try {
    const { requestId, status } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    const updated = await prisma.eventViewRequest.updateMany({
      where: { id: requestId, eventId: id },
      data: { status },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
