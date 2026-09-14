"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  MapPin,
  DollarSign,
  Share2,
  Users,
  QrCode,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Flame,
} from "lucide-react";

interface WelcomeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreateEvent?: () => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  description: string;
  highlights: { title: string; desc: string; icon?: React.ComponentType<{ className?: string }> }[];
  tip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Crie sua Confraternização",
    subtitle: "Em menos de 1 minuto, sem burocracia",
    badge: "Passo 1",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
    icon: Sparkles,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    description: "Dê adeus às planilhas bagunçadas. Organize o rancho, churrasco ou viagem de fim de ano de forma centralizada.",
    highlights: [
      {
        title: "Modo Rápido Instantâneo",
        desc: "Defina os dados essenciais e simule a cota por participante na hora.",
        icon: Zap,
      },
      {
        title: "Localização & GPS Inteligente",
        desc: "Cole o link do Google Maps ou use seu GPS. Seus convidados traçam a rota com 1 toque no celular!",
        icon: MapPin,
      },
    ],
    tip: "Seus convidados acessam tudo direto no WhatsApp sem precisar instalar nenhum aplicativo.",
  },
  {
    title: "Custos & Cota em Tempo Real",
    subtitle: "Divisão justa e transparente",
    badge: "Passo 2",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
    icon: DollarSign,
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    description: "Lance os gastos previstos e deixe o OrganizaAI calcular automaticamente o valor por família.",
    highlights: [
      {
        title: "Simulador de Cota",
        desc: "Insira despesas como aluguel do rancho, bebidas e carnes para saber a cota exata por pagante.",
        icon: DollarSign,
      },
      {
        title: "Regra de Isenção para Crianças",
        desc: "Defina a idade mínima de pagamento (ex: 12 anos). Menores de idade ficam isentos automaticamente.",
        icon: Users,
      },
      {
        title: "Churrascômetro Integrado",
        desc: "Calcula a quantidade recomendada de carnes e bebidas para o número de pessoas.",
        icon: Flame,
      },
    ],
  },
  {
    title: "Convite Direto no WhatsApp",
    subtitle: "Cada família confirma sua presença",
    badge: "Passo 3",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300",
    icon: Share2,
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    description: "Cada evento gera um link exclusivo para compartilhar no grupo da família ou dos amigos.",
    highlights: [
      {
        title: "Confirmação Autônoma",
        desc: "Os convidados preenchem os nomes e idades dos acompanhantes de forma rápida e segura.",
        icon: Users,
      },
      {
        title: "Lista Sempre Atualizada",
        desc: "Conforme as famílias confirmam, a cota por pagante e o consumo de carne são recalculados.",
        icon: CheckCircle2,
      },
    ],
    tip: "Você não precisa mais ficar cobrando confirmações uma a uma no chat privado.",
  },
  {
    title: "Rateio & Pix Custo Zero",
    subtitle: "Acerto sem taxas nem intermediários",
    badge: "Passo 4",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
    icon: QrCode,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    description: "Os participantes veem o valor exato que devem pagar com base no número de pessoas da sua família.",
    highlights: [
      {
        title: "QR Code e Copia e Cola Pix",
        desc: "Cadastre sua chave Pix. O convidado clica, copia e paga direto no app do banco.",
        icon: QrCode,
      },
      {
        title: "Envio de Comprovante",
        desc: "Os participantes anexam o comprovante diretamente pelo link e você valida em um clique.",
        icon: CheckCircle2,
      },
    ],
    tip: "Tudo pronto! Seu primeiro evento pode ser criado agora mesmo em poucos segundos.",
  },
];

export function WelcomeTourModal({ isOpen, onClose, onStartCreateEvent }: WelcomeTourModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleFinish = (navigate = false) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("organizaai_welcome_tour_seen", "true");
      } catch {}
    }
    setCurrentStep(0);
    onClose();
    if (navigate) {
      if (onStartCreateEvent) {
        onStartCreateEvent();
      } else {
        router.push("/eventos/novo");
      }
    }
  };

  const handleClose = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      try {
        localStorage.setItem("organizaai_welcome_tour_seen", "true");
      } catch {}
    }
    setCurrentStep(0);
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const StepIcon = step.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header com indicador de etapa e botão de fechar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${step.badgeColor}`}
            >
              {step.badge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              de {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar guia"
            aria-label="Fechar guia"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 shrink-0">
          <div
            className="bg-emerald-500 h-1.5 transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Conteúdo rolável Mobile-First */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Card Principal da Etapa */}
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${step.iconBg} ${step.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
            >
              <StepIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2
                id="tour-modal-title"
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight"
              >
                {step.title}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                {step.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Destaques da Etapa */}
          <div className="space-y-2.5 pt-1">
            {step.highlights.map((item, idx) => {
              const ItemIcon = item.icon || CheckCircle2;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                    <ItemIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dica opcional */}
          {step.tip && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <span className="font-bold shrink-0">💡 Dica:</span>
              <span>{step.tip}</span>
            </div>
          )}
        </div>

        {/* Footer com Navegação e Ações */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
          {/* Indicadores de bolinhas para telas touch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === currentStep
                      ? "w-6 bg-emerald-600 dark:bg-emerald-500"
                      : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                  }`}
                  title={`Ir para o passo ${i + 1}`}
                  aria-label={`Ir para o passo ${i + 1}`}
                />
              ))}
            </div>

            {/* Checkbox "Não exibir automaticamente" */}
            <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Não abrir sozinho</span>
            </label>
          </div>

          {/* Botões de Ação com touch targets ergonômicos */}
          <div className="flex items-center gap-2">
            {!isFirst ? (
              <button
                type="button"
                onClick={handlePrev}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Pular
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:shadow-none cursor-pointer"
            >
              {isLast ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Criar Primeiro Evento</span>
                </>
              ) : (
                <>
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
