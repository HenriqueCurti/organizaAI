"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Flame, Users, Calendar, ArrowRight, Loader2, Copy, Check } from "lucide-react";

export function LandingChurrascometro() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "result">("form");
  const [participants, setParticipants] = useState("10");
  const [days, setDays] = useState("1");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [result, setResult] = useState<{
    totalMeatKg: number;
    cuts: { carneBovinaKg: number; linguicaKg: number; frangoKg: number; suinoEQueijoKg: number };
    sodaLiters: number;
    waterLiters: number;
    carvaoKg: number;
    summary: string;
  } | null>(null);

  const calculateBbq = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular um pequeno delay para dar sensação de "cálculo"
    setTimeout(() => {
      const totalPeople = parseInt(participants, 10) || 10;
      const totalDays = parseInt(days, 10) || 1;

      // Simplificação: 50% homens, 50% mulheres para a calculadora simples
      const menCount = Math.ceil(totalPeople / 2);
      const womenCount = Math.floor(totalPeople / 2);
      
      const meatGramsMale = 450;
      const meatGramsFemale = 350;

      const totalMeatGrams = (menCount * meatGramsMale + womenCount * meatGramsFemale) * totalDays;
      const totalMeatKg = Number((totalMeatGrams / 1000).toFixed(1));

      const cuts = {
        carneBovinaKg: Number((totalMeatKg * 0.4).toFixed(1)),
        linguicaKg: Number((totalMeatKg * 0.25).toFixed(1)),
        frangoKg: Number((totalMeatKg * 0.2).toFixed(1)),
        suinoEQueijoKg: Number((totalMeatKg * 0.15).toFixed(1)),
      };

      const sodaLiters = Number(((totalPeople * 1000 * totalDays) / 1000).toFixed(1));
      const waterLiters = Number(((totalPeople * 500 * totalDays) / 1000).toFixed(1));

      const carvaoKg = Math.ceil(totalMeatKg);

      const summary = `🥩 *LISTA DE COMPRAS - CHURRASCÔMETRO* 🥩
⏳ *Duração:* ${totalDays} dia(s)
👥 *Participantes:* ${totalPeople} adultos

🍖 *CARNES (Total: ${totalMeatKg} kg):*
• Bovina (Picanha/Alcatra): ${cuts.carneBovinaKg} kg
• Linguiça: ${cuts.linguicaKg} kg
• Frango: ${cuts.frangoKg} kg
• Suíno/Queijo: ${cuts.suinoEQueijoKg} kg

🥤 *BEBIDAS:*
• Refrigerante/Suco: ${sodaLiters} L
• Água: ${waterLiters} L

🔥 *SUPRIMENTOS:*
• Carvão: ${carvaoKg} kg`;

      setResult({
        totalMeatKg,
        cuts,
        sodaLiters,
        waterLiters,
        carvaoKg,
        summary
      });
      setLoading(false);
      setStep("result");
    }, 600);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateEvent = async () => {
    setLoading(true);
    // Redireciona para cadastro passando os parâmetros na URL se necessário ou apenas vai para a tela de cadastro
    router.push(`/cadastro`);
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Churrascômetro
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Descubra a quantidade ideal de carnes e bebidas para o seu evento.
          </p>
        </div>
      </div>

      {step === "form" && (
        <form onSubmit={calculateBbq} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Quantidade de Participantes
              </label>
              <div className="relative">
                <Users className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  required
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Duração em Dias
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-lg shadow-rose-600/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Calcular Lista de Compras
              </>
            )}
          </button>
        </form>
      )}

      {step === "result" && result && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900 text-center">
              <span className="block text-[10px] text-rose-600/80 dark:text-rose-400 uppercase font-bold tracking-wider mb-1">
                Total de Carne
              </span>
              <span className="block text-xl font-black text-rose-700 dark:text-rose-300">
                {result.totalMeatKg} kg
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                Refrig./Suco
              </span>
              <span className="block text-xl font-black text-slate-900 dark:text-white">
                {result.sodaLiters} L
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                Água
              </span>
              <span className="block text-xl font-black text-slate-900 dark:text-white">
                {result.waterLiters} L
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                Carvão
              </span>
              <span className="block text-xl font-black text-slate-900 dark:text-white">
                {result.carvaoKg} kg
              </span>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-[#0b141a] p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 relative shadow-inner">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500 mb-2 block tracking-wider">
              Mensagem Pronta para WhatsApp
            </span>
            <pre className="text-sm font-sans whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
              {result.summary}
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Lista p/ WhatsApp
                </>
              )}
            </button>
            <button
              onClick={() => {
                setStep("form");
                setResult(null);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-sm transition-colors"
            >
              Refazer Cálculo
            </button>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-center">
            <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-2">
              Quem vai pagar por tudo isso? 😅
            </h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-6">
              O churrasco já está calculado. Agora crie um evento no OrganizaAI para repartir os custos com seus amigos, cobrar via Pix e gerenciar quem já pagou.
            </p>
            <button
              onClick={handleCreateEvent}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  Criar Evento de Rateio Grátis
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
