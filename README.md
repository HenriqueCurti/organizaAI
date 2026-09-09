# 🥩 OrganizaAI - Gestão de Confraternizações, Rateio Familiar & Churrascômetro

> SaaS inteligente para organização de confraternizações de fim de ano, aluguéis de rancho/sítio, rateio financeiro por família com regras de isenção de idade, cobrança via Pix custo zero e churrascômetro com lista para WhatsApp.

---

## ✨ Principais Funcionalidades

- 👨‍👩‍👧‍👦 **Rateio Inteligente por Família**: Agrupamento por núcleos familiares com responsável financeiro unificado.
- 🎯 **Regras de Isenção por Idade**: Idade mínima configurável (padrão: 12 anos). Participantes menores são isentos de cota.
- ⚡ **Cobrança Pix Custo Zero (BR Code EMV)**: Geração de QR Code e Copia e Cola instantâneos na chave do organizador com o valor exato da família.
- 🍖 **Churrascômetro & Lista de Compras**:
  - Dimensionamento de carnes (bovina, linguiça, frango, suíno/queijo) por dia e perfil demográfico (homens, mulheres, crianças).
  - Dimensionamento de bebidas não-alcoólicas (refrigerantes, sucos, água mineral).
  - Insumos de apoio (carvão, pão de alho, sal grosso, descartáveis).
  - Botão de compartilhamento formatado com 1 clique para WhatsApp.
- 🔗 **Link de Convite Público Sem Fricção**: Os convidados confirmam presença e membros da família sem necessidade de login.
- 👥 **Gestão de Co-Organizadores / Admins**: Atribuição de permissões de edição para outros usuários por e-mail.
- 🌓 **Design System & Temas**: Suporte a temas Claro, Escuro e Sistema (via `next-themes` e Tailwind CSS v4).
- 🤖 **Swagger / OpenAPI 3.0**: Especificação `/api-docs` pronta para conectar agentes de IA e bots (WhatsApp / Telegram).

---

## 🛠️ Stack Tecnológica

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + TypeScript
- **ORM & Banco de Dados**: [Prisma ORM](https://www.prisma.io/) + SQLite (Dev) / PostgreSQL (Prod)
- **Estilização**: Tailwind CSS v4 + Lucide Icons + `next-themes`
- **Autenticação**: Sessões JWT seguras com `jose` e `bcryptjs`
- **Documentação da API**: OpenAPI 3.0 / Swagger UI em `/api-docs`

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/HenriqueCurti/organizaAI.git
cd organizaAI
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

### 4. Executar migrations do Prisma e Seed inicial
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### Credenciais de Demonstração (Seed):
- **E-mail**: `henrique@organizaai.app`
- **Senha**: `senha123`

---

## 📖 Documentação da API

Acesse [http://localhost:3000/api-docs](http://localhost:3000/api-docs) com a aplicação em execução para visualizar a documentação interativa do Swagger.
