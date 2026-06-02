"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0a0a0a]">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-[20px] font-bold text-white mb-2 text-center tracking-tight">
            Erro Fatal
          </h2>
          <p className="text-[14px] text-zinc-400 mb-8 max-w-[320px] text-center">
            Um erro crítico ocorreu na estrutura principal do aplicativo.
          </p>
          
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-zinc-900 border border-white/[0.04] text-white text-[14px] font-medium hover:bg-zinc-800 transition-colors active:scale-95"
          >
            <RefreshCw size={16} />
            Recarregar Aplicativo
          </button>
        </div>
      </body>
    </html>
  );
}
