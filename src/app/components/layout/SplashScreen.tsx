"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState(0);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1200);
    const t4 = setTimeout(onFinish, 2000);
    
    // Mostra o botão de emergência se o carregamento passar de 4 segundos
    const tReset = setTimeout(() => setShowReset(true), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tReset);
    };
  }, [onFinish]);

  const clearCookiesAndStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error("Erro ao limpar Storage:", e);
    }

    // Limpar todos os cookies
    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname.split('.').slice(-2).join('.')};`;
      }
    } catch (e) {
      console.error("Erro ao limpar cookies:", e);
    }

    // Forçar recarregamento da página limpa
    window.location.reload();
  };

  const r = 18;
  const gap = 4;
  const s = 56;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "#1E1E1E" }}>
      <div className="relative" style={{ width: s * 2 + gap, height: s * 2 + gap }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: phase >= 0 ? 1 : 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute"
          style={{ left: 0, top: 0, width: s, height: s, borderRadius: r, background: "#FFFFD3" }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute"
          style={{ left: s + gap, top: 0, width: s, height: s, borderRadius: r, background: "#3A3A3A" }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute"
          style={{ left: 0, top: s + gap, width: s, height: s, borderRadius: r, background: "#7A8F6B" }}
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 3 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="absolute mt-44 text-[13px] text-[#555]"
      >
        Agenda da Turma
      </motion.p>

      {/* Botão de Emergência */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute bottom-12 flex flex-col items-center gap-2.5 px-6 text-center"
          >
            <p className="text-[12px] text-zinc-500 font-medium">O carregamento está demorando mais que o esperado?</p>
            <button
              onClick={clearCookiesAndStorage}
              className="h-10 px-4 rounded-xl flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-semibold text-[12px] transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-red-500/5"
            >
              <Trash2 size={13} />
              <span>Limpar Cookies & Sessão</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
