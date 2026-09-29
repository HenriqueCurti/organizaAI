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

    const request = await prisma.eventViewRequest.findFirst({
      where: { id: requestId, eventId: id },
    });

    if (!request) {
      return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
    }

    await prisma.eventViewRequest.update({
      where: { id: requestId },
      data: { status },
    });

    if (status === "APPROVED") {
      // Create EventMember with role PARTICIPANT and canEdit false if not exists
      const existingMember = await prisma.eventMember.findUnique({
        where: { eventId_userId: { eventId: id, userId: request.userId } },
      });

      if (!existingMember) {
        await prisma.eventMember.create({
          data: {
            eventId: id,
            userId: request.userId,
            role: "PARTICIPANT",
            canEdit: false,
          },
        });
      }
    } else if (status === "REJECTED") {
      await prisma.eventMember.deleteMany({
        where: {
          eventId: id,
          userId: request.userId,
          role: "PARTICIPANT", // Delete only if they are a simple participant
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
