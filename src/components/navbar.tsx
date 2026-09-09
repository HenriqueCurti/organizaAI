"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { CalendarCheck, Flame, LogOut, User, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#080d1a]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
              Organiza<span className="text-emerald-600 dark:text-emerald-400">AI</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Rancho, Rateio & Churras
            </span>
          </div>
        </Link>

        {/* Right side navigation */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Meus Eventos
                  </Link>

                  <Link
                    href="/eventos/novo"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:shadow"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Criar Evento</span>
                  </Link>

                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={handleLogout}
                      title="Sair da conta"
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className="px-4 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                  >
                    Começar Grátis
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
