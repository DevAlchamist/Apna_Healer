import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <article
      className={`rounded-calm bg-white/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-300 ease-(--ease-calm) hover:shadow-soft-hover md:p-8 ${className}`}
    >
      {children}
    </article>
  );
}
