"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Next.js Error Boundary capturou um erro:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0a0a0a]">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertCircle className="text-red-500 w-8 h-8" />
      </div>
      <h2 className="text-[20px] font-bold text-white mb-2 text-center tracking-tight">
        Ops! Algo deu errado.
      </h2>
      <p className="text-[14px] text-zinc-400 mb-8 max-w-[320px] text-center">
        Encontramos um problema inesperado ao carregar esta página. Nossa equipe foi notificada (mentira, mas o erro foi logado).
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-zinc-900 border border-white/[0.04] text-white text-[14px] font-medium hover:bg-zinc-800 transition-colors active:scale-95"
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#7A8F6B] text-zinc-950 text-[14px] font-semibold hover:bg-[#8da77c] transition-colors active:scale-95 shadow-md shadow-[#7A8F6B]/10"
        >
          <Home size={16} />
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
