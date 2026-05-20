import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1200);
    const t4 = setTimeout(onFinish, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onFinish]);

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
    </div>
  );
}
