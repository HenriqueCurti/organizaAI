export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "OrganizaAI API",
    version: "1.1.0",
    description:
      "API RESTful do OrganizaAI para gerenciamento de confraternizações, ranchos, rateio por família, Pix custo zero, churrascômetro e permissões de co-organizadores. Pronta para integração com Agentes de IA, WhatsApp e Telegram.",
    contact: {
      name: "OrganizaAI",
      email: "suporte@organizaai.app",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Ambiente Local de Desenvolvimento",
    },
  ],
  tags: [
    { name: "Autenticação", description: "Login, cadastro e sessão" },
    { name: "Eventos", description: "Criação, listagem e detalhamento de eventos" },
    { name: "Custos", description: "Gerenciamento de despesas e aluguéis do evento" },
    { name: "Famílias e Participantes", description: "Gestão e edição de núcleos familiares e membros" },
    { name: "Organizadores e Permissões", description: "Atribuição de co-organizadores e admins de eventos" },
    { name: "Convite Público", description: "RSVP sem login obrigatório para participantes" },
    { name: "Churrascômetro", description: "Cálculo de carnes, bebidas não alcoólicas e lista WhatsApp" },
    { name: "Pix", description: "Geração de QR Code e Copia e Cola Pix custo zero" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Autenticação"],
        summary: "Cadastrar novo organizador",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Henrique Curti" },
                  email: { type: "string", example: "henrique@organizaai.app" },
                  password: { type: "string", example: "senha123" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Conta criada com sucesso" },
          409: { description: "E-mail já cadastrado" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Realizar login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "henrique@organizaai.app" },
                  password: { type: "string", example: "senha123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login realizado com sucesso" },
          401: { description: "Credenciais inválidas" },
        },
      },
    },
    "/api/eventos": {
      get: {
        tags: ["Eventos"],
        summary: "Listar eventos do usuário autenticado (ordenados por proximidade e passados)",
        responses: {
          200: { description: "Lista de eventos retornada com sucesso" },
          401: { description: "Não autenticado" },
        },
      },
      post: {
        tags: ["Eventos"],
        summary: "Criar novo evento/confraternização",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "startDate", "endDate"],
                properties: {
                  title: { type: "string", example: "Rancho Fim de Ano 2026" },
                  description: { type: "string", example: "Confraternização anual da família e amigos" },
                  startDate: { type: "string", format: "date", example: "2026-12-28" },
                  endDate: { type: "string", format: "date", example: "2027-01-02" },
                  locationName: { type: "string", example: "Rancho Recanto dos Pássaros, Rifaina/SP" },
                  pixKey: { type: "string", example: "12345678900" },
                  pixKeyType: { type: "string", example: "CPF" },
                  pixReceiverName: { type: "string", example: "Henrique Curti" },
                  minPayingAge: { type: "integer", example: 12, default: 12 },
                  enableBbq: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Evento criado com sucesso" },
        },
      },
    },
    "/api/eventos/{id}": {
      get: {
        tags: ["Eventos"],
        summary: "Obter detalhes completos do evento, rateio e membros",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Dados do evento e métricas de rateio" },
          404: { description: "Evento não encontrado" },
        },
      },
    },
    "/api/eventos/{id}/custos/{costId}": {
      put: {
        tags: ["Custos"],
        summary: "Editar despesa ou custo existente",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "costId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  amount: { type: "number" },
                  dueDate: { type: "string", format: "date" },
                  category: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Custo atualizado" },
        },
      },
      delete: {
        tags: ["Custos"],
        summary: "Excluir despesa do evento",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "costId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Custo removido" },
        },
      },
    },
    "/api/eventos/{id}/familias/{familyId}": {
      put: {
        tags: ["Famílias e Participantes"],
        summary: "Editar família, contato e lista de participantes com idades",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "familyId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  familyName: { type: "string" },
                  responsibleName: { type: "string" },
                  responsiblePhone: { type: "string" },
                  paymentStatus: { type: "string", enum: ["PENDING", "PARTIAL", "PAID"] },
                  members: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["name", "age"],
                      properties: {
                        name: { type: "string" },
                        gender: { type: "string" },
                        age: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Família e membros atualizados" },
        },
      },
    },
    "/api/eventos/{id}/membros": {
      get: {
        tags: ["Organizadores e Permissões"],
        summary: "Listar administradores e co-organizadores do evento",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Lista de membros do evento" },
        },
      },
      post: {
        tags: ["Organizadores e Permissões"],
        summary: "Atribuir um usuário como co-organizador / admin pelo e-mail",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", example: "amigo@organizaai.app" },
                  canEdit: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Co-organizador adicionado com sucesso" },
          404: { description: "Usuário com este e-mail não encontrado" },
        },
      },
    },
    "/api/eventos/{id}/churrasco": {
      get: {
        tags: ["Churrascômetro"],
        summary: "Obter dimensionamento de carnes e refrigerantes/sucos/água para o evento",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Cálculo detalhado com resumo para WhatsApp" },
        },
      },
    },
    "/api/eventos/{id}/pix": {
      get: {
        tags: ["Pix"],
        summary: "Gerar QR Code e Copia e Cola Pix (geral ou filtrado por família)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "familyId", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Payload Pix e imagem base64 do QR Code gerados com sucesso" },
        },
      },
    },
    "/api/convite/{inviteCode}": {
      get: {
        tags: ["Convite Público"],
        summary: "Consultar informações públicas do convite para participantes",
        parameters: [{ name: "inviteCode", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Informações públicas do evento" },
        },
      },
    },
  },
};
