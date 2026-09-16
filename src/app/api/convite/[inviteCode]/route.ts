import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import { calculateFamilyQuotas } from "@/lib/quotaUtils";
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
      creatorId: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      locationName: true,
      locationUrl: true,
      latitude: true,
      longitude: true,
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
          id: true,
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
          id: true,
          createdAt: true,
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

  const totalCosts = event.costs.reduce((sum, cost) => sum + cost.amount, 0);
  const isClosed = event.status === "CLOSED";

  const {
    familyQuotas,
    costPerQuota: estimatedCostPerQuota,
    actualPayingParticipants: totalPayingParticipants
  } = calculateFamilyQuotas({
    families: event.families,
    totalCosts,
    minPayingAge: event.minPayingAge,
    estimatedPayingAttendees: event.estimatedPayingAttendees,
    isClosed
  });

  const currentUser = await getCurrentUser();

  let existingFamilyData = null;
  if (currentUser) {
    const existingFamily = await prisma.family.findFirst({
      where: {
        eventId: event.id,
        OR: [
          { responsibleId: currentUser.id },
          { responsibleEmail: { equals: currentUser.email, mode: "insensitive" } },
        ],
      },
      include: {
        members: true,
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (existingFamily) {
      const familyPayingCount = existingFamily.members.filter((m) => m.age >= event.minPayingAge).length;
      const familyTotalCost = familyQuotas.get(existingFamily.id) || 0;
      const familyTotalPaid = Number(
        existingFamily.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
      );
      const familyPendingAmount = Number(Math.max(0, familyTotalCost - familyTotalPaid).toFixed(2));

      existingFamilyData = {
        id: existingFamily.id,
        familyName: existingFamily.familyName,
        responsibleName: existingFamily.responsibleName,
        responsibleEmail: existingFamily.responsibleEmail,
        responsiblePhone: existingFamily.responsiblePhone,
        paymentStatus: existingFamily.paymentStatus,
        members: existingFamily.members,
        payingCount: familyPayingCount,
        familyTotalCost,
        familyTotalPaid,
        familyPendingAmount,
        payments: existingFamily.payments,
      };
    }
  }

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      locationName: event.locationName,
      locationUrl: event.locationUrl,
      latitude: event.latitude,
      longitude: event.longitude,
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
    currentUser: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
        }
      : null,
    isCreator: Boolean(currentUser && currentUser.id === event.creatorId),
    existingFamily: existingFamilyData,
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

    const currentUser = await getCurrentUser();
    const normalizedEmail = (currentUser?.email || responsibleEmail).trim().toLowerCase();

    // Validação anti-duplicidade: checar se já existe família com este e-mail ou do usuário logado no mesmo evento
    const existingFamilyWithEmail = await prisma.family.findFirst({
      where: {
        eventId: event.id,
        OR: [
          ...(currentUser ? [{ responsibleId: currentUser.id }] : []),
          {
            responsibleEmail: {
              equals: normalizedEmail,
              mode: "insensitive" as const,
            },
          },
        ],
      },
    });

    if (existingFamilyWithEmail) {
      return NextResponse.json(
        {
          error: currentUser
            ? `Você já possui a família "${existingFamilyWithEmail.familyName}" cadastrada neste evento.`
            : `O e-mail "${normalizedEmail}" já foi cadastrado para este evento (${existingFamilyWithEmail.familyName}). Caso precise ajustar sua confirmação, entre em contato com o organizador.`,
        },
        { status: 409 }
      );
    }

    let responsibleId: string | null = null;

    if (currentUser) {
      responsibleId = currentUser.id;

      // Adiciona como membro do evento se ainda não for
      const existingMember = await prisma.eventMember.findUnique({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: currentUser.id,
          },
        },
      });
      if (!existingMember && event.creatorId !== currentUser.id) {
        await prisma.eventMember.create({
          data: {
            eventId: event.id,
            userId: currentUser.id,
            role: "PARTICIPANT",
            canEdit: false,
          },
        });
      }
    } else {
      // Usuário não está logado na sessão
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (createAccount) {
        if (existingUser) {
          return NextResponse.json(
            {
              error: `Já existe uma conta cadastrada com o e-mail "${normalizedEmail}". Por favor, faça login para confirmar presença vinculada à sua conta.`,
            },
            { status: 400 }
          );
        }

        if (password && password.length >= 6) {
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
        }
      } else if (existingUser) {
        // Convidado não pediu para criar conta, mas o e-mail pertence a um usuário do sistema
        responsibleId = existingUser.id;
        const existingMember = await prisma.eventMember.findUnique({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: existingUser.id,
            },
          },
        });
        if (!existingMember && event.creatorId !== existingUser.id) {
          await prisma.eventMember.create({
            data: {
              eventId: event.id,
              userId: existingUser.id,
              role: "PARTICIPANT",
              canEdit: false,
            },
          });
        }
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
