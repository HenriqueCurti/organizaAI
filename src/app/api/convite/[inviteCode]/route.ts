import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const rsvpSchema = z.object({
  familyName: z.string().min(2, "O nome da família é obrigatório"),
  responsibleName: z.string().min(2, "Seu nome é obrigatório"),
  responsibleEmail: z.string().min(1, "O e-mail é obrigatório").email("E-mail inválido"),
  responsiblePhone: z.string().optional(),
  createAccount: z.boolean().default(false),
  password: z.string().optional(),
  members: z
    .array(
      z.object({
        name: z.string().default(""),
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
      status: true,
      estimatedPayingAttendees: true,
      estimatedAttendees: true,
      pixKey: true,
      pixKeyType: true,
      pixReceiverName: true,
      deletedAt: true,
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

  if (!event || event.deletedAt) {
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

  const isClosed = event.status === "CLOSED";
  const effectiveDivisor = isClosed
    ? (totalPayingParticipants > 0 ? totalPayingParticipants : (event.estimatedPayingAttendees || 1))
    : Math.max(totalPayingParticipants, event.estimatedPayingAttendees || 1);

  const estimatedCostPerQuota =
    effectiveDivisor > 0 ? totalCosts / effectiveDivisor : 0;

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
      status: event.status || "OPEN",
      isClosed,
      paymentsEnabled: isClosed,
      creatorName: event.creator.name,
      estimatedCostPerQuota: Number(estimatedCostPerQuota.toFixed(2)),
      totalPayingParticipants,
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

  if (!event || event.deletedAt) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  if (event.status === "CLOSED") {
    return NextResponse.json(
      { error: "As confirmações para este evento foram encerradas pelo organizador." },
      { status: 400 }
    );
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

    const normalizedEmail = responsibleEmail.trim().toLowerCase();

    // Validação anti-duplicidade: checar se já existe família com este e-mail no mesmo evento
    const existingFamilyWithEmail = await prisma.family.findFirst({
      where: {
        eventId: event.id,
        responsibleEmail: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (existingFamilyWithEmail) {
      return NextResponse.json(
        {
          error: `O e-mail "${normalizedEmail}" já foi cadastrado para este evento (${existingFamilyWithEmail.familyName}). Caso precise ajustar sua confirmação, entre em contato com o organizador.`,
        },
        { status: 409 }
      );
    }

    let responsibleId: string | null = null;

    // Se optou por criar conta
    if (createAccount && normalizedEmail && password && password.length >= 6) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!existingUser) {
        const passwordHash = await hashPassword(password);
        const newUser = await prisma.user.create({
          data: {
            name: responsibleName.trim(),
            email: normalizedEmail,
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

    // Processa os membros garantindo que o primeiro membro seja o responsável caso o nome venha vazio
    const processedMembers = members.map((m, index) => {
      const finalName =
        m.name && m.name.trim().length > 0
          ? m.name.trim()
          : index === 0
          ? responsibleName.trim()
          : `Membro ${index + 1}`;

      return {
        name: finalName,
        gender: m.gender,
        age: m.age,
        isPaying: m.age >= event.minPayingAge,
      };
    });

    const family = await prisma.family.create({
      data: {
        eventId: event.id,
        responsibleId,
        familyName: familyName.trim(),
        responsibleName: responsibleName.trim(),
        responsibleEmail: normalizedEmail,
        responsiblePhone: responsiblePhone?.trim() || null,
        paymentStatus: "PENDING",
        members: {
          create: processedMembers,
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
