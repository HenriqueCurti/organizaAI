"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  Copy,
  Flame,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  Send,
} from "lucide-react";

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  locationName: string | null;
  minPayingAge: number;
  enableBbq: boolean;
  creatorName: string;
  estimatedCostPerQuota: number;
  pixKey: string | null;
  pixKeyType: string | null;
  pixReceiverName: string | null;
  organizerPhone: string | null;
}

export default function PublicInvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = use(params);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Formulário do convidado
  const [formData, setFormData] = useState({
    familyName: "",
    responsibleName: "",
    responsiblePhone: "",
    responsibleEmail: "",
    createAccount: false,
    password: "",
    members: [{ name: "", gender: "MALE", age: "30" }],
  });

  useEffect(() => {
    fetch(`/api/convite/${inviteCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.event) {
          setEvent(data.event);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [inviteCode]);

  const handleAddMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, { name: "", gender: "OTHER", age: "18" }],
    });
  };

  const handleRemoveMember = (idx: number) => {
    if (formData.members.length === 1) return;
    setFormData({
      ...formData,
      members: formData.members.filter((_, i) => i !== idx),
    });
  };

  // Cálculo prévio em tempo real para a família
  const payingCount = formData.members.filter((m) => {
    const age = parseInt(m.age) || 0;
    return event ? age >= event.minPayingAge : true;
  }).length;

  const exemptCount = formData.members.length - payingCount;
  const estimatedFamilyTotal = event ? payingCount * event.estimatedCostPerQuota : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/convite/${inviteCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        // Buscar payload Pix para a família recém cadastrada se o evento tiver chave
        let pixInfo = null;
        if (event?.id) {
          const pixRes = await fetch(`/api/eventos/${event.id}/pix?familyId=${data.family.id}`);
          const pixJson = await pixRes.json();
          if (pixJson.pix) pixInfo = pixJson.pix;
        }

        setSuccessData({
          family: data.family,
          pix: pixInfo,
          payingCount,
          estimatedTotal: estimatedFamilyTotal,
        });
      } else {
        alert(data.error || "Erro ao confirmar presença");
      }
      setSubmitting(false);
    } catch {
      alert("Falha de conexão ao enviar confirmação");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto w-full p-8 animate-pulse space-y-6">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Convite não encontrado ou expirado
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Verifique o link enviado pelo organizador do evento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho do Convite */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Convite Oficial
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Organizado por <strong className="text-slate-700 dark:text-slate-300">{event.creatorName}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {event.title}
          </h1>

          {event.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {event.description}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>
                {new Date(event.startDate).toLocaleDateString("pt-BR")} até{" "}
                {new Date(event.endDate).toLocaleDateString("pt-BR")}
              </span>
            </div>

            {event.locationName && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>{event.locationName}</span>
              </div>
            )}
          </div>

          {/* Banner Informativo sobre a Cota */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                Cota Estimada: R$ {event.estimatedCostPerQuota.toFixed(2)} por pagante
              </span>
              <span className="text-emerald-700 dark:text-emerald-300/80">
                Pessoas com <strong>{event.minPayingAge} anos ou mais</strong> entram no rateio dos custos. Menores de {event.minPayingAge} anos são isentos!
              </span>
            </div>
          </div>
        </div>

        {/* Tela de Sucesso após Envio */}
        {successData ? (
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Presença Confirmada!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                A {successData.family.familyName} está confirmada na confraternização com {successData.family.members.length} participante(s).
              </p>
            </div>

            {/* Cota da Família */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Participantes Pagantes ({event.minPayingAge}+ anos):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{successData.payingCount} pessoa(s)</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total da Cota da sua Família:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  R$ {successData.estimatedTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Dados do Pix se disponíveis */}
            {successData.pix && (
              <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-4">
                <div className="flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Efetue o pagamento da sua cota via Pix</span>
                </div>

                {successData.pix.qrCode && (
                  <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-200 w-fit mx-auto shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={successData.pix.qrCode}
                      alt="QR Code Pix"
                      className="w-48 h-48 rounded-lg"
                    />
                  </div>
                )}

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successData.pix.payload);
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2500);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Código Pix Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Chave Pix Copia e Cola</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-500">
                  Favorecido: <strong>{successData.pix.receiverName}</strong> ({event.pixKeyType}: {event.pixKey})
                </p>
              </div>
            )}

            {/* Seção Clara: Como Informar o Pagamento */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Como informar que o pagamento foi realizado?</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Você pode realizar o pagamento <strong>integral ou parcial</strong>. Após fazer a transferência Pix no seu aplicativo de banco, envie o comprovante diretamente no WhatsApp do organizador (<strong>{event.creatorName}</strong>) para validação e baixa da sua cota.
              </p>

              <button
                type="button"
                onClick={() => {
                  const phoneRaw = event.organizerPhone || (event.pixKeyType === "PHONE" ? event.pixKey : null) || "";
                  const phoneDigits = phoneRaw.replace(/\D/g, "");
                  const msg = [
                    `Olá, *${event.creatorName}*! Acabei de confirmar a presença da *${formData.familyName}* no evento *${event.title}*.`,
                    ``,
                    `*Cota da Família:* R$ ${successData.estimatedTotal.toFixed(2)}`,
                    `Segue o comprovante do pagamento Pix. Pode validar e dar baixa para nós? Obrigado!`
                  ].join("\n");

                  if (phoneDigits) {
                    window.open(`https://wa.me/55${phoneDigits}?text=${encodeURIComponent(msg)}`, "_blank");
                  } else {
                    navigator.clipboard.writeText(msg);
                    alert("Mensagem copiada para a área de transferência! Envie pelo WhatsApp do organizador junto com seu comprovante.");
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Enviar Comprovante no WhatsApp do Organizador</span>
              </button>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Conhecer a plataforma OrganizaAI
              </Link>
            </div>
          </div>
        ) : (
          /* Formulário de Confirmação */
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-sm space-y-6"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirmar Presença da sua Família
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Preencha os dados abaixo. Não é necessário criar conta para confirmar!
              </p>
            </div>

            {/* Dados da Família */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sobrenome da Família *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Família Silva"
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seu Nome Completo (Responsável) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp para Contato
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-8888"
                  value={formData.responsiblePhone}
                  onChange={(e) => setFormData({ ...formData, responsiblePhone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seu E-mail (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={formData.responsibleEmail}
                  onChange={(e) => setFormData({ ...formData, responsibleEmail: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Seção dos Participantes */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Quem vai com você? ({formData.members.length} pessoa(s))
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Insira todos os membros (incluindo você e as crianças).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Pessoa
                </button>
              </div>

              <div className="space-y-2.5">
                {formData.members.map((member, idx) => {
                  const ageNum = parseInt(member.age) || 0;
                  const isPaying = ageNum >= event.minPayingAge;

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Nome (ex: Esposa, Filho, etc.)"
                        value={member.name}
                        onChange={(e) => {
                          const updated = [...formData.members];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, members: updated });
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="number"
                          required
                          min={0}
                          max={100}
                          placeholder="Idade"
                          value={member.age}
                          onChange={(e) => {
                            const updated = [...formData.members];
                            updated[idx].age = e.target.value;
                            setFormData({ ...formData, members: updated });
                          }}
                          className="w-16 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center text-slate-900 dark:text-white"
                        />

                        <select
                          value={member.gender}
                          onChange={(e) => {
                            const updated = [...formData.members];
                            updated[idx].gender = e.target.value;
                            setFormData({ ...formData, members: updated });
                          }}
                          className="flex-1 sm:w-24 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="MALE">Homem</option>
                          <option value="FEMALE">Mulher</option>
                          <option value="OTHER">Outro</option>
                        </select>

                        <span
                          className={`text-[10px] font-bold px-2 py-1.5 rounded-md shrink-0 ${
                            isPaying
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {isPaying ? "Pagante" : "Isento"}
                        </span>

                        {formData.members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                            title="Remover pessoa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulação em Tempo Real da Cota da Família */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Resumo da sua Família:</span>
                <span>
                  {payingCount} pagante(s) ({event.minPayingAge}+ anos)
                  {exemptCount > 0 && ` + ${exemptCount} isento(s)`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-1">
                <span className="text-slate-800 dark:text-slate-200">Cota Total Estimada:</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400">
                  R$ {estimatedFamilyTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Opção Sem Fricção: Criar Conta Opcional */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.createAccount}
                  onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Desejo criar uma senha para acompanhar este evento no painel
                </span>
              </label>

              {formData.createAccount && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Definir Senha de Acesso
                  </label>
                  <input
                    type="password"
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Seu login será o e-mail informado acima.
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              {submitting ? "Confirmando..." : "Confirmar Presença da Família"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
