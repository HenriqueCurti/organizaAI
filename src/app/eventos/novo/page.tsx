"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  Calendar,
  MapPin,
  QrCode,
  Flame,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Painel
        </Link>

        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Criar Novo Evento
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure as informações básicas da confraternização, datas e dados de pagamento.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1: Dados Principais */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                1. Informações do Evento
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nome do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Rancho de Fim de Ano 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Descrição ou Orientações Gerais
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Levar roupa de banho, repelente e itens pessoais. Cada família é responsável pelo seu translado."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Data de Início *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Data de Término *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Localização / Endereço do Rancho
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Regras de Rateio e Churrasco */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
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
                        Calcula automaticamente carnes e refrigerantes/sucos com base nos confirmados
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

            {/* Seção 3: Dados de Pagamento Pix */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                3. Dados para Recebimento Pix (Custo Zero)
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastre sua chave Pix para que os participantes possam pagar as cotas diretamente pelo sistema com QR Code instantâneo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Chave
                  </label>
                  <select
                    value={formData.pixKeyType}
                    onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone</option>
                    <option value="RANDOM">Chave Aleatória</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Chave Pix
                  </label>
                  <input
                    type="text"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    placeholder="Ex: 123.456.789-00 ou seu-pix@banco.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nome Completo do Titular da Conta
                </label>
                <input
                  type="text"
                  value={formData.pixReceiverName}
                  onChange={(e) => setFormData({ ...formData, pixReceiverName: e.target.value })}
                  placeholder="Ex: Henrique Curti"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:shadow-none"
              >
                {loading ? "Criando evento..." : "Criar Evento & Ir para o Painel"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
