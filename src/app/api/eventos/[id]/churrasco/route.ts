import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBbqSchema = z.object({
  daysCount: z.coerce.number().min(1).default(1),
  meatGramsMale: z.coerce.number().min(100).default(450),
  meatGramsFemale: z.coerce.number().min(100).default(350),
  meatGramsChild: z.coerce.number().min(50).default(180),
  sodaMlPerPerson: z.coerce.number().min(0).default(1000),
  juiceMlPerPerson: z.coerce.number().min(0).default(500),
  waterMlPerPerson: z.coerce.number().min(0).default(500),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      bbqConfig: true,
      families: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  // Obter ou criar configuração padrão
  let bbq = event.bbqConfig;
  if (!bbq) {
    bbq = await prisma.bbqConfig.create({
      data: {
        eventId,
        daysCount: 1,
        meatGramsMale: 450,
        meatGramsFemale: 350,
        meatGramsChild: 180,
        sodaMlPerPerson: 1000,
        juiceMlPerPerson: 500,
        waterMlPerPerson: 500,
      },
    });
  }

  // Contagem demográfica real
  let actualMenCount = 0;
  let actualWomenCount = 0;
  let actualChildrenCount = 0;

  event.families.forEach((f) => {
    f.members.forEach((m) => {
      if (m.age < 12) {
        actualChildrenCount++;
      } else if (m.gender === "FEMALE") {
        actualWomenCount++;
      } else {
        // MALE e OTHER contam como homens para margem segura de carne
        actualMenCount++;
      }
    });
  });

  const actualPeople = actualMenCount + actualWomenCount + actualChildrenCount;
  const isEstimated = actualPeople === 0 && Boolean(event.estimatedAttendees && event.estimatedAttendees > 0);

  let menCount = actualMenCount;
  let womenCount = actualWomenCount;
  let childrenCount = actualChildrenCount;

  if (isEstimated && event.estimatedAttendees) {
    const totalEst = event.estimatedAttendees;
    const payingEst = event.estimatedPayingAttendees ?? event.estimatedAttendees;
    childrenCount = Math.max(0, totalEst - payingEst);
    const adultsEst = totalEst - childrenCount;
    menCount = Math.ceil(adultsEst / 2);
    womenCount = Math.floor(adultsEst / 2);
  }

  const totalPeople = menCount + womenCount + childrenCount;
  const days = bbq.daysCount || 1;

  // Cálculo de Carne em Gramas
  const totalMeatGrams =
    (menCount * bbq.meatGramsMale +
      womenCount * bbq.meatGramsFemale +
      childrenCount * bbq.meatGramsChild) *
    days;

  const totalMeatKg = Number((totalMeatGrams / 1000).toFixed(1));

  // Divisão dos Cortes de Carne
  const cuts = {
    carneBovinaKg: Number((totalMeatKg * 0.4).toFixed(1)), // Picanha / Alcatra / Contrafilé
    linguicaKg: Number((totalMeatKg * 0.25).toFixed(1)),   // Toscana / Cuiabana
    frangoKg: Number((totalMeatKg * 0.2).toFixed(1)),      // Coxinha da asa / Tulipa
    suinoEQueijoKg: Number((totalMeatKg * 0.15).toFixed(1)), // Costelinha / Queijo coalho
  };

  // Cálculo de Bebidas Não-Alcoólicas em Litros
  const totalSodaLiters = Number(((totalPeople * bbq.sodaMlPerPerson * days) / 1000).toFixed(1));
  const totalJuiceLiters = Number(((totalPeople * bbq.juiceMlPerPerson * days) / 1000).toFixed(1));
  const totalWaterLiters = Number(((totalPeople * bbq.waterMlPerPerson * days) / 1000).toFixed(1));

  // Insumos e Acompanhamentos
  const carvaoKg = Math.ceil(totalMeatKg); // 1kg carvão para 1kg carne
  const sacosCarvao5kg = Math.ceil(carvaoKg / 5);
  const pacotesPaoDeAlho = Math.ceil((totalPeople * 2) / 5); // 2 pães por pessoa, pacote com 5
  const salGrossoKg = Math.ceil(totalMeatKg / 10) || 1;

  // Texto formatado para WhatsApp
  const whatsappSummary = `🥩 *LISTA DE COMPRAS - CHURRASCÔMETRO* 🥩
📌 *Evento:* ${event.title}
⏳ *Duração:* ${days} dia(s)
👥 *Participantes:* ${totalPeople} (${menCount} homens, ${womenCount} mulheres, ${childrenCount} crianças)

🍖 *CARNES (Total: ${totalMeatKg} kg):*
• Bovina (Picanha/Alcatra): ${cuts.carneBovinaKg} kg
• Linguiça: ${cuts.linguicaKg} kg
• Frango (Asinha/Tulipa): ${cuts.frangoKg} kg
• Suíno / Queijo Coalho: ${cuts.suinoEQueijoKg} kg

🥤 *BEBIDAS NÃO-ALCOÓLICAS:*
• Refrigerante: ${totalSodaLiters} L (~${Math.ceil(totalSodaLiters / 2)} garrafas de 2L)
• Suco: ${totalJuiceLiters} L
• Água mineral: ${totalWaterLiters} L

🔥 *SUPRIMENTOS:*
• Carvão: ${carvaoKg} kg (${sacosCarvao5kg} saco(s) de 5kg)
• Pão de Alho: ~${pacotesPaoDeAlho} pacote(s)
• Sal Grosso: ${salGrossoKg} kg
• Copos e Pratos descartáveis para ${totalPeople} pessoas

_Gerado automaticamente pelo OrganizaAI_ 🚀`;

  return NextResponse.json({
    bbq: {
      config: bbq,
      demographics: {
        menCount,
        womenCount,
        childrenCount,
        totalPeople,
        days,
        isEstimated,
      },
      meat: {
        totalKg: totalMeatKg,
        cuts,
      },
      drinks: {
        sodaLiters: totalSodaLiters,
        sodaBottles2L: Math.ceil(totalSodaLiters / 2),
        juiceLiters: totalJuiceLiters,
        waterLiters: totalWaterLiters,
      },
      supplies: {
        carvaoKg,
        sacosCarvao5kg,
        pacotesPaoDeAlho,
        salGrossoKg,
      },
      whatsappSummary,
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    const body = await req.json();
    const parsed = updateBbqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const updated = await prisma.bbqConfig.upsert({
      where: { eventId },
      create: {
        eventId,
        ...parsed.data,
      },
      update: parsed.data,
    });

    return NextResponse.json({ bbqConfig: updated });
  } catch (error) {
    console.error("Erro ao atualizar churrascômetro:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar" }, { status: 500 });
  }
}
