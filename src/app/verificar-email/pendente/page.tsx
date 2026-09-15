"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { MailCheck } from "lucide-react";

export default function PendingVerificationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
          <div className="flex justify-center mb-6">
            <MailCheck className="w-16 h-16 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Verifique seu e-mail
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm sm:text-base leading-relaxed">
            Acabamos de enviar um link de confirmação para o seu e-mail. Por favor, clique nele para ativar sua conta e acessar o sistema.
          </p>

          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-sm transition-all min-h-[44px]"
          >
            Já confirmei, ir para o Login
          </Link>
        </div>
      </main>
    </div>
  );
}
