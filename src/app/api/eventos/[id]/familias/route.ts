import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createFamilySchema = z.object({
  familyName: z.string().min(2, "Nome da família é obrigatório"),
  responsibleName: z.string().min(2, "Nome do responsável é obrigatório"),
  responsibleEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  responsiblePhone: z.string().optional(),
  members: z
    .array(
      z.object({
        name: z.string().default(""),
        gender: z.string().default("OTHER"),
        age: z.coerce.number().min(0, "Idade inválida"),
      })
    )
    .min(1, "Adicione pelo menos um participante para a família"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { members: { where: { userId: user.id } } },
  });

  if (!event || event.deletedAt) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const canEdit = event.creatorId === user.id || Boolean(event.members[0]?.canEdit);
  if (!canEdit) {
    return NextResponse.json({ error: "Sem permissão para adicionar participantes" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createFamilySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { familyName, responsibleName, responsibleEmail, responsiblePhone, members } = parsed.data;

    let normalizedEmail: string | null = null;
    if (responsibleEmail && responsibleEmail.trim().length > 0) {
      normalizedEmail = responsibleEmail.trim().toLowerCase();
      const existingFamily = await prisma.family.findFirst({
        where: {
          eventId,
          responsibleEmail: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
      });

      if (existingFamily) {
        return NextResponse.json(
          { error: `Já existe uma família cadastrada com o e-mail "${normalizedEmail}" neste evento (${existingFamily.familyName}).` },
          { status: 409 }
        );
      }
    }

    const processedMembers = members.map((m, index) => ({
      name:
        m.name && m.name.trim().length > 0
          ? m.name.trim()
          : index === 0
          ? responsibleName.trim()
          : `Membro ${index + 1}`,
      gender: m.gender,
      age: m.age,
      isPaying: m.age >= event.minPayingAge,
    }));

    const family = await prisma.family.create({
      data: {
        eventId,
        familyName: familyName.trim(),
        responsibleName: responsibleName.trim(),
        responsibleEmail: normalizedEmail,
        responsiblePhone: responsiblePhone?.trim() || null,
        members: {
          create: processedMembers,
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({ family }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar família:", error);
    return NextResponse.json({ error: "Erro interno ao cadastrar família" }, { status: 500 });
  }
}
