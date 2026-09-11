"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  Calendar,
  MapPin,
  Flame,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Zap,
  Sliders,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

interface InitialCostItem {
  id: string;
  name: string;
  amount: string;
  category: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login?from=/eventos/novo");
        }
      })
      .catch(() => {});
  }, [router]);

  // Modo de criação: "QUICK" (Modo Rápido) vs "DETAILED" (Modo Completo)
  const [mode, setMode] = useState<"QUICK" | "DETAILED">("QUICK");

  // Formulário geral
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    locationName: "",
    minPayingAge: 12,
    enableBbq: true,
    pixKeyType: "CPF",
    pixKey: "",
    pixReceiverName: "",
  });

  // Campos específicos do Modo Rápido (Estimativa)
  const [estimatedAttendees, setEstimatedAttendees] = useState<string>("50");
  const [estimatedPayingAttendees, setEstimatedPayingAttendees] = useState<string>("35");

  // Custos iniciais no Modo Rápido
  const [initialCosts, setInitialCosts] = useState<InitialCostItem[]>([
    { id: "1", name: "Aluguel da Chácara / Rancho", amount: "3500", category: "ACOMODACAO" },
    { id: "2", name: "Bebidas e Suprimentos", amount: "1500", category: "ALIMENTACAO" },
  ]);

  // Cálculos do simulador instantâneo
  const totalCost = initialCosts.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);
  const totalPeople = parseInt(estimatedAttendees) || 0;
  const payingCount = Math.min(totalPeople, parseInt(estimatedPayingAttendees) || 0);
  const exemptCount = Math.max(0, totalPeople - payingCount);
  const estimatedQuota = payingCount > 0 ? (totalCost / payingCount).toFixed(2) : "0.00";

  const handleAddCost = () => {
    setInitialCosts([
      ...initialCosts,
      {
        id: Math.random().toString(),
        name: "",
        amount: "",
        category: "OUTROS",
      },
    ]);
  };

  const handleRemoveCost = (id: string) => {
    setInitialCosts(initialCosts.filter((c) => c.id !== id));
  };

  const handleUpdateCost = (id: string, field: keyof InitialCostItem, val: string) => {
    setInitialCosts(
      initialCosts.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        creationMode: mode,
      };

      if (mode === "QUICK") {
        payload.estimatedAttendees = totalPeople;
        payload.estimatedPayingAttendees = payingCount;
        payload.initialCosts = initialCosts
          .filter((c) => c.name.trim().length > 0 && parseFloat(c.amount) > 0)
          .map((c) => ({
            name: c.name.trim(),
            amount: parseFloat(c.amount),
            category: c.category,
          }));
      }

      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar evento");
        setLoading(false);
        return;
      }

      router.push(`/eventos/${data.event.id}`);
    } catch {
      setError("Falha de conexão ao salvar evento");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Painel
        </Link>

        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Criar Novo Evento
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Escolha a forma mais conveniente para criar sua confraternização.
            </p>
          </div>

          {/* Seletor de Modo (Mobile-First Switcher) */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl mb-8 gap-1">
            <button
              type="button"
              onClick={() => setMode("QUICK")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                mode === "QUICK"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 text-emerald-500" />
              <span>Modo Rápido</span>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                Mais Ágil
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode("DETAILED")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                mode === "DETAILED"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Modo Detalhado</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas do Evento (Comum a ambos) */}
            <div className="space-y-4">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                1. Informações Básicas
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Rancho de Fim de Ano 2026"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Data de Término *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Localização / Chácara (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    placeholder="Ex: Rancho Recanto dos Pássaros - Rifaina, SP"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {mode === "DETAILED" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Descrição ou Orientações Gerais
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Levar roupa de banho, repelente e itens pessoais."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              )}
            </div>

            {/* CONTEÚDO DO MODO RÁPIDO */}
            {mode === "QUICK" && (
              <>
                {/* Previsão de Pessoas */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      2. Previsão de Participantes
                    </h2>
                    <span className="text-[11px] text-slate-400">Sem precisar de nomes agora</span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Total de Pessoas Estimadas *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Users className="w-4 h-4" />
                          </div>
                          <input
                            type="number"
                            min={1}
                            required
                            value={estimatedAttendees}
                            onChange={(e) => setEstimatedAttendees(e.target.value)}
                            placeholder="Ex: 50"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Quantos São Pagantes? *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={totalPeople || undefined}
                            required
                            value={estimatedPayingAttendees}
                            onChange={(e) => setEstimatedPayingAttendees(e.target.value)}
                            placeholder="Ex: 35"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800 gap-2">
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>{payingCount} pagantes</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>{exemptCount} isentos (crianças)</span>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Os convidados poderão confirmar pelo link de convite
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custos Iniciais & Simulador de Cota em Tempo Real */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      3. Custos Previstos & Rateio
                    </h2>
                    <button
                      type="button"
                      onClick={handleAddCost}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 py-1 px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Custo
                    </button>
                  </div>

                  {/* Lista de custos iniciais */}
                  <div className="space-y-2.5">
                    {initialCosts.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
                      >
                        <input
                          type="text"
                          value={cost.name}
                          onChange={(e) => handleUpdateCost(cost.id, "name", e.target.value)}
                          placeholder="Ex: Rancho, Bebidas, Carvão..."
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 sm:w-36">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400 pointer-events-none">
                              R$
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={cost.amount}
                              onChange={(e) => handleUpdateCost(cost.id, "amount", e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                            />
                          </div>
                          {initialCosts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCost(cost.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card do Simulador Instantâneo de Cota */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                          Simulação em Tempo Real
                        </span>
                      </div>
                      <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                        {payingCount} cotas
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[11px] text-emerald-100 block">Total Previsto</span>
                        <span className="text-lg sm:text-2xl font-black">
                          R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-emerald-100 block">Cota por Pagante</span>
                        <span className="text-xl sm:text-3xl font-black text-amber-200">
                          R$ {parseFloat(estimatedQuota).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* CONTEÚDO DO MODO DETALHADO */}
            {mode === "DETAILED" && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  2. Regras de Rateio & Churrasco
                </h2>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Idade Mínima para Pagamento da Cota
                      </label>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        {formData.minPayingAge} anos
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Participantes com idade menor que essa serão classificados como isentos de custo.
                    </p>
                    <input
                      type="number"
                      min={0}
                      max={25}
                      value={formData.minPayingAge}
                      onChange={(e) =>
                        setFormData({ ...formData, minPayingAge: parseInt(e.target.value) || 0 })
                      }
                      className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          Ativar Churrascômetro
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Calcula automaticamente carnes e refrigerantes/sucos
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enableBbq}
                      onChange={(e) => setFormData({ ...formData, enableBbq: e.target.checked })}
                      className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dados de Pagamento Pix (Opcional em ambos) */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {mode === "QUICK" ? "4. Chave Pix (Opcional)" : "3. Recebimento Pix (Custo Zero)"}
                </h2>
                <span className="text-[11px] text-slate-400">Pode configurar depois</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Chave
                  </label>
                  <select
                    value={formData.pixKeyType}
                    onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                    <option value="RANDOM">Chave Aleatória</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chave Pix
                  </label>
                  <input
                    type="text"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    placeholder="Ex: 123.456.789-00 ou seu-pix@banco.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do Titular
                </label>
                <input
                  type="text"
                  value={formData.pixReceiverName}
                  onChange={(e) => setFormData({ ...formData, pixReceiverName: e.target.value })}
                  placeholder="Ex: Henrique Curti"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Botão de Finalização */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:shadow-none cursor-pointer"
              >
                {loading ? (
                  "Criando evento..."
                ) : mode === "QUICK" ? (
                  <>
                    <Zap className="w-5 h-5 text-amber-300" />
                    <span>Criar Evento Instantâneo</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Criar Evento & Ir para o Painel</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
