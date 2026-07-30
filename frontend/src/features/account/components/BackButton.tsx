import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, label = "Back" }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ x: -2 }}
    whileTap={{ scale: 0.96 }}
    className="group -mt-1 mb-2 inline-flex items-center gap-1.5 rounded-full py-1.5 pl-1 pr-3 text-xs font-semibold text-ink/45 transition-colors hover:text-plum-600"
  >
    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/10 bg-neutral-50 transition-colors group-hover:border-plum-200 group-hover:bg-plum-50">
      <ArrowLeft className="h-3 w-3" />
    </span>
    {label}
  </motion.button>
);