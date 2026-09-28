"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Calendar, MapPin, Loader2, AlertCircle, Eye, ShieldAlert, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ViewEventInfo {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  locationName: string | null;
  creator: { name: string };
}

export default function VisualizarEventPage({
  params,
}: {
  params: Promise<{ viewCode: string }>;
}) {
  const { viewCode } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<ViewEventInfo | null>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/visualizar/${viewCode}`);
        const data = await res.json();
        if (res.ok) {
          setEvent(data.event);
          setRequestStatus(data.requestStatus);
          setIsAuthenticated(data.isAuthenticated);
          
          if (!data.isAuthenticated) {
            // Require login to even see the view page or request
            router.push(`/login?from=/visualizar/${viewCode}`);
          }
        } else {
          setError(data.error || "Evento não encontrado.");
        }
      } catch (err) {
        setError("Falha de conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [viewCode, router]);

  const handleRequestAccess = async () => {
    if (!isAuthenticated) {
      router.push(`/login?from=/visualizar/${viewCode}`);
      return;
    }

    setRequesting(true);
    try {
      const res = await fetch(`/api/visualizar/${viewCode}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setRequestStatus("PENDING");
      } else {
        alert(data.error || "Erro ao solicitar acesso.");
      }
    } catch (err) {
      alert("Erro ao se comunicar com o servidor.");
    } finally {
      setRequesting(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-8 max-w-md w-full shadow-sm border border-slate-200 dark:border-slate-800 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Evento indisponível</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
            >
              Voltar ao Início
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl w-full max-w-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          <div className="p-6 sm:p-8 text-center border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
              <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400 -rotate-3" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              {event.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Organizado por <span className="text-slate-700 dark:text-slate-300">{event.creator.name}</span>
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {requestStatus === "APPROVED" ? (
              <div className="space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-sm font-medium flex items-start gap-3 border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p>Você tem permissão para visualizar as informações deste evento.</p>
                </div>

                {event.description && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição</h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}

                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0b1121] border border-slate-100 dark:border-slate-800/60">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Início</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(event.startDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0b1121] border border-slate-100 dark:border-slate-800/60">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Término</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(event.endDate)}</p>
                    </div>
                  </div>

                  {event.locationName && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0b1121] border border-slate-100 dark:border-slate-800/60">
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                        <MapPin className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Local</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{event.locationName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : requestStatus === "PENDING" ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Solicitação em análise</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  O organizador do evento precisa aprovar sua solicitação de visualização. Volte mais tarde.
                </p>
              </div>
            ) : requestStatus === "REJECTED" ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Acesso Recusado</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sua solicitação para visualizar este evento foi recusada pelo organizador.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Este evento requer aprovação do organizador para ser visualizado. Solicite acesso para ver mais detalhes.
                </p>
                <button
                  onClick={handleRequestAccess}
                  disabled={requesting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-semibold transition-all disabled:opacity-70"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Solicitando...</span>
                    </>
                  ) : (
                    <span>Solicitar Acesso</span>
                  )}
                </button>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center">
              <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
                Voltar ao Início
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
