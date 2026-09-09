"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import Head from "next/head";

export default function ApiDocsPage() {
  useEffect(() => {
    // Carregar scripts do Swagger UI dinamicamente
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      // @ts-ignore
      if (window.SwaggerUIBundle) {
        // @ts-ignore
        window.SwaggerUIBundle({
          url: "/api/docs/swagger.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            // @ts-ignore
            window.SwaggerUIBundle.presets.apis,
            // @ts-ignore
            window.SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#080d1a]">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Documentação da API do OrganizaAI (OpenAPI 3.0 / Swagger)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Endpoints RESTful documentados para integração direta com agentes de inteligência artificial,
            bots de WhatsApp (Evolution API / Z-API), Telegram e fluxos de automação n8n.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 min-h-[600px]">
          <div id="swagger-ui" />
        </div>
      </div>
    </div>
  );
}
