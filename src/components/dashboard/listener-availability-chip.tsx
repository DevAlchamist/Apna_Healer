"use client";

import { motion } from "framer-motion";
import { useBookSessionModal } from "./book-session-modal";

export function ListenerAvailabilityChip() {
  const { open } = useBookSessionModal();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        type="button"
        onClick={() => open()}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-soft transition-shadow hover:shadow-soft-hover"
        initial={{ backgroundColor: "#1f6f66" }}
        animate={{
          backgroundColor: ["#1f6f66", "#46b7aa", "#1f6f66"],
          boxShadow: [
            "0 8px 20px -10px rgba(31, 111, 102, 0.55)",
            "0 12px 28px -12px rgba(70, 183, 170, 0.6)",
            "0 8px 20px -10px rgba(31, 111, 102, 0.55)",
          ],
        }}
        transition={{
          backgroundColor: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
          boxShadow: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.98 }}
        whileFocus={{ scale: 1.02 }}
      >
        <motion.span
          className="inline-block h-2 w-2 rounded-full bg-[#d5fff0]"
          aria-hidden
          animate={{ opacity: [0.65, 1, 0.65], scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        />
        <span>Listeners Available</span>
      </motion.button>
    </div>
  );
}
