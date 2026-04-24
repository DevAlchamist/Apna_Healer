"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-soft hover:-translate-y-0.5 hover:shadow-soft-hover",
  secondary:
    "bg-accent text-text-primary border border-[#d8c9ba] hover:-translate-y-0.5 hover:shadow-soft",
};

export function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-soft px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-(--ease-calm) ${variantStyles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
