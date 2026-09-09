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
        name: z.string().min(2, "Nome do membro é obrigatório"),
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

  if (!event) {
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

    const family = await prisma.family.create({
      data: {
        eventId,
        familyName,
        responsibleName,
        responsibleEmail: responsibleEmail || null,
        responsiblePhone: responsiblePhone || null,
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

    return NextResponse.json({ family }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar família:", error);
    return NextResponse.json({ error: "Erro interno ao cadastrar família" }, { status: 500 });
  }
}
