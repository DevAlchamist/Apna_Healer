import type { HTMLAttributes } from "react";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-lg bg-[#ece8e0]/90 ${className}`.trim()}
      {...rest}
    />
  );
}
