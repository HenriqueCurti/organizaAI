"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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
  Send,
  History,
  FileText,
  Zap,
  Lock,
  Unlock,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

interface Member {
  id: string;
  name: string;
  gender: string;
  age: number;
  isPaying: boolean;
}

interface PaymentRecord {
  id: string;
  familyId: string;
  amount: number;
  paidAt: string;
  method: string;
  note: string | null;
}

interface Family {
  id: string;
  familyName: string;
  responsibleName: string;
  responsibleEmail: string | null;
  responsiblePhone: string | null;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID";
  payingCount: number;
  exemptCount: number;
  familyTotalCost: number;
  familyTotalPaid: number;
  familyPendingAmount: number;
  members: Member[];
  payments: PaymentRecord[];
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
  status: "OPEN" | "CLOSED" | "COMPLETED";
  isClosed?: boolean;
  paymentsEnabled?: boolean;
  isProjectedQuota?: boolean;
  creationMode?: string;
  estimatedAttendees?: number | null;
  estimatedPayingAttendees?: number | null;
  isEstimatedRateio?: boolean;
  actualPayingParticipants?: number;
  actualExemptParticipants?: number;
  actualTotalParticipants?: number;
  inviteCode: string;
  isOwner: boolean;
  canEdit: boolean;
  pixKey: string | null;
  pixKeyType: string | null;
  pixReceiverName: string | null;
  pixCity?: string | null;
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
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rateio" | "custos" | "churrasco" | "pix" | "organizadores">("rateio");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [copiedCobranca, setCopiedCobranca] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modais de Custos
  const [showAddCost, setShowAddCost] = useState(false);
  const [newCost, setNewCost] = useState({ name: "", amount: "", dueDate: "", category: "ACOMODACAO" });
  const [editingCost, setEditingCost] = useState<Cost | null>(null);

  // Modais de Famílias
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [familyModalError, setFamilyModalError] = useState<string | null>(null);
  const [newFamily, setNewFamily] = useState({
    familyName: "",
    responsibleName: "",
    responsiblePhone: "",
    responsibleEmail: "",
    members: [{ name: "", gender: "MALE", age: "30" }],
  });
  const [editingFamily, setEditingFamily] = useState<{
    id: string;
    familyName: string;
    responsibleName: string;
    responsiblePhone: string;
    members: { name: string; gender: string; age: string }[];
  } | null>(null);

  // Modal de Edição das Configurações Pix do Evento
  const [showEditPixConfig, setShowEditPixConfig] = useState(false);
  const [pixConfigForm, setPixConfigForm] = useState({
    pixKeyType: "CPF",
    pixKey: "",
    pixReceiverName: "",
    pixCity: "BRASILIA",
  });
  const [savingPixConfig, setSavingPixConfig] = useState(false);
  const [pixConfigError, setPixConfigError] = useState<string | null>(null);
  const [pixConfigSuccess, setPixConfigSuccess] = useState(false);

  // Modal Pix Específico de Família
  const [pixModalData, setPixModalData] = useState<{
    familyId: string;
    familyName: string;
    responsiblePhone: string | null;
    responsibleName: string;
    amount: number;
    totalCost: number;
    totalPaid: number;
    pendingAmount: number;
    isFullyPaid: boolean;
    payload: string;
    qrCode: string;
  } | null>(null);
  const [customPixAmount, setCustomPixAmount] = useState<string>("");
  const [loadingPixAmount, setLoadingPixAmount] = useState(false);

  // Modal de Registro e Histórico de Pagamentos
  const [paymentModalFamily, setPaymentModalFamily] = useState<Family | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [copiedFamilyPix, setCopiedFamilyPix] = useState(false);

  // Dados do Churrascômetro
  const [bbqData, setBbqData] = useState<any>(null);
  const [copiedBbq, setCopiedBbq] = useState(false);

  // Co-organizadores & Membros
  const [membersList, setMembersList] = useState<EventMemberInfo[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberCanEdit, setNewMemberCanEdit] = useState(true);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberMessage, setMemberMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal de Importação Rápida da Lista do WhatsApp
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/eventos/${id}`);
      if (res.status === 401) {
        router.push(`/login?from=/eventos/${id}`);
        return;
      }
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

  const handleToggleEventStatus = async (newStatus: "OPEN" | "CLOSED") => {
    if (!event) return;
    const confirmMsg =
      newStatus === "CLOSED"
        ? "Deseja fechar as confirmações deste evento?\n\n• O link de convite deixará de aceitar novas confirmações ou alterações.\n• O valor da cota será fixado definitivamente com base nos participantes confirmados.\n• Os pagamentos via Pix serão liberados aos participantes."
        : "Deseja reabrir as confirmações deste evento?\n\n• O convite voltará a aceitar confirmações.\n• A cota voltará a usar o quórum projetado/estimado.";
    if (!confirm(confirmMsg)) return;

    try {
      setStatusLoading(true);
      const res = await fetch(`/api/eventos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchEvent();
        await fetchBbq();
      } else {
        alert(data.error || "Erro ao alterar status do evento");
      }
    } catch (e) {
      console.error(e);
      alert("Falha de conexão com o servidor");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir evento");
      }
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Erro ao excluir evento");
      setDeleteLoading(false);
    }
  };

  const handleCopyFinalCobranca = () => {
    if (!event) return;
    const payingCount = event.actualPayingParticipants ?? event.totalPayingParticipants;
    const lines = [
      `📢 *LISTA FECHADA & RATEIO - ${event.title}*`,
      ``,
      `Olá a todos! As confirmações de presença foram encerradas e os valores finais do rateio estão definidos:`,
      ``,
      `💰 *Cota por Pagante:* R$ ${event.costPerQuota.toFixed(2)}`,
      `👥 *Total de Pagantes Confirmados:* ${payingCount}`,
      `🏷️ *Custo Total do Evento:* R$ ${event.totalCosts.toFixed(2)}`,
      ``,
      event.pixKey ? `🔑 *Chave Pix (${event.pixKeyType || "Pix"}):* ${event.pixKey}` : null,
      event.pixReceiverName ? `👤 *Titular da Conta:* ${event.pixReceiverName}` : null,
      ``,
      `Para conferir sua cota individual de família e pagar via QR Code / Copia e Cola, acesse seu convite:`,
      `${window.location.origin}/convite/${event.inviteCode}`,
      ``,
      `Por favor, realizem o pagamento e enviem o comprovante para a organização. Obrigado!`
    ].filter((line) => line !== null);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedCobranca(true);
    setTimeout(() => setCopiedCobranca(false), 2500);
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
  const handleOpenPaymentModal = (family: Family) => {
    setPaymentModalFamily(family);
    setPaymentAmount(family.familyPendingAmount > 0 ? String(family.familyPendingAmount) : "");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("PIX");
    setPaymentNote("");
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalFamily || !paymentAmount || parseFloat(paymentAmount) <= 0) return;

    setPaymentSubmitting(true);
    try {
      const res = await fetch(`/api/eventos/${id}/familias/${paymentModalFamily.id}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          paidAt: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
          note: paymentNote || null,
        }),
      });

      if (res.ok) {
        await fetchEvent();
        const updatedRes = await fetch(`/api/eventos/${id}`);
        const updatedData = await updatedRes.json();
        if (updatedData.event) {
          const updatedFamily = updatedData.event.families.find((f: Family) => f.id === paymentModalFamily.id);
          if (updatedFamily) {
            setPaymentModalFamily(updatedFamily);
            setPaymentAmount(updatedFamily.familyPendingAmount > 0 ? String(updatedFamily.familyPendingAmount) : "");
          }
        }
        setPaymentNote("");
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao registrar pagamento");
      }
    } catch (e) {
      console.error(e);
      alert("Falha ao registrar pagamento");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleDeletePaymentRecord = async (paymentId: string) => {
    if (!paymentModalFamily) return;
    if (!confirm("Tem certeza que deseja estornar este lançamento de pagamento?")) return;

    try {
      const res = await fetch(`/api/eventos/${id}/familias/${paymentModalFamily.id}/pagamentos/${paymentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchEvent();
        const updatedRes = await fetch(`/api/eventos/${id}`);
        const updatedData = await updatedRes.json();
        if (updatedData.event) {
          const updatedFamily = updatedData.event.families.find((f: Family) => f.id === paymentModalFamily.id);
          if (updatedFamily) {
            setPaymentModalFamily(updatedFamily);
            setPaymentAmount(updatedFamily.familyPendingAmount > 0 ? String(updatedFamily.familyPendingAmount) : "");
          }
        }
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao estornar pagamento");
      }
    } catch (e) {
      console.error(e);
      alert("Falha ao estornar pagamento");
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

  const handleOpenFamilyPix = async (family: Family, customAmount?: number) => {
    try {
      setLoadingPixAmount(true);
      const url = customAmount !== undefined
        ? `/api/eventos/${id}/pix?familyId=${family.id}&amount=${customAmount}`
        : `/api/eventos/${id}/pix?familyId=${family.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setPixModalData({
          familyId: family.id,
          familyName: family.familyName,
          responsiblePhone: family.responsiblePhone,
          responsibleName: family.responsibleName,
          amount: data.pix.amount,
          totalCost: data.pix.totalCost,
          totalPaid: data.pix.totalPaid,
          pendingAmount: data.pix.pendingAmount,
          isFullyPaid: data.pix.isFullyPaid,
          payload: data.pix.payload,
          qrCode: data.pix.qrCode,
        });
        setCustomPixAmount(String(data.pix.amount));
      } else {
        alert(data.error || "Erro ao gerar Pix");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPixAmount(false);
    }
  };

  const handleRecalculatePixWithAmount = async (amount: number) => {
    if (!pixModalData) return;
    try {
      setLoadingPixAmount(true);
      const res = await fetch(`/api/eventos/${id}/pix?familyId=${pixModalData.familyId}&amount=${amount}`);
      const data = await res.json();
      if (res.ok) {
        setPixModalData((prev) => prev ? {
          ...prev,
          amount: data.pix.amount,
          payload: data.pix.payload,
          qrCode: data.pix.qrCode,
        } : null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPixAmount(false);
    }
  };

  const handleNewFamilyResponsibleNameChange = (val: string) => {
    const updatedMembers = [...newFamily.members];
    if (updatedMembers.length > 0) {
      if (!updatedMembers[0].name || updatedMembers[0].name === newFamily.responsibleName) {
        updatedMembers[0] = { ...updatedMembers[0], name: val };
      }
    }
    setNewFamily({
      ...newFamily,
      responsibleName: val,
      members: updatedMembers,
    });
  };

  const handleSaveFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setFamilyModalError(null);
    try {
      const payload = {
        ...newFamily,
        responsibleEmail: newFamily.responsibleEmail.trim() || undefined,
        members: newFamily.members.map((m, idx) => ({
          ...m,
          name: m.name.trim() || (idx === 0 ? newFamily.responsibleName.trim() : `Membro ${idx + 1}`),
        })),
      };

      const res = await fetch(`/api/eventos/${id}/familias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFamilyModalError(data.error || "Erro ao adicionar família");
        return;
      }
      setNewFamily({
        familyName: "",
        responsibleName: "",
        responsiblePhone: "",
        responsibleEmail: "",
        members: [{ name: "", gender: "MALE", age: "30" }],
      });
      setShowAddFamily(false);
      fetchEvent();
      fetchBbq();
    } catch (e) {
      console.error(e);
      setFamilyModalError("Falha de conexão com o servidor ao salvar família.");
    }
  };

  const handleOpenEditPixConfig = () => {
    setPixConfigForm({
      pixKeyType: event?.pixKeyType || "CPF",
      pixKey: event?.pixKey || "",
      pixReceiverName: event?.pixReceiverName || "",
      pixCity: (event as any)?.pixCity || "BRASILIA",
    });
    setPixConfigError(null);
    setPixConfigSuccess(false);
    setShowEditPixConfig(true);
  };

  const handleSavePixConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPixConfig(true);
    setPixConfigError(null);
    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixKeyType: pixConfigForm.pixKeyType,
          pixKey: pixConfigForm.pixKey.trim(),
          pixReceiverName: pixConfigForm.pixReceiverName.trim(),
          pixCity: pixConfigForm.pixCity.trim() || "BRASILIA",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPixConfigError(data.error || "Erro ao atualizar configurações do Pix");
        setSavingPixConfig(false);
        return;
      }
      setPixConfigSuccess(true);
      setTimeout(() => {
        setShowEditPixConfig(false);
        setPixConfigSuccess(false);
      }, 800);
      fetchEvent();
    } catch {
      setPixConfigError("Falha de comunicação com o servidor.");
    } finally {
      setSavingPixConfig(false);
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

  const handleImportWhatsAppList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImportLoading(true);
    setImportFeedback(null);

    try {
      const res = await fetch(`/api/eventos/${id}/familias/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: importText }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportFeedback({
          type: "success",
          text: `Sucesso! Foram criadas ${data.createdFamiliesCount} famílias (${data.createdMembersCount} pessoas).`,
        });
        setImportText("");
        await fetchEvent();
        await fetchBbq();
        setTimeout(() => {
          setShowImportModal(false);
          setImportFeedback(null);
        }, 1800);
      } else {
        setImportFeedback({ type: "error", text: data.error || "Erro ao processar lista" });
      }
    } catch {
      setImportFeedback({ type: "error", text: "Falha de conexão com o servidor" });
    } finally {
      setImportLoading(false);
    }
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
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Meus Eventos
          </Link>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {event.status === "CLOSED" ? (
              <button
                onClick={handleCopyFinalCobranca}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-all flex-1 sm:flex-initial"
              >
                {copiedCobranca ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Cobrança Copiada!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-purple-200" />
                    <span>Copiar Cobrança WhatsApp</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleCopyInvite}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex-1 sm:flex-initial"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Link Copiado para WhatsApp!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Copiar Convite (WhatsApp)</span>
                  </>
                )}
              </button>
            )}

            {event.canEdit && (
              event.status === "CLOSED" ? (
                <button
                  onClick={() => handleToggleEventStatus("OPEN")}
                  disabled={statusLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                  title="Reabrir confirmações de participantes"
                >
                  <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reabrir</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleEventStatus("CLOSED")}
                  disabled={statusLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-sm transition-all disabled:opacity-50"
                  title="Encerrar confirmações e iniciar cobrança Pix"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Fechar Lista</span>
                </button>
              )
            )}

            {event.isOwner && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-all shadow-sm"
                title="Excluir este evento"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Card do Evento */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Badge de Status do Evento */}
                {event.status === "CLOSED" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Lista Fechada & Cobrança Ativa
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Confirmações Abertas
                  </span>
                )}

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
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {new Date(event.startDate).toLocaleDateString("pt-BR")} até{" "}
                    {new Date(event.endDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {event.locationName && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{event.locationName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Banner de Arrecadação Pix */}
            <div className="w-full md:w-auto md:min-w-[280px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Custo Total das Despesas
              </span>
              <span className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                R$ {event.totalCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400">{event.costs.length} item(ns) cadastrados</span>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-400 block font-semibold">
                {event.status === "CLOSED" ? "Cota Final Definitiva" : "Cota por Pagante (Prevista)"}
              </span>
              <span className="text-base sm:text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                R$ {event.costPerQuota.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                {event.status === "CLOSED"
                  ? `${event.actualPayingParticipants ?? event.totalPayingParticipants} pagantes confirmados`
                  : event.isProjectedQuota
                  ? "Cálculo pelo quórum estimado"
                  : event.isEstimatedRateio
                  ? "Estimativa prevista"
                  : `${event.minPayingAge}+ anos pagam`}
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Total Participantes
              </span>
              <span className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {event.totalPayingParticipants + event.totalExemptParticipants} pessoas
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400">
                {event.status === "CLOSED"
                  ? `${event.actualPayingParticipants ?? event.totalPayingParticipants} pagantes | ${event.actualExemptParticipants ?? event.totalExemptParticipants} isentos`
                  : event.isEstimatedRateio
                  ? `${event.totalPayingParticipants} pagantes previstos`
                  : `${event.totalPayingParticipants} pagantes | ${event.totalExemptParticipants} isentos`}
              </span>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Famílias Cadastradas
              </span>
              <span className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {event.families.length} famílias
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400">
                {event.families.filter((f) => f.paymentStatus === "PAID").length} quitadas | {event.families.filter((f) => f.paymentStatus === "PARTIAL").length} parciais
              </span>
            </div>
          </div>
        </div>

        {/* Banner de Status & Ciclo de Vida do Evento */}
        {event.status === "CLOSED" ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-emerald-950/30 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span>Lista Fechada & Cobrança Pix Liberada</span>
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                    Cota Final: R$ {event.costPerQuota.toFixed(2)}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  As confirmações pelo convite estão encerradas. O valor da cota foi finalizado com base nos pagantes confirmados e os pagamentos Pix estão liberados aos participantes.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleCopyFinalCobranca}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all w-full sm:w-auto justify-center"
              >
                {copiedCobranca ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Cobrança Copiada!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-purple-200" />
                    <span>Copiar Cobrança (WhatsApp)</span>
                  </>
                )}
              </button>

              {event.canEdit && (
                <button
                  onClick={() => handleToggleEventStatus("OPEN")}
                  disabled={statusLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all w-full sm:w-auto justify-center disabled:opacity-50"
                >
                  <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reabrir Confirmações</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <span>Confirmações em Aberto (Cobrança em Espera)</span>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    Cota Prevista: R$ {event.costPerQuota.toFixed(2)}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Os convidados podem confirmar presença pelo convite. A cobrança Pix só iniciará após o fechamento da lista, garantindo que o rateio seja justo e exato para todos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all w-full sm:w-auto justify-center"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar Convite</span>
              </button>

              {event.canEdit && (
                <button
                  onClick={() => handleToggleEventStatus("CLOSED")}
                  disabled={statusLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition-all w-full sm:w-auto justify-center disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Fechar Lista & Liberar Pix</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Abas de Navegação */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 no-scrollbar touch-scroll">
          <button
            onClick={() => setActiveTab("rateio")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-3 sm:py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors ${
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
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-3 sm:py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors ${
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
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all border border-emerald-200 dark:border-emerald-800"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Colar Lista do WhatsApp
                  </button>

                  <button
                    onClick={() => setShowAddFamily(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Adicionar Família
                  </button>
                </div>
              )}
            </div>

            {/* Banner de Modo Estimado quando não há famílias confirmadas ainda */}
            {event.isEstimatedRateio && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 border border-amber-200/70 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                      <span>Modo Estimativa Ativo ({event.totalPayingParticipants} pagantes previstos)</span>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        Cota: R$ {event.costPerQuota.toFixed(2)}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      O rateio está provisionado com base na quantidade estimada de participantes. Conforme seus convidados confirmarem presença pelo link ou você colar a lista, os valores se ajustarão automaticamente.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyInvite}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Enviar Convite
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Colar Lista
                  </button>
                </div>
              </div>
            )}

            {/* Progresso de Confirmações quando já existem famílias e havia estimativa */}
            {event.families.length > 0 && event.estimatedPayingAttendees && event.estimatedPayingAttendees > 0 && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Progresso das Confirmações:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {event.actualPayingParticipants ?? event.totalPayingParticipants} de {event.estimatedPayingAttendees} pagantes confirmados
                  </span>
                  <span className="text-slate-400">
                    ({Math.min(100, Math.round(((event.actualPayingParticipants ?? event.totalPayingParticipants) / event.estimatedPayingAttendees) * 100))}%)
                  </span>
                </div>
                <div className="w-full sm:w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(((event.actualPayingParticipants ?? event.totalPayingParticipants) / event.estimatedPayingAttendees) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {event.families.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 dark:text-slate-200">
                  Nenhuma família confirmada ainda
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Envie o link de convite no WhatsApp da família ou cole sua lista de participantes.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={handleCopyInvite}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Copiar Link de Convite
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <FileText className="w-4 h-4" />
                    Colar Lista do WhatsApp
                  </button>
                </div>
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
                          onClick={() => handleOpenPaymentModal(family)}
                          title="Clique para gerenciar pagamentos desta família"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            family.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:opacity-85 shadow-sm"
                              : family.paymentStatus === "PARTIAL"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 hover:opacity-85 shadow-sm"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:opacity-85 shadow-sm"
                          }`}
                        >
                          {family.paymentStatus === "PAID" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Quitada</span>
                            </>
                          ) : family.paymentStatus === "PARTIAL" ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Parcial</span>
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

                    {/* Resumo Financeiro da Família & Barra de Progresso */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block">Cota Total</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            R$ {family.familyTotalCost.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block">Total Pago</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            R$ {family.familyTotalPaid.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block">Resta Pagar</span>
                          <span
                            className={`text-xs font-bold ${
                              family.familyPendingAmount === 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            R$ {family.familyPendingAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {family.familyTotalCost > 0 && (
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                family.familyPendingAmount === 0 ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((family.familyTotalPaid / family.familyTotalCost) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>
                              {family.payments?.length || 0} lançamento(s)
                            </span>
                            <span>
                              {Math.min(
                                100,
                                Math.round((family.familyTotalPaid / family.familyTotalCost) * 100)
                              )}
                              % pago
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Ações da Família */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {event.canEdit ? (
                          <button
                            onClick={() => handleOpenPaymentModal(family)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-colors"
                            title="Lançar pagamento ou ver histórico"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Registrar Pagamento</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-1.5">
                          {event.pixKey && (
                            <button
                              onClick={() => handleOpenFamilyPix(family)}
                              className="inline-flex items-center gap-1 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                              title={
                                family.familyPendingAmount > 0
                                  ? `Gerar Pix com saldo pendente de R$ ${family.familyPendingAmount.toFixed(2)}`
                                  : "Ver dados do Pix"
                              }
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Pix</span>
                            </button>
                          )}

                          {event.canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEditFamily(family)}
                                title="Editar Família e Membros"
                                className="p-2 sm:p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteFamily(family.id)}
                                title="Remover família"
                                className="p-2 sm:p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
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
              <div className="space-y-4">
                {/* Mobile Cards View (< 768px) */}
                <div className="block md:hidden space-y-3">
                  {event.costs.map((cost) => (
                    <div
                      key={cost.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm block">
                            {cost.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {cost.dueDate
                              ? `Vencimento: ${new Date(cost.dueDate).toLocaleDateString("pt-BR")}`
                              : "Sem data de vencimento"}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                          {cost.category || "Geral"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          R$ {cost.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>

                        {event.canEdit && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                setEditingCost({
                                  ...cost,
                                  dueDate: cost.dueDate ? cost.dueDate.slice(0, 10) : "",
                                })
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                              title="Editar Despesa"
                            >
                              <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCost(cost.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Excluir Despesa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Card de Resumo Total no Mobile */}
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Total Geral de Custos:
                    </span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                      R$ {event.totalCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Desktop Table View (>= 768px) */}
                <div className="hidden md:block bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
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

            {bbqData?.demographics?.isEstimated && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
                <Zap className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Estimativa Provisória:</strong> Esta lista foi calculada para a sua previsão de{" "}
                  <strong>{bbqData.demographics.totalPeople} pessoas</strong> ({bbqData.demographics.menCount} homens,{" "}
                  {bbqData.demographics.womenCount} mulheres e {bbqData.demographics.childrenCount} crianças). Conforme as famílias forem adicionadas, os cortes de carne e bebidas se ajustarão à demografia real.
                </span>
              </div>
            )}

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

              {!event.paymentsEnabled ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5 text-left">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <span className="font-bold block">Recebimento Pix em Espera:</span>
                    <p className="leading-relaxed">
                      As confirmações ainda estão abertas. Os QR Codes e pagamentos Pix só serão liberados aos participantes quando a lista for fechada. Isso garante que ninguém pague adiantado por uma cota sujeita a variações de quórum.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 text-xs flex items-start gap-2.5 text-left">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                  <div className="space-y-1">
                    <span className="font-bold block">Recebimento Pix Liberado:</span>
                    <p className="leading-relaxed">
                      A lista foi fechada e a cota definitiva foi calculada. Os participantes já conseguem visualizar o QR Code Pix e a chave Copia e Cola ao acessar a página de confirmação.
                    </p>
                  </div>
                </div>
              )}

              {event.pixKey ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-left space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Chave Cadastrada
                      </span>
                      {event.canEdit && (
                        <button
                          type="button"
                          onClick={handleOpenEditPixConfig}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>
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
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Cidade:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {event.pixCity || "BRASILIA"}
                      </span>
                    </div>
                  </div>

                  {event.canEdit && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleOpenEditPixConfig}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Alterar Configurações do Pix</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-left space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Nenhuma chave Pix cadastrada para este evento.</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
                    Cadastre a chave Pix onde os participantes deverão realizar o pagamento do rateio.
                  </p>
                  {event.canEdit && (
                    <button
                      type="button"
                      onClick={handleOpenEditPixConfig}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Chave Pix Agora</span>
                    </button>
                  )}
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                              {m.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                                {m.user.name}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">{m.user.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-800/80">
                            {event.isOwner ? (
                              <button
                                onClick={() => handleToggleMemberPermission(m)}
                                title="Clique para alternar permissão de edição"
                                className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
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
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-md w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="ACOMODACAO">Acomodação / Rancho</option>
                    <option value="ALIMENTACAO">Alimentação & Bebidas</option>
                    <option value="LIMPEZA">Limpeza e Taxas</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddCost(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-md w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="ACOMODACAO">Acomodação / Rancho</option>
                    <option value="ALIMENTACAO">Alimentação & Bebidas</option>
                    <option value="LIMPEZA">Limpeza e Taxas</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingCost(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Adicionar Família Manualmente
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddFamily(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastre a família e seus membros. O responsável é incluído automaticamente como participante.
              </p>

              {familyModalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{familyModalError}</span>
                </div>
              )}

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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
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
                      onChange={(e) => handleNewFamilyResponsibleNameChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp do Responsável
                    </label>
                    <input
                      type="text"
                      placeholder="(11) 99999-8888"
                      value={newFamily.responsiblePhone}
                      onChange={(e) => setNewFamily({ ...newFamily, responsiblePhone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail do Responsável (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="carlos@exemplo.com"
                      value={newFamily.responsibleEmail}
                      onChange={(e) => setNewFamily({ ...newFamily, responsibleEmail: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
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

                  <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                    {newFamily.members.map((member, idx) => {
                      const isResponsible = idx === 0;

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border space-y-2 ${
                            isResponsible
                              ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                              : "bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800"
                          }`}
                        >
                          {isResponsible && (
                            <div className="flex items-center justify-between pb-0.5">
                              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Membro 1 (Responsável)
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Preenchido com o responsável
                              </span>
                            </div>
                          )}

                          <input
                            type="text"
                            required
                            placeholder={isResponsible ? "Nome do responsável" : "Nome do membro"}
                            value={isResponsible ? (member.name || newFamily.responsibleName) : member.name}
                            onChange={(e) => {
                              const updated = [...newFamily.members];
                              updated[idx].name = e.target.value;
                              setNewFamily({ ...newFamily, members: updated });
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                          />
                          <div className="flex items-center gap-2">
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
                              className="w-20 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center text-slate-900 dark:text-white"
                            />
                            <select
                              value={member.gender}
                              onChange={(e) => {
                                const updated = [...newFamily.members];
                                updated[idx].gender = e.target.value;
                                setNewFamily({ ...newFamily, members: updated });
                              }}
                              className="flex-1 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                            >
                              <option value="MALE">Homem</option>
                              <option value="FEMALE">Mulher</option>
                              <option value="OTHER">Outro</option>
                            </select>
                            {!isResponsible && newFamily.members.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setNewFamily({
                                    ...newFamily,
                                    members: newFamily.members.filter((_, i) => i !== idx),
                                  })
                                }
                                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Remover membro"
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

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddFamily(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Salvar Família
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: CONFIGURAÇÕES DO PIX (NOVO)
            ======================================================== */}
        {showEditPixConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-md w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Configurações do Pix
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditPixConfig(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Configure a chave Pix e titular da conta para o recebimento dos valores de rateio.
              </p>

              {pixConfigError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pixConfigError}</span>
                </div>
              )}

              {pixConfigSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Dados do Pix salvos com sucesso!</span>
                </div>
              )}

              <form onSubmit={handleSavePixConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Chave Pix *
                  </label>
                  <select
                    value={pixConfigForm.pixKeyType}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, pixKeyType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone / Celular</option>
                    <option value="RANDOM">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chave Pix *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      pixConfigForm.pixKeyType === "CPF"
                        ? "000.000.000-00"
                        : pixConfigForm.pixKeyType === "PHONE"
                        ? "(11) 99999-8888"
                        : pixConfigForm.pixKeyType === "EMAIL"
                        ? "seuemail@pix.com"
                        : "Chave Pix"
                    }
                    value={pixConfigForm.pixKey}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, pixKey: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Titular da Conta (Recebedor) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do recebedor"
                    value={pixConfigForm.pixReceiverName}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, pixReceiverName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade do Titular
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: BRASILIA"
                    value={pixConfigForm.pixCity}
                    onChange={(e) => setPixConfigForm({ ...pixConfigForm, pixCity: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Padrão: BRASILIA (exigido pelo BACEN na geração do QR Code Pix).
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditPixConfig(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPixConfig}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingPixConfig ? "Salvando..." : "Salvar Configurações Pix"}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
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

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {editingFamily.members.map((member, idx) => {
                      const ageNum = parseInt(member.age) || 0;
                      const isPaying = ageNum >= event.minPayingAge;

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2"
                        >
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
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                          />
                          <div className="flex items-center gap-2">
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
                              className="w-20 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-center text-slate-900 dark:text-white"
                            />
                            <select
                              value={member.gender}
                              onChange={(e) => {
                                const updated = [...editingFamily.members];
                                updated[idx].gender = e.target.value;
                                setEditingFamily({ ...editingFamily, members: updated });
                              }}
                              className="flex-1 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                            >
                              <option value="MALE">Homem</option>
                              <option value="FEMALE">Mulher</option>
                              <option value="OTHER">Outro</option>
                            </select>

                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${
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
                                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Remover participante"
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

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingFamily(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* ========================================================
            MODAL: PIX ESPECÍFICO DE FAMÍLIA (COM SALDO PENDENTE)
            ======================================================== */}
        {pixModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-sm w-full shadow-2xl text-center space-y-4 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white text-left">
                  Cobrança Pix - {pixModalData.familyName}
                </h3>
                <button
                  onClick={() => setPixModalData(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detalhamento de Cota, Pago e Pendente */}
              <div className="grid grid-cols-3 gap-1 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Cota Total</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    R$ {pixModalData.totalCost.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Já Pago</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {pixModalData.totalPaid.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Saldo Restante</span>
                  <span
                    className={`text-xs font-bold ${
                      pixModalData.pendingAmount === 0
                        ? "text-emerald-600"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    R$ {pixModalData.pendingAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {!event.paymentsEnabled && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] text-left flex items-start gap-2">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    <strong>Confirmações em aberto:</strong> Este evento ainda não foi fechado. Os participantes não visualizam o QR Code no convite até que a lista seja finalizada pelo organizador.
                  </span>
                </div>
              )}

              {pixModalData.isFullyPaid && pixModalData.amount === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold block">Cota 100% Quitada!</span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Esta família já quitou todos os valores previstos para este evento.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-400 block font-semibold">
                      Valor deste QR Code Pix (Saldo Devedor):
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      R$ {pixModalData.amount.toFixed(2)}
                    </span>
                    {pixModalData.amount === pixModalData.pendingAmount && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Gerado automaticamente com o saldo pendente restante.
                      </span>
                    )}
                  </div>

                  {/* Ajuste de valor parcial opcional */}
                  <div className="text-left space-y-1 pt-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                      Ajustar valor do Pix (para pagamento parcial):
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="Ex: 100.00"
                        value={customPixAmount}
                        onChange={(e) => setCustomPixAmount(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        disabled={loadingPixAmount || !customPixAmount || parseFloat(customPixAmount) <= 0}
                        onClick={() => handleRecalculatePixWithAmount(parseFloat(customPixAmount))}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {loadingPixAmount ? "..." : "Atualizar"}
                      </button>
                      {pixModalData.amount !== pixModalData.pendingAmount && pixModalData.pendingAmount > 0 && (
                        <button
                          type="button"
                          disabled={loadingPixAmount}
                          onClick={() => {
                            setCustomPixAmount(String(pixModalData.pendingAmount));
                            handleRecalculatePixWithAmount(pixModalData.pendingAmount);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                          title="Restaurar valor do saldo pendente"
                        >
                          Saldo
                        </button>
                      )}
                    </div>
                  </div>

                  {pixModalData.qrCode && (
                    <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-200 w-fit mx-auto shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pixModalData.qrCode}
                        alt="QR Code Pix"
                        className="w-44 h-44 rounded-lg"
                      />
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
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
                          <span>Copiar Chave Pix Copia e Cola</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        const phoneDigits = (pixModalData.responsiblePhone || "").replace(/\D/g, "");
                        const msg = [
                          `Olá, *${pixModalData.responsibleName}*! Segue a chave Pix para o rateio do evento *${event.title}*:\n`,
                          `*Cota Total da Família:* R$ ${pixModalData.totalCost.toFixed(2)}`,
                          `*Total já Pago:* R$ ${pixModalData.totalPaid.toFixed(2)}`,
                          `*Saldo Pendente:* R$ ${pixModalData.pendingAmount.toFixed(2)}`,
                          pixModalData.amount !== pixModalData.pendingAmount
                            ? `*Valor deste Pix:* R$ ${pixModalData.amount.toFixed(2)}`
                            : `*Valor do Pix:* R$ ${pixModalData.amount.toFixed(2)}`,
                          `\n*Chave Pix Copia e Cola:*`,
                          `${pixModalData.payload}\n`,
                          `Após realizar o pagamento, por favor envie o comprovante por aqui. Obrigado!`
                        ].join("\n");

                        if (phoneDigits) {
                          window.open(`https://wa.me/55${phoneDigits}?text=${encodeURIComponent(msg)}`, "_blank");
                        } else {
                          navigator.clipboard.writeText(msg);
                          alert("Mensagem de cobrança Pix copiada! Cole na conversa do WhatsApp do responsável.");
                        }
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Cobrar no WhatsApp da Família</span>
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => setPixModalData(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: REGISTRO E HISTÓRICO DE PAGAMENTOS DA FAMÍLIA
            ======================================================== */}
        {paymentModalFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Gestão de Pagamentos - {paymentModalFamily.familyName}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Responsável: {paymentModalFamily.responsibleName}{" "}
                    {paymentModalFamily.responsiblePhone && `(${paymentModalFamily.responsiblePhone})`}
                  </span>
                </div>
                <button
                  onClick={() => setPaymentModalFamily(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Resumo Financeiro da Família */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center border border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Cota da Família</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    R$ {paymentModalFamily.familyTotalCost.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Total Recebido</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {paymentModalFamily.familyTotalPaid.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Saldo Restante</span>
                  <span
                    className={`text-sm font-bold ${
                      paymentModalFamily.familyPendingAmount === 0
                        ? "text-emerald-600"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    R$ {paymentModalFamily.familyPendingAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Formulário de Novo Pagamento */}
              {event.canEdit && (
                <form onSubmit={handleSavePayment} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Lançar Pagamento (Parcial ou Total)
                    </span>
                    {paymentModalFamily.familyPendingAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(paymentModalFamily.familyPendingAmount))}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                      >
                        Preencher Saldo (R$ {paymentModalFamily.familyPendingAmount.toFixed(2)})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Valor Pago (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="Ex: 150.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="PIX">Pix</option>
                        <option value="DINHEIRO">Dinheiro em Espécie</option>
                        <option value="TRANSFERENCIA">Transferência Bancária (TED/DOC)</option>
                        <option value="CARTAO">Cartão de Crédito/Débito</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Data do Pagamento
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Observação / Comprovante
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Comprovante enviado no WhatsApp"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{paymentSubmitting ? "Registrando..." : "Confirmar Lançamento de Pagamento"}</span>
                  </button>
                </form>
              )}

              {/* Histórico de Lançamentos */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Histórico de Pagamentos ({paymentModalFamily.payments?.length || 0})
                  </span>
                </div>

                {(!paymentModalFamily.payments || paymentModalFamily.payments.length === 0) ? (
                  <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                    Nenhum pagamento registrado ainda para esta família.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {paymentModalFamily.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              R$ {payment.amount.toFixed(2)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              {payment.method}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(payment.paidAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          {payment.note && (
                            <span className="text-[11px] text-slate-500 block">
                              Obs: {payment.note}
                            </span>
                          )}
                        </div>

                        {event.canEdit && (
                          <button
                            onClick={() => handleDeletePaymentRecord(payment.id)}
                            title="Estornar / Excluir pagamento"
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPaymentModalFamily(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL: IMPORTAR LISTA DO WHATSAPP
            ======================================================== */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Colar Lista do WhatsApp
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Importação ágil em lote
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFeedback(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                Cole abaixo o texto ou lista de nomes compartilhada no WhatsApp. O sistema reconhece numerações, casais e especificações de adultos e crianças:
              </p>

              <div className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Exemplos aceitos:</span>
                <div>• 1. Família Curti (2 adultos, 1 criança)</div>
                <div>• 2. Carlos e Mariana</div>
                <div>• 3. Tio Roberto</div>
              </div>

              {importFeedback && (
                <div
                  className={`mb-3 p-3 rounded-xl flex items-center gap-2.5 text-xs ${
                    importFeedback.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleImportWhatsAppList} className="space-y-4">
                <div>
                  <textarea
                    rows={6}
                    required
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Cole aqui a lista...&#10;1. João Silva (2 adultos, 1 criança)&#10;2. Carlos e Ana&#10;3. Pedro"
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFeedback(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !importText.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {importLoading ? "Processando..." : "Importar Participantes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Zona de Perigo para o Proprietário */}
        {event.isOwner && (
          <div className="mt-12 p-5 sm:p-6 rounded-3xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Excluir Evento
              </h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 max-w-xl leading-relaxed">
                Esta ação remove o evento, suas despesas, famílias cadastradas e encerra imediatamente o link público do WhatsApp.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 transition-all self-start sm:self-auto min-h-[42px] flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Evento
            </button>
          </div>
        )}

        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteEvent}
          eventTitle={event.title}
          isDeleting={deleteLoading}
        />
      </main>
    </div>
  );
}
