"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token não encontrado.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Ocorreu um erro ao verificar o e-mail.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Erro de conexão com o servidor.");
      });
  }, [token]);

  return (
    <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Verificando seu e-mail...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">E-mail Confirmado!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Sua conta foi ativada com sucesso. Você já pode acessar o painel.
          </p>
          <Link
            href="/login"
            className="w-full mt-4 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center transition-all min-h-[44px]"
          >
            Ir para o Login
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <XCircle className="w-16 h-16 text-rose-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ops, algo deu errado</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{errorMessage}</p>
          <Link
            href="/cadastro"
            className="w-full mt-4 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-sm flex items-center justify-center transition-all min-h-[44px]"
          >
            Voltar ao Cadastro
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#0f172a] rounded-2xl w-full max-w-md">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </main>
    </div>
  );
}
