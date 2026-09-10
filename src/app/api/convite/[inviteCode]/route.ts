import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const rsvpSchema = z.object({
  familyName: z.string().min(2, "O nome da família é obrigatório"),
  responsibleName: z.string().min(2, "Seu nome é obrigatório"),
  responsibleEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  responsiblePhone: z.string().optional(),
  createAccount: z.boolean().default(false),
  password: z.string().optional(),
  members: z
    .array(
      z.object({
        name: z.string().min(2, "Nome do participante é obrigatório"),
        gender: z.string().default("OTHER"),
        age: z.coerce.number().min(0, "Idade inválida"),
      })
    )
    .min(1, "Adicione pelo menos um participante"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params;

  const event = await prisma.event.findUnique({
    where: { inviteCode },
    select: {
      id: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      locationName: true,
      minPayingAge: true,
      enableBbq: true,
      pixKey: true,
      pixKeyType: true,
      pixReceiverName: true,
      creator: {
        select: {
          name: true,
        },
      },
      costs: {
        select: {
          amount: true,
        },
      },
      families: {
        select: {
          members: {
            select: {
              age: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Convite inválido ou evento não encontrado" }, { status: 404 });
  }

  const totalCosts = event.costs.reduce((sum, c) => sum + c.amount, 0);
  let totalPayingParticipants = 0;

  event.families.forEach((f) => {
    f.members.forEach((m) => {
      if (m.age >= event.minPayingAge) {
        totalPayingParticipants++;
      }
    });
  });

  const estimatedCostPerQuota =
    totalPayingParticipants > 0 ? totalCosts / totalPayingParticipants : 0;

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      locationName: event.locationName,
      minPayingAge: event.minPayingAge,
      enableBbq: event.enableBbq,
      creatorName: event.creator.name,
      estimatedCostPerQuota: Number(estimatedCostPerQuota.toFixed(2)),
      pixKey: event.pixKey,
      pixKeyType: event.pixKeyType,
      pixReceiverName: event.pixReceiverName,
      organizerPhone: event.pixKeyType === "PHONE" ? event.pixKey : null,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params;

  const event = await prisma.event.findUnique({
    where: { inviteCode },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = rsvpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const {
      familyName,
      responsibleName,
      responsibleEmail,
      responsiblePhone,
      createAccount,
      password,
      members,
    } = parsed.data;

    let responsibleId: string | null = null;

    // Se optou por criar conta
    if (createAccount && responsibleEmail && password && password.length >= 6) {
      const existingUser = await prisma.user.findUnique({
        where: { email: responsibleEmail.toLowerCase() },
      });

      if (!existingUser) {
        const passwordHash = await hashPassword(password);
        const newUser = await prisma.user.create({
          data: {
            name: responsibleName,
            email: responsibleEmail.toLowerCase(),
            passwordHash,
          },
        });
        responsibleId = newUser.id;

        // Adiciona como membro do evento
        await prisma.eventMember.create({
          data: {
            eventId: event.id,
            userId: newUser.id,
            role: "PARTICIPANT",
            canEdit: false,
          },
        });
      } else {
        responsibleId = existingUser.id;
      }
    }

    const family = await prisma.family.create({
      data: {
        eventId: event.id,
        responsibleId,
        familyName,
        responsibleName,
        responsibleEmail: responsibleEmail || null,
        responsiblePhone: responsiblePhone || null,
        paymentStatus: "PENDING",
        members: {
          create: members.map((m) => ({
            name: m.name,
            gender: m.gender,
            age: m.age,
            isPaying: m.age >= event.minPayingAge,
          })),
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(
      {
        message: "Presença confirmada com sucesso!",
        family,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no RSVP de convite:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar presença na confraternização" },
      { status: 500 }
    );
  }
}
