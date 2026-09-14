"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  PlusCircle,
  Share2,
  Check,
  ChevronRight,
  Sparkles,
  Clock,
  Trash2,
  X,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  QrCode,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { WelcomeTourModal } from "@/components/welcome-tour-modal";
import { getGoogleMapsUrl } from "@/lib/maps";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  locationName: string | null;
  locationUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  minPayingAge: number;
  inviteCode: string;
  isOwner: boolean;
  canEdit: boolean;
  isPast: boolean;
  totalCost: number;
  totalParticipants: number;
  payingParticipants: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMorePast, setHasMorePast] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTourModal, setShowTourModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [upRes, pastRes] = await Promise.all([
          fetch("/api/eventos?status=upcoming"),
          fetch("/api/eventos?status=past&page=1&limit=6")
        ]);

        if (upRes.status === 401 || pastRes.status === 401) {
          router.push("/login?from=/dashboard");
          return;
        }

        const upData = await upRes.json();
        const pastData = await pastRes.json();

        const upcoming = upData.events || [];
        const past = pastData.events || [];
        
        setUpcomingEvents(upcoming);
        setPastEvents(past);
        
        if (pastData.pagination) {
          setHasMorePast(pastData.pagination.hasNextPage);
        }

        setLoading(false);

        if (upcoming.length === 0 && past.length === 0) {
          try {
            const hasSeen = localStorage.getItem("organizaai_welcome_tour_seen");
            if (hasSeen !== "true") {
              setShowTourModal(true);
            }
          } catch {}
        }
      } catch (err) {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [router]);

  const loadMorePastEvents = async () => {
    if (loadingMore || !hasMorePast) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/eventos?status=past&page=${nextPage}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setPastEvents(prev => [...prev, ...(data.events || [])]);
        setPage(nextPage);
        if (data.pagination) {
          setHasMorePast(data.pagination.hasNextPage);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteRequest = (event: EventItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEventToDelete(event);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/eventos/${eventToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir evento");
      }
      if (eventToDelete.isPast) {
        setPastEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      } else {
        setUpcomingEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      }
      setEventToDelete(null);
      setToastMessage("Evento excluído com sucesso!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      const message = err.message || "Erro ao excluir evento";
      alert(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyInviteLink = (inviteCode: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/convite/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startFmt = start.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    const endFmt = end.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${startFmt} até ${endFmt}`;
  };
\n  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Title and Create Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Painel de Eventos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gerencie suas confraternizações, custos de rancho e rateio por família
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowTourModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium text-xs sm:text-sm min-h-[44px] transition-colors shadow-xs cursor-pointer"
              title="Aprenda como funciona o OrganizaAI"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Como funciona?</span>
            </button>

            <Link
              href="/eventos/novo"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:shadow-none min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Evento</span>
            </Link>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 p-1.5 rounded-lg"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-slate-200/70 dark:bg-slate-800/40 animate-pulse border border-slate-200/50 dark:border-slate-800"
              />
            ))}
          </div>
        ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 shadow-sm max-w-4xl mx-auto animate-in fade-in duration-200">
            {/* Top Badge & Titles */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Primeiros Passos no OrganizaAI</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Pronto para organizar sua primeira confraternização?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Chega de confusão em planilhas ou cobranças chatas no WhatsApp. Veja como o OrganizaAI resolve tudo em 4 passos simples:
              </p>
            </div>

            {/* 4-Step Cards (Mobile-First responsive grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-8">
              {/* Step 1 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Crie o Evento
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Nome, datas e o link do Google Maps para que ninguém se perca no trajeto.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                      02
                    </div>
                    <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Lance os Custos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Aluguel, rancho, carnes e bebidas. A cota por participante é calculada na hora.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      03
                    </div>
                    <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Envie no WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Cada família confirma presenças e acompanhantes direto pelo link com um toque.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      04
                    </div>
                    <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Rateio & Pix Direto
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Valores transparentes por família e recebimento por QR Code sem taxas.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions (Mobile-First) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/eventos/novo"
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:shadow-none cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Criar Primeiro Evento</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>

              <button
                type="button"
                onClick={() => setShowTourModal(true)}
                className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ver Tour Interativo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Próximos Eventos */}
            {upcomingEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Próximos Eventos ({upcomingEvents.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      copiedCode={copiedCode}
                      onCopyInvite={copyInviteLink}
                      formatDateRange={formatDateRange}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Eventos Passados / Finalizados */}
            {pastEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400">
                    Eventos Finalizados ({pastEvents.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                  {pastEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      copiedCode={copiedCode}
                      onCopyInvite={copyInviteLink}
                      formatDateRange={formatDateRange}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ConfirmDeleteModal
        isOpen={Boolean(eventToDelete)}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDelete}
        eventTitle={eventToDelete?.title || ""}
        isDeleting={deleteLoading}
      />

      <WelcomeTourModal
        isOpen={showTourModal}
        onClose={() => setShowTourModal(false)}
        onStartCreateEvent={() => router.push("/eventos/novo")}
      />
    </div>
  );
}

function EventCard({
  event,
  copiedCode,
  onCopyInvite,
  formatDateRange,
  onDelete,
}: {
  event: EventItem;
  copiedCode: string | null;
  onCopyInvite: (code: string, e: React.MouseEvent) => void;
  formatDateRange: (s: string, e: string) => string;
  onDelete: (event: EventItem, e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={`/eventos/${event.id}`}
      className="group block bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              event.isPast
                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            }`}
          >
            {event.isPast ? "Finalizado" : "Confirmado"}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              {event.isOwner ? "Criado por você" : "Participando"}
            </span>

            {event.isOwner && (
              <button
                type="button"
                onClick={(e) => onDelete(event, e)}
                title="Excluir evento"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>

          {(event.locationName || event.locationUrl) && (
            (() => {
              const mapUrl = getGoogleMapsUrl(event);
              return mapUrl ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="truncate hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline inline-flex items-center gap-1 transition-colors"
                    title="Abrir no Google Maps"
                  >
                    <span className="truncate">{event.locationName || "Ver no Google Maps"}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 opacity-70" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{event.locationName}</span>
                </div>
              );
            })()
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[11px] text-slate-400 block font-medium">Custo Total</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-0.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              R$ {event.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60">
            <span className="text-[11px] text-slate-400 block font-medium">Participantes</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              {event.totalParticipants} ({event.payingParticipants} pagantes)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={(e) => onCopyInvite(event.inviteCode, e)}
            title="Copiar link de convite para WhatsApp"
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copiedCode === event.inviteCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copiar Convite</span>
              </>
            )}
          </button>

          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Ver Detalhes
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
