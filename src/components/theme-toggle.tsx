"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-28 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
    );
  }

  return (
    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full border border-neutral-200 dark:border-neutral-700">
      <button
        onClick={() => setTheme("light")}
        title="Tema Claro"
        className={`p-1.5 rounded-full transition-all ${
          theme === "light"
            ? "bg-white text-amber-500 shadow-sm"
            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        title="Tema Escuro"
        className={`p-1.5 rounded-full transition-all ${
          theme === "dark"
            ? "bg-neutral-900 text-indigo-400 shadow-sm"
            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        title="Tema do Sistema"
        className={`p-1.5 rounded-full transition-all ${
          theme === "system"
            ? "bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        }`}
      >
        <Laptop className="w-4 h-4" />
      </button>
    </div>
  );
}
