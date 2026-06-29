"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function SuccessCheck() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="grid h-16 w-16 place-items-center rounded-full bg-ink"
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
        <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
      </motion.div>
    </motion.div>
  );
}
