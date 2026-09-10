const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const target = (process.argv[2] || "postgres").toLowerCase();
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const envPath = path.join(__dirname, "..", ".env");

if (!fs.existsSync(schemaPath)) {
  console.error("❌ Arquivo prisma/schema.prisma não encontrado.");
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, "utf8");

if (target === "sqlite") {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema, "utf8");
  console.log("✅ Provider do Prisma alterado para: sqlite");
  console.log("💡 Lembre-se de configurar no .env: DATABASE_URL=\"file:./dev.db\"");
} else {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema, "utf8");
  console.log("✅ Provider do Prisma alterado para: postgresql (NeonDB)");
  console.log("💡 Lembre-se de configurar no .env a DATABASE_URL do PostgreSQL/NeonDB.");
}

console.log("🔄 Gerando Prisma Client...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("🎉 Prisma Client gerado com sucesso para " + target + "!");
} catch (e) {
  console.warn("⚠️ Não foi possível rodar prisma generate automaticamente (se o servidor Next.js estiver rodando, pare o 'npm run dev' temporariamente e execute 'npx prisma generate').");
}
