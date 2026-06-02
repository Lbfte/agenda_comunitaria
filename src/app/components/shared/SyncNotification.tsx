import { motion, AnimatePresence } from "motion/react";

interface SyncNotificationProps {
  message: string | null;
}

export function SyncNotification({ message }: SyncNotificationProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="fixed top-6 left-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-[12px] font-medium text-white shadow-xl flex items-center gap-2 whitespace-nowrap"
        >
          {message.includes("Erro") ? (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
