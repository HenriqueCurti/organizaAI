import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import {
  Flame,
  Users,
  QrCode,
  Calculator,
  Share2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Bot,
  ShieldCheck,
} from "lucide-react";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold mb-6 border border-emerald-200 dark:border-emerald-800/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>O SaaS definitivo para confraternizações e ranchos</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
              Adeus planilha do Excel.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400">
                Rateio de rancho & churrasco
              </span>{" "}
              sem complicação.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Organize a confraternização anual, divida os custos por família com regras de idade,
              cobre por Pix a custo zero e dimensione as carnes e bebidas com o churrascômetro inteligente.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/cadastro"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>Criar Meu Evento Grátis</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/api-docs"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-600 font-bold text-base border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center gap-2"
              >
                <Bot className="w-5 h-5 text-emerald-500" />
                <span>API Swagger / Bots</span>
              </Link>
            </div>

            {/* Badges de Confiança */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Zero taxas bancárias no Pix</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Convidados entram sem login obrigatório</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Tema Claro, Escuro e Sistema</span>
              </div>
            </div>
          </div>
        </section>

        {/* Prévia Visual do Card de Rateio */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 pl-2">
                  organizaai.app/eventos/rancho-fim-de-ano
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                Exemplo ao Vivo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <span className="text-xs text-slate-400 block">Custo Total do Rancho</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  R$ 4.800,00
                </span>
                <span className="text-[11px] text-slate-500">Aluguel + Carvão + Limpeza</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-semibold">
                  Cota por Pagante (+12 anos)
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1 block">
                  R$ 300,00
                </span>
                <span className="text-[11px] text-emerald-600">Crianças até 12 anos isentas</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <span className="text-xs text-slate-400 block">Lista de Churrasco</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  24.5 kg de Carne
                </span>
                <span className="text-[11px] text-slate-500">4 dias | 18 pessoas</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                  S
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Família Silva</span>
                  <span className="text-slate-500">2 adultos pagantes + 1 criança de 4 anos isenta</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Cota da Família:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    R$ 600,00
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Pago via Pix
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pilares de Recursos */}
        <section className="py-16 bg-white dark:bg-[#0b101f] border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Projetado para eliminar todas as dores do organizador
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
                Uma solução sob medida que une finanças familiares, automação de cobrança e logística de churrasco.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Rateio por Família
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Agrupe membros por núcleo familiar. O sistema aplica a idade de corte configurável (ex: 12 anos)
                  e calcula o valor unificado que o responsável deve pagar.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Pix Custo Zero
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gere QR Code e Copia e Cola instantâneos na chave do organizador com o valor exato
                  da cota da família. Sem intermediários, sem taxas e sem burocracia.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Churrascômetro Inteligente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Calcule quilos de carne (bovina, linguiça, frango) e litros de refrigerante, suco e água
                  para múltiplos dias. Copie a lista formatada direto para o WhatsApp.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Convite Sem Fricção
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Envie o link público no WhatsApp. O convidado cadastra sua família sem precisar
                  criar conta, vê a cota instantânea e já tem acesso ao Pix.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Chamada para Ação Final */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Pronto para transformar sua próxima confraternização?
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
              Crie seu evento agora mesmo, convide os participantes e teste o OrganizaAI no seu rancho deste ano.
            </p>

            <div className="mt-8">
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-all hover:scale-105"
              >
                <span>Começar Gratuitamente</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080d1a] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">OrganizaAI</span>
            <span>- Gestão inteligente de confraternizações e ranchos.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/api-docs" className="hover:text-emerald-600 transition-colors">
              Documentação Swagger
            </Link>
            <Link href="/login" className="hover:text-emerald-600 transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="hover:text-emerald-600 transition-colors">
              Criar Conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
