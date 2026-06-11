"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { ApiProvider } from "@/types/api";

const FALLBACK_LISTENERS = [
  "Elena",
  "Marcus",
  "Sarah",
  "David",
  "Ava",
  "Noah",
  "Zara",
  "Ibrahim",
] as const;

const AVATAR_SIZE = 64;
const HOVER_SCALE = 1.14;

export type ListenerMarqueeItem = {
  id: string;
  displayName: string;
  fullName: string;
  image: string | null;
};

function buildListenerItems(listeners: ApiProvider[] | undefined): ListenerMarqueeItem[] {
  if (listeners?.length) {
    return listeners.map((l) => ({
      id: l.id,
      displayName: l.name?.split(/\s+/)[0] ?? "Listener",
      fullName: l.name ?? "Listener",
      image: l.image,
    }));
  }
  return FALLBACK_LISTENERS.map((name, i) => ({
    id: `fallback-${i}`,
    displayName: name,
    fullName: name,
    image: null,
  }));
}

type ListenersOnlineMarqueeProps = {
  listeners?: ApiProvider[];
};

export function ListenersOnlineMarquee({ listeners }: ListenersOnlineMarqueeProps) {
  const [sectionHovered, setSectionHovered] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const items = useMemo(() => buildListenerItems(listeners), [listeners]);
  const trackItems = useMemo(() => [...items, ...items], [items]);

  const scaledSize = AVATAR_SIZE * HOVER_SCALE;
  const horizontalPad = Math.ceil((scaledSize - AVATAR_SIZE) / 2) + 4;
  const topPad = 44;

  return (
    <div
      className="relative mt-10"
      onMouseEnter={() => setSectionHovered(true)}
      onMouseLeave={() => {
        setSectionHovered(false);
        setHoveredId(null);
      }}
    >
      {/* Only clip horizontal overflow; vertical space for tags + scale */}
      <div className="overflow-x-hidden">
        <div
          className={`listeners-marquee-track flex w-max items-end gap-6 ${sectionHovered ? "listeners-marquee-paused" : ""}`}
          style={{
            paddingTop: topPad,
            paddingBottom: Math.ceil((scaledSize - AVATAR_SIZE) / 2) + 8,
          }}
        >
          {trackItems.map((item, idx) => {
            const isHovered = hoveredId === `${item.id}-${idx}`;
            return (
              <div
                key={`${item.id}-${idx}`}
                className={`relative shrink-0 overflow-visible ${isHovered ? "z-40" : "z-0"}`}
                style={{
                  width: AVATAR_SIZE + horizontalPad * 2,
                  paddingLeft: horizontalPad,
                  paddingRight: horizontalPad,
                }}
                onMouseEnter={() => setHoveredId(`${item.id}-${idx}`)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {isHovered ? (
                  <motion.div
                    className="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap"
                    style={{ top: -20 }}
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="inline-block rounded-full bg-[#2f745f] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_-8px_rgba(47,116,95,0.55)]">
                      {item.fullName}
                    </span>
                    <span
                      className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#2f745f]"
                      aria-hidden
                    />
                  </motion.div>
                ) : null}

                <motion.div
                  className="relative mx-auto overflow-hidden rounded-full bg-[linear-gradient(150deg,#12171f,#555)] ring-2 ring-[#d9d9d9]"
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    transformOrigin: "center center",
                  }}
                  animate={{
                    scale: isHovered ? HOVER_SCALE : 1,
                    boxShadow: isHovered
                      ? "0 12px 28px -8px rgba(47, 116, 95, 0.45)"
                      : "0 0 0 0 rgba(0,0,0,0)",
                  }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/90">
                      {item.displayName.charAt(0)}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 z-10 h-3 w-3 rounded-full border-2 border-white bg-[#32d17a]" />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-[15] w-20 bg-linear-to-r from-[#f4f4f2] via-[#f4f4f2]/80 to-transparent backdrop-blur-[2px] md:w-28" />
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-[15] w-20 bg-linear-to-l from-[#f4f4f2] via-[#f4f4f2]/80 to-transparent backdrop-blur-[2px] md:w-28" />
    </div>
  );
}
