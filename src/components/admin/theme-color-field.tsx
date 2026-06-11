"use client";

import type { RoleThemeTokenKey } from "@/lib/theme/types";

type ThemeColorFieldProps = {
  tokenKey: RoleThemeTokenKey;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ThemeColorField({ label, value, onChange }: ThemeColorFieldProps) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-muted">
        {label}
      </span>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={value.length === 7 ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-theme-muted bg-white p-0.5"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="flex-1 rounded-xl border border-theme-muted bg-theme-surface-muted px-3 py-2 text-sm text-theme-heading outline-none focus:border-theme-focus focus:ring-2 focus:ring-theme-focus"
        />
      </div>
    </label>
  );
}
