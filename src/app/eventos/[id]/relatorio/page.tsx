"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Printer, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Flame,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  gender: string;
  age: number;
  isPaying: boolean;
}

interface Cost {
  id: string;
  name: string;
  amount: number;
  dueDate: string | null;
  category: string | null;
}

interface Family {
  id: string;
  familyName: string;
  responsibleName: string;
  paymentStatus: string;
  payingCount: number;
  exemptCount: number;
  familyTotalCost: number;
  familyTotalPaid: number;
  familyPendingAmount: number;
  members: Member[];
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  locationName: string | null;
  status: string;
  totalCosts: number;
  totalPayingParticipants: number;
  totalExemptParticipants: number;
  costPerQuota: number;
  costs: Cost[];
  families: Family[];
}

export default function RelatorioEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bbqData, setBbqData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, bbqRes] = await Promise.all([
          fetch(`/api/eventos/${id}`),
          fetch(`/api/eventos/${id}/churrasco`)
        ]);

        if (eventRes.status === 401) {
          router.push(`/login?from=/eventos/${id}/relatorio`);
          return;
        }

        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData.event);
        }

        if (bbqRes.ok) {
          const bbqData = await bbqRes.json();
          setBbqData(bbqData.bbq);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do relatório:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Evento não encontrado</h2>
          <Link href={`/eventos/${id}`} className="mt-4 inline-block text-primary hover:underline">
            Voltar para o evento
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Barra de Controles (Escondida na impressão) */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between mb-8">
        <Link 
          href={`/eventos/${id}`}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium hidden sm:inline">Voltar ao Evento</span>
        </Link>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Salvar PDF / Imprimir
          </button>
        </div>
      </div>

      {/* Página do Relatório (A4 Size/Style) */}
      <div className="max-w-[210mm] mx-auto bg-white sm:shadow-lg sm:rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        {/* Cabeçalho do Relatório */}
        <div className="border-b-4 border-primary p-8 print:p-6 bg-gray-50/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              {event.description && <p className="text-gray-600 max-w-2xl">{event.description}</p>}
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-2 border border-primary/20">
                Relatório Oficial
              </span>
              <p className="text-xs text-gray-500">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-6">
            <div className="flex items-center text-gray-700 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <Calendar className="w-5 h-5 mr-3 text-primary/70" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Data e Hora</p>
                <p className="font-medium">{formatDate(event.startDate)}</p>
              </div>
            </div>
            {event.locationName && (
              <div className="flex items-center text-gray-700 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <MapPin className="w-5 h-5 mr-3 text-primary/70" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Local</p>
                  <p className="font-medium">{event.locationName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 print:p-6 space-y-10">
          
          {/* Resumo Financeiro & Participantes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-primary" />
              Resumo Geral do Rateio
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500 font-medium mb-1">Custo Total</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(event.totalCosts)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500 font-medium mb-1">Valor da Cota</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(event.costPerQuota)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500 font-medium mb-1">Pagantes</p>
                <div className="flex items-center justify-center text-xl font-bold text-gray-900">
                  <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                  {event.totalPayingParticipants}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                <p className="text-sm text-gray-500 font-medium mb-1">Isentos</p>
                <div className="flex items-center justify-center text-xl font-bold text-gray-900">
                  <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                  {event.totalExemptParticipants}
                </div>
              </div>
            </div>
          </section>

          {/* Churrascômetro (se habilitado) */}
          {bbqData && bbqData.enabled && bbqData.totals && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-orange-500" />
                Churrascômetro (Lista de Compras)
              </h2>
              <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {Object.entries(bbqData.totals).map(([key, data]: [string, any]) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div key={key} className="bg-white p-3 rounded-lg shadow-sm border border-orange-100/50 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl mb-2">{data.icon}</span>
                      <p className="text-lg font-bold text-gray-900">{data.amount} <span className="text-sm font-medium text-gray-500">{data.unit}</span></p>
                      <p className="text-xs text-gray-600 font-medium capitalize mt-1">{data.name}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center text-gray-500 mt-4 bg-white/60 p-2 rounded">
                  *Cálculo automático baseado no número de participantes (homens, mulheres e crianças)
                </p>
              </div>
            </section>
          )}

          {/* Tabela de Custos */}
          <section className="break-inside-avoid">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-primary" />
              Detalhamento de Custos
            </h2>
            {event.costs.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {event.costs.map((cost) => (
                      <tr key={cost.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{cost.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{cost.category?.replace(/_/g, ' ') || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(cost.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={2} className="px-4 py-3 text-sm text-gray-900 text-right">TOTAL</td>
                      <td className="px-4 py-3 text-sm text-primary text-right">{formatCurrency(event.totalCosts)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">Nenhum custo registrado para este evento.</p>
            )}
          </section>

          {/* Famílias e Participantes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              Famílias e Participantes
            </h2>
            
            <div className="space-y-6">
              {event.families.map((family) => (
                <div key={family.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden break-inside-avoid">
                  {/* Cabeçalho da Família */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center">
                        {family.familyName}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Resp: {family.responsibleName}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                      <div className="text-center">
                        <span className="block text-xs text-gray-500">Cota Total</span>
                        <span className="font-bold text-gray-900">{formatCurrency(family.familyTotalCost)}</span>
                      </div>
                      <div className="w-px h-8 bg-gray-200"></div>
                      <div className="text-center">
                        <span className="block text-xs text-gray-500">Status</span>
                        <span className={`font-bold ${
                          family.paymentStatus === 'PAID' ? 'text-green-600' :
                          family.paymentStatus === 'PARTIAL' ? 'text-orange-500' :
                          'text-red-600'
                        }`}>
                          {family.paymentStatus === 'PAID' ? 'PAGO' :
                           family.paymentStatus === 'PARTIAL' ? 'PARCIAL' : 'PENDENTE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Membros da Família */}
                  <div className="p-0">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Participante</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Idade</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Cota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {family.members.map((member) => (
                          <tr key={member.id} className={!member.isPaying ? 'bg-gray-50/50' : ''}>
                            <td className="px-4 py-2.5 text-sm">
                              <span className={`font-medium ${!member.isPaying ? 'text-gray-600' : 'text-gray-900'}`}>
                                {member.name}
                              </span>
                              {!member.isPaying && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                  Isento
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-gray-500 text-center">
                              {member.age} anos
                            </td>
                            <td className="px-4 py-2.5 text-sm text-right font-medium">
                              {member.isPaying ? formatCurrency(event.costPerQuota) : formatCurrency(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              
              {event.families.length === 0 && (
                <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  Nenhuma família confirmada neste evento.
                </p>
              )}
            </div>
          </section>

        </div>
        
        {/* Rodapé do Relatório */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 text-center">
          <p className="text-sm text-gray-500 font-medium">OrganizaAI - Gerador de Relatórios</p>
          <p className="text-xs text-gray-400 mt-1">organizaai.com.br</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 10mm;
            size: A4;
          }
        }
      `}} />
    </div>
  );
}
