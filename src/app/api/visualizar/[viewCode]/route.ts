import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ viewCode: string }> }
) {
  const { viewCode } = await params;
  const user = await getCurrentUser();

  const event = await prisma.event.findUnique({
    where: { viewCode },
    select: {
      id: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      locationName: true,
      creator: { select: { name: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  let requestStatus = null;
  let isEditor = false;

  if (user) {
    const existingRequest = await prisma.eventViewRequest.findUnique({
      where: {
        eventId_userId: { eventId: event.id, userId: user.id },
      },
    });
    if (existingRequest) {
      requestStatus = existingRequest.status;
    }

    const membership = await prisma.eventMember.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
    });
    if (membership && (membership.role === "OWNER" || membership.role === "CO_ORGANIZER")) {
      isEditor = true;
      requestStatus = "APPROVED"; // Can view anyway
    }
  }

  return NextResponse.json({
    event,
    requestStatus,
    isEditor,
    isAuthenticated: !!user,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ viewCode: string }> }
) {
  const { viewCode } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { viewCode },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const existingRequest = await prisma.eventViewRequest.findUnique({
    where: {
      eventId_userId: { eventId: event.id, userId: user.id },
    },
  });

  if (existingRequest) {
    return NextResponse.json({ error: "Solicitação já enviada." }, { status: 400 });
  }

  const newRequest = await prisma.eventViewRequest.create({
    data: {
      eventId: event.id,
      userId: user.id,
      status: "PENDING",
    },
  });

  return NextResponse.json({ success: true, request: newRequest });
}
