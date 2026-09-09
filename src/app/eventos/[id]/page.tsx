"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Clock,
  Share2,
  Check,
  Flame,
  QrCode,
  Copy,
  Receipt,
  Sparkles,
  UserPlus,
  ShieldCheck,
  UserCheck,
  X,
  AlertCircle,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  gender: string;
  age: number;
  isPaying: boolean;
}

interface Family {
  id: string;
  familyName: string;
  responsibleName: string;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  paymentStatus: "PENDING" | "PAID";
  payingCount: number;
  exemptCount: number;
  familyTotalCost: number;
  members: Member[];
}

interface Cost {
  id: string;
  name: string;
  amount: number;
  dueDate: string | null;
  category: string | null;
}

interface EventMemberInfo {
  id: string;
  userId: string;
  role: string;
  canEdit: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  locationName: string | null;
  minPayingAge: number;
  enableBbq: boolean;
  inviteCode: string;
  isOwner: boolean;
  canEdit: boolean;
  pixKey: string | null;
  pixKeyType: string | null;
  pixReceiverName: string | null;
  totalCosts: number;
  totalPayingParticipants: number;
  totalExemptParticipants: number;
  costPerQuota: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  costs: Cost[];
  families: Family[];
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rateio" | "custos" | "churrasco" | "pix" | "organizadores">("rateio");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Modais de Custos
  const [showAddCost, setShowAddCost] = useState(false);
  const [newCost, setNewCost] = useState({ name: "", amount: "", dueDate: "", category: "ACOMODACAO" });
  const [editingCost, setEditingCost] = useState<Cost | null>(null);

  // Modais de Famílias
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamily, setNewFamily] = useState({
    familyName: "",
    responsibleName: "",
    responsiblePhone: "",
    members: [{ name: "", gender: "MALE", age: "30" }],
  });
  const [editingFamily, setEditingFamily] = useState<{
    id: string;
    familyName: string;
    responsibleName: string;
    responsiblePhone: string;
    members: { name: string; gender: string; age: string }[];
  } | null>(null);

  // Modal Pix Específico de Família
  const [pixModalData, setPixModalData] = useState<{
    familyName: string;
    amount: number;
    payload: string;
    qrCode: string;
  } | null>(null);

  // Dados do Churrascômetro
  const [bbqData, setBbqData] = useState<any>(null);
  const [copiedBbq, setCopiedBbq] = useState(false);

  // Co-organizadores & Membros
  const [membersList, setMembersList] = useState<EventMemberInfo[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberCanEdit, setNewMemberCanEdit] = useState(true);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberMessage, setMemberMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/eventos/${id}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const fetchBbq = async () => {
    try {
      const res = await fetch(`/api/eventos/${id}/churrasco`);
      const data = await res.json();
      if (res.ok) {
        setBbqData(data.bbq);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/eventos/${id}/membros`);
      const data = await res.json();
      if (res.ok) {
        setMembersList(data.members || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvent();
    fetchBbq();
    fetchMembers();
  }, [id]);

  const handleCopyInvite = () => {
    if (!event) return;
    const url = `${window.location.origin}/convite/${event.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // --- CUSTOS ---
  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCost.name || !newCost.amount) return;

    try {
      await fetch(`/api/eventos/${id}/custos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCost),
      });
      setNewCost({ name: "", amount: "", dueDate: "", category: "ACOMODACAO" });
      setShowAddCost(false);
      fetchEvent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost || !editingCost.name || !editingCost.amount) return;

    try {
      await fetch(`/api/eventos/${id}/custos/${editingCost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCost.name,
          amount: Number(editingCost.amount),
          dueDate: editingCost.dueDate ? editingCost.dueDate : null,
          category: editingCost.category,
        }),
      });
      setEditingCost(null);
      fetchEvent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCost = async (costId: string) => {
    if (!confirm("Tem certeza que deseja remover esta despesa?")) return;
    try {
      await fetch(`/api/eventos/${id}/custos/${costId}`, { method: "DELETE" });
      fetchEvent();
    } catch (e) {
      console.error(e);
    }
  };

  // --- FAMÍLIAS & MEMBROS ---
  const handleTogglePaymentStatus = async (family: Family) => {
    const newStatus = family.paymentStatus === "PAID" ? "PENDING" : "PAID";
    try {
      await fetch(`/api/eventos/${id}/familias/${family.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      fetchEvent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    if (!confirm("Remover esta família e todos os seus participantes?")) return;
    try {
      await fetch(`/api/eventos/${id}/familias/${familyId}`, { method: "DELETE" });
      fetchEvent();
      fetchBbq();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenFamilyPix = async (family: Family) => {
    try {
      const res = await fetch(`/api/eventos/${id}/pix?familyId=${family.id}`);
      const data = await res.json();
      if (res.ok) {
        setPixModalData({
          familyName: family.familyName,
          amount: data.pix.amount,
          payload: data.pix.payload,
          qrCode: data.pix.qrCode,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/eventos/${id}/familias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFamily),
      });
      setNewFamily({
        familyName: "",
        responsibleName: "",
        responsiblePhone: "",
        members: [{ name: "", gender: "MALE", age: "30" }],
      });
      setShowAddFamily(false);
      fetchEvent();
      fetchBbq();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditFamily = (family: Family) => {
    setEditingFamily({
      id: family.id,
      familyName: family.familyName,
      responsibleName: family.responsibleName,
      responsiblePhone: family.responsiblePhone || "",
      members: family.members.map((m) => ({
        name: m.name,
        gender: m.gender,
        age: String(m.age),
      })),
    });
  };

  const handleSaveEditedFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFamily) return;

    try {
      const res = await fetch(`/api/eventos/${id}/familias/${editingFamily.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: editingFamily.familyName,
          responsibleName: editingFamily.responsibleName,
          responsiblePhone: editingFamily.responsiblePhone,
          members: editingFamily.members.map((m) => ({
            name: m.name,
            gender: m.gender,
            age: parseInt(m.age) || 0,
          })),
        }),
      });

      if (res.ok) {
        setEditingFamily(null);
        fetchEvent();
        fetchBbq();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar alterações da família");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- MEMBROS & ADMINS ---
  const handleAddCoOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    setMemberActionLoading(true);
    setMemberMessage(null);

    try {
      const res = await fetch(`/api/eventos/${id}/membros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail,
          canEdit: newMemberCanEdit,
          role: "CO_ORGANIZER",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMemberMessage({ type: "success", text: "Co-organizador adicionado com sucesso!" });
        setNewMemberEmail("");
        fetchMembers();
      } else {
        setMemberMessage({ type: "error", text: data.error || "Erro ao adicionar co-organizador" });
      }
      setMemberActionLoading(false);
    } catch {
      setMemberMessage({ type: "error", text: "Falha de conexão com o servidor" });
      setMemberActionLoading(false);
    }
  };

  const handleToggleMemberPermission = async (member: EventMemberInfo) => {
    try {
      const res = await fetch(`/api/eventos/${id}/membros/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canEdit: !member.canEdit }),
      });
      if (res.ok) fetchMembers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remover este usuário da organização do evento?")) return;
    try {
      const res = await fetch(`/api/eventos/${id}/membros/${memberId}`, { method: "DELETE" });
      if (res.ok) fetchMembers();
    } catch (e) {
      console.error(e);
    }
  };

  const copyWhatsAppList = () => {
    if (!bbqData?.whatsappSummary) return;
    navigator.clipboard.writeText(bbqData.whatsappSummary);
    setCopiedBbq(true);
    setTimeout(() => setCopiedBbq(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto w-full p-8 animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
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
            Evento não encontrado
          </h2>
          <Link
            href="/dashboard"
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium"
          >
            Voltar para o Painel
          </Link>
        </div>
      </div>
    );
  }

  const percentCollected =
    event.totalCosts > 0 ? Math.min(100, Math.round((event.totalPaidAmount / event.totalCosts) * 100)) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb & Share Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Meus Eventos
          </Link>

          <button
            onClick={handleCopyInvite}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                <span>Link Copiado para WhatsApp!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copiar Link de Convite para Famílias</span>
              </>
            )}
          </button>
        </div>

        {/* Hero Card do Evento */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Idade de corte: {event.minPayingAge}+ anos pagam
                </span>
                {event.isOwner ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                    Criador / Proprietário
                  </span>
                ) : event.canEdit ? (
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                    Co-Organizador (Pode Editar)
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {event.title}
              </h1>

              {event.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    {new Date(event.startDate).toLocaleDateString("pt-BR")} até{" "}
                    {new Date(event.endDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {event.locationName && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{event.locationName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Banner de Arrecadação Pix */}
            <div className="min-w-[260px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Progresso dos Pagamentos</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{percentCollected}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentCollected}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-500">Recebido: R$ {event.totalPaidAmount.toFixed(2)}</span>
                <span className="text-slate-500">Pendente: R$ {event.totalPendingAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cards Rápidos de Resumo Financeiro */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Custo Total das Despesas
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                R$ {event.totalCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400">{event.costs.length} item(ns) cadastrados</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xs text-emerald-800 dark:text-emerald-400 block font-semibold">
                Valor da Cota por Pagante
              </span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                R$ {event.costPerQuota.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                Por pessoa com {event.minPayingAge}+ anos
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Total de Participantes
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {event.totalPayingParticipants + event.totalExemptParticipants} pessoas
              </span>
              <span className="text-[11px] text-slate-400">
                {event.totalPayingParticipants} pagantes | {event.totalExemptParticipants} isentos
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Famílias Cadastradas
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {event.families.length} famílias
              </span>
              <span className="text-[11px] text-slate-400">
                {event.families.filter((f) => f.paymentStatus === "PAID").length} pagas
              </span>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("rateio")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "rateio"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Famílias & Rateio ({event.families.length})
          </button>

          <button
            onClick={() => setActiveTab("custos")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "custos"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Despesas & Custos ({event.costs.length})
          </button>

          {event.enableBbq && (
            <button
              onClick={() => setActiveTab("churrasco")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "churrasco"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Flame className="w-4 h-4" />
              Churrascômetro & Bebidas
            </button>
          )}

          <button
            onClick={() => setActiveTab("pix")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "pix"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <QrCode className="w-4 h-4" />
            Recebimento Pix
          </button>

          <button
            onClick={() => setActiveTab("organizadores")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "organizadores"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Organizadores & Admins ({membersList.length + 1})
          </button>
        </div>

        {/* ========================================================
            ABA 1: FAMÍLIAS & RATEIO
            ======================================================== */}
        {activeTab === "rateio" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Controle de Famílias e Pagamentos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cada família tem sua cota calculada automaticamente com base no número de pagantes.
                </p>
              </div>

              {event.canEdit && (
                <button
                  onClick={() => setShowAddFamily(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  Adicionar Família Manualmente
                </button>
              )}
            </div>

            {event.families.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200">
                  Nenhuma família confirmada ainda
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Envie o link de convite no WhatsApp da família ou adicione manualmente.
                </p>
                <button
                  onClick={handleCopyInvite}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  <Share2 className="w-4 h-4" />
                  Copiar Link de Convite
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.families.map((family) => (
                  <div
                    key={family.id}
                    className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {family.familyName}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Responsável: {family.responsibleName}{" "}
                            {family.responsiblePhone && `(${family.responsiblePhone})`}
                          </span>
                        </div>

                        <button
                          onClick={() => handleTogglePaymentStatus(family)}
                          title="Clique para alternar status de pagamento"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            family.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:opacity-80"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:opacity-80"
                          }`}
                        >
                          {family.paymentStatus === "PAID" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Pago</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Lista de Membros da Família */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Membros ({family.members.length}):
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {family.members.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {m.name} ({m.age} anos)
                              </span>
                              <span
                                className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                                  m.age >= event.minPayingAge
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {m.age >= event.minPayingAge ? "Pagante" : "Isento"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Resumo da Cota & Botões de Ação */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Total da Família:</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {family.familyTotalCost.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({family.payingCount} pagante(s) x R$ {event.costPerQuota.toFixed(2)})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {event.pixKey && (
                          <button
                            onClick={() => handleOpenFamilyPix(family)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                            title="Ver Pix da Família"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Pix
                          </button>
                        )}

                        {event.canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEditFamily(family)}
                              title="Editar Família e Membros"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteFamily(family.id)}
                              title="Remover família"
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ABA 2: CUSTOS & DESPESAS
            ======================================================== */}
        {activeTab === "custos" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Despesas e Custos do Evento
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Aluguel do rancho, taxa de limpeza, gás, carvão e outras contas a serem divididas.
                </p>
              </div>

              {event.canEdit && (
                <button
                  onClick={() => setShowAddCost(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Despesa
                </button>
              )}
            </div>

            {event.costs.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800">
                <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200">
                  Nenhum custo cadastrado
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Cadastre os valores do aluguel e despesas para que o rateio seja calculado.
                </p>
                {event.canEdit && (
                  <button
                    onClick={() => setShowAddCost(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Primeiro Custo
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Descrição da Despesa</th>
                      <th className="py-3.5 px-4">Categoria</th>
                      <th className="py-3.5 px-4">Vencimento</th>
                      <th className="py-3.5 px-4 text-right">Valor</th>
                      {event.canEdit && <th className="py-3.5 px-4 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {event.costs.map((cost) => (
                      <tr key={cost.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {cost.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {cost.category || "Geral"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {cost.dueDate
                            ? new Date(cost.dueDate).toLocaleDateString("pt-BR")
                            : "Sem data"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                          R$ {cost.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        {event.canEdit && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() =>
                                  setEditingCost({
                                    ...cost,
                                    dueDate: cost.dueDate ? cost.dueDate.slice(0, 10) : "",
                                  })
                                }
                                title="Editar Despesa"
                                className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCost(cost.id)}
                                title="Excluir Despesa"
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-900/80 font-bold border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td colSpan={3} className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        Total Geral de Custos:
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 text-base">
                        R$ {event.totalCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      {event.canEdit && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ABA 3: CHURRASCÔMETRO
            ======================================================== */}
        {activeTab === "churrasco" && event.enableBbq && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Churrascômetro & Lista de Compras
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Dimensionamento automático de carnes, refrigerantes, sucos, água e carvão para o período do evento.
                </p>
              </div>

              {bbqData && (
                <button
                  onClick={copyWhatsAppList}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
                >
                  {copiedBbq ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lista Copiada para WhatsApp!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copiar Lista Formatada para WhatsApp</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {bbqData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Carnes */}
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                        <Flame className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Carnes</h3>
                    </div>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                      {bbqData.meat.totalKg} kg
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sugestão de distribuição equilibrada para {bbqData.demographics.days} dia(s):
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Carne Bovina (Picanha/Alcatra):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.meat.cuts.carneBovinaKg} kg
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Linguiça Toscana / Mista:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.meat.cuts.linguicaKg} kg
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Frango (Coxinha da asa/Tulipa):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.meat.cuts.frangoKg} kg
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Suíno / Queijo Coalho:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.meat.cuts.suinoEQueijoKg} kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bebidas Não-Alcoólicas */}
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Bebidas (Sem Álcool)</h3>
                    </div>
                    <span className="text-sm font-semibold text-slate-500">
                      {bbqData.demographics.totalPeople} pessoas
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Volume planejado para consumo durante as refeições:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Refrigerante:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.drinks.sodaLiters} L (~{bbqData.drinks.sodaBottles2L} garrafas de 2L)
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Sucos Naturais / Polpa:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.drinks.juiceLiters} L
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Água Mineral:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.drinks.waterLiters} L
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suprimentos & Insumos */}
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                        <Flame className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Insumos & Fogo</h3>
                    </div>
                    <span className="text-xs text-slate-400">Essenciais</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Itens auxiliares indispensáveis para a churrasqueira e mesa:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Carvão Vegetal:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.supplies.carvaoKg} kg ({bbqData.supplies.sacosCarvao5kg} sacos de 5kg)
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Pão de Alho:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ~{bbqData.supplies.pacotesPaoDeAlho} pacote(s)
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Sal Grosso:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bbqData.supplies.salGrossoKg} kg
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-medium">Descartáveis:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Kit para {bbqData.demographics.totalPeople} pessoas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ABA 4: RECEBIMENTO PIX
            ======================================================== */}
        {activeTab === "pix" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm max-w-2xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <QrCode className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Dados de Pagamento Pix
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Chave cadastrada pelo organizador para receber os valores de rateio diretamente na conta.
                </p>
              </div>

              {event.pixKey ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-left space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Tipo de Chave:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {event.pixKeyType || "Pix"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Chave Pix:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {event.pixKey}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Titular da Conta:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {event.pixReceiverName || "Organizador"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs">
                  Nenhuma chave Pix cadastrada para este evento.
                </div>
              )}

              <div className="pt-2 text-xs text-slate-400">
                💡 No painel de famílias, você pode clicar no botão <strong>Pix</strong> de qualquer família para gerar o QR Code com o valor exato daquela cota.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            ABA 5: ORGANIZADORES & PERMISSÕES (NOVO)
            ======================================================== */}
        {activeTab === "organizadores" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Equipe de Organização & Permissões
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Atribua outro usuário cadastrado como co-organizador / admin para ajudar a editar custos, famílias e gerenciar o evento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Organizadores */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Proprietário do Evento
                  </span>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                        👑
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">
                          Criador do Evento
                        </span>
                        <span className="text-xs text-slate-500">
                          {event.isOwner ? "Você é o proprietário com acesso total" : "Criador e administrador principal"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Dono / Admin
                    </span>
                  </div>
                </div>

                {/* Co-organizadores cadastrados */}
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Co-Organizadores Adicionados ({membersList.length})
                  </span>

                  {membersList.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Nenhum co-organizador adicionado ainda. Adicione pelo formulário ao lado.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {membersList.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                              {m.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                {m.user.name}
                              </span>
                              <span className="text-[11px] text-slate-500">{m.user.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {event.isOwner ? (
                              <button
                                onClick={() => handleToggleMemberPermission(m)}
                                title="Clique para alternar permissão de edição"
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                                  m.canEdit
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:opacity-80"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 hover:opacity-80"
                                }`}
                              >
                                {m.canEdit ? "Pode Editar" : "Apenas Visualizar"}
                              </button>
                            ) : (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {m.canEdit ? "Pode Editar" : "Visualização"}
                              </span>
                            )}

                            {event.isOwner && (
                              <button
                                onClick={() => handleRemoveMember(m.id)}
                                title="Remover Co-Organizador"
                                className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Formulário para Adicionar Co-Organizador */}
              <div>
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Adicionar Co-Organizador
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Insira o e-mail de um usuário cadastrado na plataforma para conceder permissão de edição a este evento.
                  </p>

                  {memberMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        memberMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{memberMessage.text}</span>
                    </div>
                  )}

                  {event.isOwner ? (
                    <form onSubmit={handleAddCoOrganizer} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          E-mail do Usuário
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="exemplo@organizaai.app"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="canEditCheck"
                          checked={newMemberCanEdit}
                          onChange={(e) => setNewMemberCanEdit(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <label htmlFor="canEditCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          Permitir editar custos, famílias e informações do evento
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={memberActionLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 mt-2"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {memberActionLoading ? "Adicionando..." : "Atribuir como Co-Organizador"}
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-500">
                      Apenas o criador deste evento pode adicionar outros co-organizadores.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: ADICIONAR DESPESA
            ======================================================== */}
        {showAddCost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Adicionar Despesa ao Evento
              </h3>

              <form onSubmit={handleAddCost} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Despesa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aluguel do Rancho, Carvão, Limpeza"
                    value={newCost.name}
                    onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valor Total (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="1200.00"
                      value={newCost.amount}
                      onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vencimento
                    </label>
                    <input
                      type="date"
                      value={newCost.dueDate}
                      onChange={(e) => setNewCost({ ...newCost, dueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCost.category}
                    onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="ACOMODACAO">Acomodação / Rancho</option>
                    <option value="ALIMENTACAO">Alimentação & Bebidas</option>
                    <option value="LIMPEZA">Limpeza e Taxas</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddCost(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Salvar Custo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: EDITAR DESPESA (NOVO)
            ======================================================== */}
        {editingCost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Editar Despesa
              </h3>

              <form onSubmit={handleUpdateCost} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Despesa *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCost.name}
                    onChange={(e) => setEditingCost({ ...editingCost, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valor Total (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingCost.amount}
                      onChange={(e) => setEditingCost({ ...editingCost, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vencimento
                    </label>
                    <input
                      type="date"
                      value={editingCost.dueDate || ""}
                      onChange={(e) => setEditingCost({ ...editingCost, dueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={editingCost.category || "ACOMODACAO"}
                    onChange={(e) => setEditingCost({ ...editingCost, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="ACOMODACAO">Acomodação / Rancho</option>
                    <option value="ALIMENTACAO">Alimentação & Bebidas</option>
                    <option value="LIMPEZA">Limpeza e Taxas</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingCost(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: ADICIONAR FAMÍLIA MANUALMENTE
            ======================================================== */}
        {showAddFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl my-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Adicionar Família Manualmente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Cadastre a família e seus membros. O sistema aplicará a regra de isenção ({event.minPayingAge}+ anos).
              </p>

              <form onSubmit={handleSaveFamily} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sobrenome da Família *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Família Curti"
                      value={newFamily.familyName}
                      onChange={(e) => setNewFamily({ ...newFamily, familyName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Curti"
                      value={newFamily.responsibleName}
                      onChange={(e) => setNewFamily({ ...newFamily, responsibleName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp do Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={newFamily.responsiblePhone}
                    onChange={(e) => setNewFamily({ ...newFamily, responsiblePhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {/* Participantes da Família */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Membros da Família ({newFamily.members.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewFamily({
                          ...newFamily,
                          members: [...newFamily.members, { name: "", gender: "OTHER", age: "18" }],
                        })
                      }
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Membro
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newFamily.members.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Nome do membro"
                          value={member.name}
                          onChange={(e) => {
                            const updated = [...newFamily.members];
                            updated[idx].name = e.target.value;
                            setNewFamily({ ...newFamily, members: updated });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="number"
                          required
                          min={0}
                          max={100}
                          placeholder="Idade"
                          value={member.age}
                          onChange={(e) => {
                            const updated = [...newFamily.members];
                            updated[idx].age = e.target.value;
                            setNewFamily({ ...newFamily, members: updated });
                          }}
                          className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center text-slate-900 dark:text-white"
                        />
                        <select
                          value={member.gender}
                          onChange={(e) => {
                            const updated = [...newFamily.members];
                            updated[idx].gender = e.target.value;
                            setNewFamily({ ...newFamily, members: updated });
                          }}
                          className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="MALE">Homem</option>
                          <option value="FEMALE">Mulher</option>
                          <option value="OTHER">Outro</option>
                        </select>
                        {newFamily.members.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewFamily({
                                ...newFamily,
                                members: newFamily.members.filter((_, i) => i !== idx),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddFamily(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Salvar Família
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: EDITAR FAMÍLIA E MEMBROS (NOVO)
            ======================================================== */}
        {editingFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl my-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Editar Família e Participantes
                </h3>
                <button
                  onClick={() => setEditingFamily(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Modifique os dados da família ou adicione/remova participantes. A cota será recalculada automaticamente ({event.minPayingAge}+ anos pagam).
              </p>

              <form onSubmit={handleSaveEditedFamily} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sobrenome da Família *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingFamily.familyName}
                      onChange={(e) => setEditingFamily({ ...editingFamily, familyName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingFamily.responsibleName}
                      onChange={(e) => setEditingFamily({ ...editingFamily, responsibleName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp do Responsável
                  </label>
                  <input
                    type="text"
                    value={editingFamily.responsiblePhone}
                    onChange={(e) => setEditingFamily({ ...editingFamily, responsiblePhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                {/* Lista de Membros Editáveis */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Membros da Família ({editingFamily.members.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingFamily({
                          ...editingFamily,
                          members: [...editingFamily.members, { name: "", gender: "OTHER", age: "18" }],
                        })
                      }
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Membro
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {editingFamily.members.map((member, idx) => {
                      const ageNum = parseInt(member.age) || 0;
                      const isPaying = ageNum >= event.minPayingAge;

                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nome do participante"
                            value={member.name}
                            onChange={(e) => {
                              const updated = [...editingFamily.members];
                              updated[idx].name = e.target.value;
                              setEditingFamily({ ...editingFamily, members: updated });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                          />
                          <input
                            type="number"
                            required
                            min={0}
                            max={100}
                            placeholder="Idade"
                            value={member.age}
                            onChange={(e) => {
                              const updated = [...editingFamily.members];
                              updated[idx].age = e.target.value;
                              setEditingFamily({ ...editingFamily, members: updated });
                            }}
                            className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center text-slate-900 dark:text-white"
                          />
                          <select
                            value={member.gender}
                            onChange={(e) => {
                              const updated = [...editingFamily.members];
                              updated[idx].gender = e.target.value;
                              setEditingFamily({ ...editingFamily, members: updated });
                            }}
                            className="w-20 px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                          >
                            <option value="MALE">Homem</option>
                            <option value="FEMALE">Mulher</option>
                            <option value="OTHER">Outro</option>
                          </select>

                          <span
                            className={`text-[9px] font-bold px-1.5 py-1 rounded shrink-0 ${
                              isPaying
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {isPaying ? "Paga" : "Isento"}
                          </span>

                          {editingFamily.members.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingFamily({
                                  ...editingFamily,
                                  members: editingFamily.members.filter((_, i) => i !== idx),
                                })
                              }
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingFamily(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: PIX ESPECÍFICO DE FAMÍLIA
            ======================================================== */}
        {pixModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cobrança Pix - {pixModalData.familyName}
              </h3>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-xs text-slate-400 block font-medium">Valor Total da Cota</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  R$ {pixModalData.amount.toFixed(2)}
                </span>
              </div>

              {pixModalData.qrCode && (
                <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-200 w-fit mx-auto shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pixModalData.qrCode}
                    alt="QR Code Pix"
                    className="w-48 h-48 rounded-lg"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(pixModalData.payload);
                  setCopiedPix(true);
                  setTimeout(() => setCopiedPix(false), 2500);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copia e Cola Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Código Pix (Copia e Cola)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setPixModalData(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
