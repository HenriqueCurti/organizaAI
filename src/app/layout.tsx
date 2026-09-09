import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrganizaAI - Gestão de Confraternizações, Rateio Familiar & Churrascômetro",
  description:
    "Organize ranchos, sítios e confraternizações. Rateio automático por família, cobrança Pix descomplicada e cálculo inteligente de carnes e bebidas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
