"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import {
  CalendarCheck,
  Flame,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Home,
  Bot,
  LogIn,
  UserPlus,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fechar o menu mobile sempre que a rota mudar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Travar o scroll da página quando o menu lateral estiver aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Fechar menu mobile com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMobileMenuOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-[#080d1a]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Flame className="w-5 h-5 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                Organiza<span className="text-emerald-600 dark:text-emerald-400">AI</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Rancho, Rateio & Churras
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (>= md) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {!user && (
              <Link
                href="/"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/") && pathname === "/"
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                Início
              </Link>
            )}

            {!loading && user && (
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Meus Eventos</span>
              </Link>
            )}

            <Link
              href="/api-docs"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive("/api-docs")
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Bot className="w-4 h-4 text-emerald-500" />
              <span>API Docs</span>
            </Link>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* Desktop User Actions (>= md) */}
            <div className="hidden md:flex items-center gap-2.5">
              {!loading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-3">
                      <Link
                        href="/eventos/novo"
                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Criar Evento</span>
                      </Link>

                      <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                        <div
                          title={user.name}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 shrink-0"
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                          onClick={handleLogout}
                          disabled={loggingOut}
                          title="Sair da conta"
                          className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          {loggingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        href="/login"
                        className="px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/cadastro"
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                      >
                        Começar
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Hamburger Toggle (< md) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700/80"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800 dark:text-slate-100" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Slide-Over Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white dark:bg-[#0b1329] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 md:hidden flex flex-col justify-between p-5 overflow-y-auto touch-scroll transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação mobile"
      >
        {/* Drawer Top */}
        <div className="flex flex-col gap-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <Link
              href={user ? "/dashboard" : "/"}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Flame className="w-4 h-4 fill-white/20" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base leading-tight text-slate-900 dark:text-white">
                  Organiza<span className="text-emerald-600 dark:text-emerald-400">AI</span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Rancho & Churrasco
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card (if logged in) */}
          {!loading && user && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0" />
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {!user && (
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between min-h-[46px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive("/") && pathname === "/"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <span>Início</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </Link>
            )}

            {!loading && user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between min-h-[46px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive("/dashboard")
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Meus Eventos</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </Link>

                <div className="pt-2">
                  <Link
                    href="/eventos/novo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full min-h-[46px] px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>Criar Novo Evento</span>
                  </Link>
                </div>
              </>
            ) : (
              !loading && (
                <>
                  <div className="pt-3 pb-1">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-3.5 mb-1.5">
                      Minha Conta
                    </p>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between min-h-[46px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive("/login")
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <LogIn className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <span>Entrar na Conta</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </Link>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/cadastro"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full min-h-[46px] px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Criar Conta Grátis</span>
                    </Link>
                  </div>
                </>
              )
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2">
              <Link
                href="/api-docs"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between min-h-[46px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive("/api-docs")
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-emerald-500" />
                  <span>Documentação da API</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </Link>
            </div>
          </nav>
        </div>

        {/* Drawer Bottom */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
          {!loading && user && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center justify-center gap-2.5 w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  <span>Saindo...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Sair da conta</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-between px-1 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              OrganizaAI v1.0
            </span>
            <span>Rancho & Churras</span>
          </div>
        </div>
      </div>
    </>
  );
}

