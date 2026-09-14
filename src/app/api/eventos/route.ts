import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

const createEventSchema = z.object({
  title: z.string().min(3, "O título do evento deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inicial inválida"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Data final inválida"),
  locationName: z.string().optional(),
  locationUrl: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  pixKey: z.string().optional(),
  pixKeyType: z.string().optional(),
  pixReceiverName: z.string().optional(),
  minPayingAge: z.coerce.number().min(0).default(12),
  enableBbq: z.boolean().default(true),
  creationMode: z.enum(["QUICK", "DETAILED"]).default("DETAILED"),
  estimatedAttendees: z.coerce.number().min(1).optional().nullable(),
  estimatedPayingAttendees: z.coerce.number().min(0).optional().nullable(),
  initialCosts: z.array(z.object({
    name: z.string().min(1),
    amount: z.coerce.number().positive(),
    category: z.string().optional().default("ACOMODACAO")
  })).optional(),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const now = new Date();

  const baseWhere: any = {
    deletedAt: null,
    OR: [
      { creatorId: user.id },
      { members: { some: { userId: user.id } } },
    ],
  };

  let orderByClause: any = { startDate: "desc" };

  if (status === "upcoming") {
    baseWhere.endDate = { gte: now };
    orderByClause = { startDate: "asc" };
  } else if (status === "past") {
    baseWhere.endDate = { lt: now };
    orderByClause = { startDate: "desc" };
  }

  const totalCount = await prisma.event.count({ where: baseWhere });
  const totalPages = Math.ceil(totalCount / limit);

  const events = await prisma.event.findMany({
    where: baseWhere,
    orderBy: orderByClause,
    skip,
    take: limit,
    include: {
      creator: { select: { id: true, name: true, email: true } },
      members: { where: { userId: user.id } },
      costs: true,
      families: {
        include: {
          members: true,
        },
      },
    },
  });

  const formattedEvents = events.map((event) => {
    const isOwner = event.creatorId === user.id;
    const memberRecord = event.members[0];
    const canEdit = isOwner || memberRecord?.canEdit || false;

    const totalCost = event.costs.reduce((acc, c) => acc + c.amount, 0);
    const actualParticipants = event.families.reduce(
      (acc, f) => acc + f.members.length,
      0
    );
    const actualPayingParticipants = event.families.reduce(
      (acc, f) => acc + f.members.filter((m) => m.age >= event.minPayingAge).length,
      0
    );

    const isEstimatedParticipants = actualParticipants === 0 && Boolean(event.estimatedAttendees);
    const totalParticipants = isEstimatedParticipants
      ? (event.estimatedAttendees || 0)
      : actualParticipants;
    const payingParticipants = isEstimatedParticipants
      ? (event.estimatedPayingAttendees ?? event.estimatedAttendees ?? 0)
      : actualPayingParticipants;

    return {
      ...event,
      isOwner,
      canEdit,
      totalCost,
      totalParticipants,
      payingParticipants,
      actualParticipants,
      actualPayingParticipants,
      isEstimatedParticipants,
      isPast: new Date(event.endDate) < now,
    };
  });

  if (status === "all") {
    const upcomingEvents = formattedEvents
      .filter((e) => !e.isPast)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const pastEvents = formattedEvents
      .filter((e) => e.isPast)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return NextResponse.json({ events: [...upcomingEvents, ...pastEvents] });
  }

  return NextResponse.json({ 
    events: formattedEvents,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages
    }
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      startDate,
      endDate,
      locationName,
      locationUrl,
      latitude,
      longitude,
      pixKey,
      pixKeyType,
      pixReceiverName,
      minPayingAge,
      enableBbq,
      creationMode,
      estimatedAttendees,
      estimatedPayingAttendees,
      initialCosts,
    } = parsed.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json(
        { error: "A data de término não pode ser anterior à data de início" },
        { status: 400 }
      );
    }

    // Calcula quantidade de dias para churrascômetro
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const inviteCode = crypto.randomBytes(4).toString("hex");

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: start,
        endDate: end,
        locationName,
        locationUrl: locationUrl || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        pixKey,
        pixKeyType,
        pixReceiverName: pixReceiverName || user.name,
        minPayingAge,
        enableBbq,
        creationMode,
        estimatedAttendees: estimatedAttendees ?? null,
        estimatedPayingAttendees: estimatedPayingAttendees ?? null,
        inviteCode,
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
            canEdit: true,
          },
        },
        costs: initialCosts && initialCosts.length > 0 ? {
          create: initialCosts.map((c) => ({
            name: c.name,
            amount: c.amount,
            category: c.category || "ACOMODACAO",
          })),
        } : undefined,
        bbqConfig: {
          create: {
            daysCount,
            meatGramsMale: 450,
            meatGramsFemale: 350,
            meatGramsChild: 180,
            sodaMlPerPerson: 1000,
            juiceMlPerPerson: 500,
            waterMlPerPerson: 500,
          },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar evento" },
      { status: 500 }
    );
  }
}
