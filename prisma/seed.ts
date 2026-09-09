import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Populando banco de dados com dados de teste...");

  // Limpar dados existentes
  await prisma.participant.deleteMany();
  await prisma.family.deleteMany();
  await prisma.cost.deleteMany();
  await prisma.eventMember.deleteMany();
  await prisma.bbqConfig.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar usuário organizador
  const passwordHash = await bcrypt.hash("senha123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Henrique Curti",
      email: "henrique@organizaai.app",
      passwordHash,
    },
  });

  console.log(`👤 Usuário criado: ${user.email} (senha: senha123)`);

  // 2. Criar Evento
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 45); // daqui a 45 dias
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 4); // 4 dias de evento

  const event = await prisma.event.create({
    data: {
      title: "Confraternização Rancho Fim de Ano 2026",
      description:
        "Nosso tradicional rancho de final de ano! Piscina aquecida, campo de futebol e churrasqueira gourmet. Levar itens de higiene pessoal e roupa de cama.",
      startDate,
      endDate,
      locationName: "Rancho Recanto das Águas - Rifaina / SP",
      minPayingAge: 12,
      enableBbq: true,
      inviteCode: "rancho2026",
      pixKeyType: "CPF",
      pixKey: "123.456.789-00",
      pixReceiverName: "Henrique Curti",
      creatorId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
          canEdit: true,
        },
      },
      bbqConfig: {
        create: {
          daysCount: 4,
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

  console.log(`📅 Evento criado: ${event.title}`);

  // 3. Adicionar Custos
  await prisma.cost.createMany({
    data: [
      {
        eventId: event.id,
        name: "Aluguel do Rancho (4 diárias)",
        amount: 3800.0,
        dueDate: new Date(startDate.getTime() - 1000 * 60 * 60 * 24 * 15),
        category: "ACOMODACAO",
      },
      {
        eventId: event.id,
        name: "Taxa de Limpeza e Gás",
        amount: 350.0,
        dueDate: startDate,
        category: "LIMPEZA",
      },
      {
        eventId: event.id,
        name: "Carvão inicial e Descartáveis",
        amount: 250.0,
        category: "ALIMENTACAO",
      },
    ],
  });

  // 4. Cadastrar Famílias e Membros
  // Família Curti (2 pagantes + 2 crianças isentas)
  const famCurti = await prisma.family.create({
    data: {
      eventId: event.id,
      familyName: "Família Curti",
      responsibleName: "Henrique Curti",
      responsiblePhone: "(16) 99999-1111",
      responsibleEmail: user.email,
      responsibleId: user.id,
      paymentStatus: "PAID",
      members: {
        create: [
          { name: "Henrique Curti", gender: "MALE", age: 36, isPaying: true },
          { name: "Mariana Curti", gender: "FEMALE", age: 34, isPaying: true },
          { name: "Lucas Curti", gender: "MALE", age: 8, isPaying: false },
          { name: "Sofia Curti", gender: "FEMALE", age: 4, isPaying: false },
        ],
      },
    },
  });

  // Família Silva (3 pagantes)
  await prisma.family.create({
    data: {
      eventId: event.id,
      familyName: "Família Silva",
      responsibleName: "Carlos Silva",
      responsiblePhone: "(11) 98888-2222",
      paymentStatus: "PAID",
      members: {
        create: [
          { name: "Carlos Silva", gender: "MALE", age: 42, isPaying: true },
          { name: "Fernanda Silva", gender: "FEMALE", age: 40, isPaying: true },
          { name: "Pedro Silva", gender: "MALE", age: 15, isPaying: true }, // Maior de 12 paga
        ],
      },
    },
  });

  // Família Santos (2 pagantes)
  await prisma.family.create({
    data: {
      eventId: event.id,
      familyName: "Família Santos",
      responsibleName: "Rodrigo Santos",
      responsiblePhone: "(19) 97777-3333",
      paymentStatus: "PENDING",
      members: {
        create: [
          { name: "Rodrigo Santos", gender: "MALE", age: 30, isPaying: true },
          { name: "Camila Santos", gender: "FEMALE", age: 28, isPaying: true },
        ],
      },
    },
  });

  // Família Oliveira (2 pagantes + 1 isento de 10 anos)
  await prisma.family.create({
    data: {
      eventId: event.id,
      familyName: "Família Oliveira",
      responsibleName: "Marcos Oliveira",
      responsiblePhone: "(16) 96666-4444",
      paymentStatus: "PENDING",
      members: {
        create: [
          { name: "Marcos Oliveira", gender: "MALE", age: 45, isPaying: true },
          { name: "Juliana Oliveira", gender: "FEMALE", age: 43, isPaying: true },
          { name: "Gabriel Oliveira", gender: "MALE", age: 10, isPaying: false }, // 10 anos isento
        ],
      },
    },
  });

  console.log("✅ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
