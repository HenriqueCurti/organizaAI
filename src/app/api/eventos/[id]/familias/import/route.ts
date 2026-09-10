import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const importSchema = z.object({
  rawText: z.string().min(2, "Informe a lista de participantes"),
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
    return NextResponse.json(
      { error: "Sem permissão para adicionar participantes" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const lines = parsed.data.rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return NextResponse.json(
        { error: "Nenhum participante válido encontrado no texto" },
        { status: 400 }
      );
    }

    let createdFamiliesCount = 0;
    let createdMembersCount = 0;

    for (const rawLine of lines) {
      // Remover numeração inicial (ex: "1. ", "1 - ", "- ", "* ")
      let line = rawLine.replace(/^(\d+[\.\-\)]\s*|[\-\*\•]\s*)/, "").trim();
      if (!line) continue;

      let familyName = "";
      let responsibleName = "";
      const members: { name: string; gender: string; age: number }[] = [];

      // Verificar se possui parênteses com especificação de adultos/crianças
      // Ex: "Carlos Silva (2 adultos, 1 criança)" ou "Família Curti (4 pessoas)"
      const parenMatch = line.match(/\((.*?)\)/);

      if (parenMatch) {
        const insideParens = parenMatch[1].toLowerCase();
        const baseName = line.replace(/\(.*?\)/, "").replace(/[\-\:\—]/g, " ").trim();
        responsibleName = baseName || "Responsável";
        familyName = `Família ${responsibleName}`;

        const adultMatch = insideParens.match(/(\d+)\s*(adulto|pagante|ad)/);
        const childMatch = insideParens.match(/(\d+)\s*(crian|filho|isento|kid)/);
        const genericCountMatch = insideParens.match(/^(\d+)(\s*pessoas)?$/);

        if (adultMatch || childMatch) {
          const adultCount = adultMatch ? parseInt(adultMatch[1]) : 1;
          const childCount = childMatch ? parseInt(childMatch[1]) : 0;

          // Adiciona adultos
          for (let i = 1; i <= adultCount; i++) {
            members.push({
              name: i === 1 ? responsibleName : `${responsibleName} (Acompanhante ${i})`,
              gender: i % 2 === 1 ? "MALE" : "FEMALE",
              age: 30,
            });
          }
          // Adiciona crianças
          for (let i = 1; i <= childCount; i++) {
            members.push({
              name: `Criança ${i} (${responsibleName})`,
              gender: "OTHER",
              age: 7, // menor que minPayingAge padrão (12)
            });
          }
        } else if (genericCountMatch) {
          const count = parseInt(genericCountMatch[1]);
          for (let i = 1; i <= count; i++) {
            members.push({
              name: i === 1 ? responsibleName : `${responsibleName} (Acomp. ${i})`,
              gender: i % 2 === 1 ? "MALE" : "FEMALE",
              age: 30,
            });
          }
        }
      }

      // Se não caiu no padrão de contagem em parênteses:
      // Pode ser múltiplos nomes separados por vírgula ou " e ":
      // Ex: "Carlos, Mariana e Lucas"
      if (members.length === 0) {
        const cleanLine = line.replace(/\(.*?\)/g, "").trim();
        const subNames = cleanLine
          .split(/,|\se\s|\s\+\s|\s\&\s/i)
          .map((n) => n.trim())
          .filter((n) => n.length > 1);

        if (subNames.length > 0) {
          responsibleName = subNames[0];
          familyName = subNames.length > 1 ? `Família ${responsibleName}` : responsibleName;

          subNames.forEach((n, idx) => {
            members.push({
              name: n,
              gender: idx % 2 === 0 ? "MALE" : "FEMALE",
              age: 30,
            });
          });
        }
      }

      // Fallback simples
      if (members.length === 0) {
        responsibleName = line;
        familyName = line;
        members.push({
          name: line,
          gender: "MALE",
          age: 30,
        });
      }

      await prisma.family.create({
        data: {
          eventId,
          familyName,
          responsibleName,
          members: {
            create: members.map((m) => ({
              name: m.name,
              gender: m.gender,
              age: m.age,
              isPaying: m.age >= event.minPayingAge,
            })),
          },
        },
      });

      createdFamiliesCount++;
      createdMembersCount += members.length;
    }

    return NextResponse.json({
      success: true,
      createdFamiliesCount,
      createdMembersCount,
    });
  } catch (error) {
    console.error("Erro ao importar participantes:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar importação da lista" },
      { status: 500 }
    );
  }
}
