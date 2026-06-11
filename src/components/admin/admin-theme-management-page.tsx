"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Role } from "@prisma/client";
import { getDefaultThemeTokensForRole } from "@/config/theme-defaults";
import { ThemeColorField } from "@/components/admin/theme-color-field";
import { useRoleThemeContext } from "@/components/providers/role-theme-provider";
import { apiMutation } from "@/lib/api-client";
import { roleThemeTokensSchema } from "@/lib/theme/schema";
import { THEME_TOKEN_GROUPS, TOKEN_LABELS } from "@/lib/theme/token-groups";
import type { RoleThemeTokenKey, RoleThemeTokens } from "@/lib/theme/types";
import {
  invalidateRoleThemeQueries,
  useAdminRoleThemes,
} from "@/hooks/use-role-theme";
import type { ApiRoleTheme } from "@/types/api";

const ROLES: { role: Role; label: string }[] = [
  { role: "ADMIN", label: "Admin" },
  { role: "USER", label: "Member" },
  { role: "THERAPIST", label: "Healer" },
  { role: "LISTENER", label: "Listener" },
];

function ThemePreviewPanel({ tokens }: { tokens: RoleThemeTokens }) {
  return (
    <div
      className="rounded-[20px] border p-5"
      style={{
        backgroundColor: tokens.background,
        borderColor: tokens.border,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: tokens.textMuted }}>
        Live preview
      </p>
      <div
        className="mt-3 rounded-xl px-3 py-2 text-center text-[10px] font-semibold tracking-wide text-white"
        style={{ backgroundColor: tokens.bannerBg }}
      >
        Console banner
      </div>
      <div
        className="mt-3 rounded-xl p-4"
        style={{ backgroundColor: tokens.surface, border: `1px solid ${tokens.border}` }}
      >
        <h3 className="text-lg font-semibold" style={{ color: tokens.heading }}>
          Section heading
        </h3>
        <p className="mt-2 text-sm" style={{ color: tokens.textMuted }}>
          Body text uses muted color on surface cards.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: tokens.badgeSuccessBg, color: tokens.badgeSuccessText }}
          >
            Active
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: tokens.badgeWarningBg, color: tokens.badgeWarningText }}
          >
            Pending
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-full px-4 py-2 text-xs font-semibold"
            style={{
              backgroundColor: tokens.buttonPrimary,
              color: tokens.buttonPrimaryText,
            }}
          >
            Primary action
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-2 text-xs font-semibold"
            style={{
              backgroundColor: tokens.buttonSecondary,
              color: tokens.buttonSecondaryText,
            }}
          >
            Secondary
          </button>
        </div>
        <p className="mt-3 text-xs font-semibold" style={{ color: tokens.statusError }}>
          Error status sample
        </p>
      </div>
    </div>
  );
}

export function AdminThemeManagementPage() {
  const queryClient = useQueryClient();
  const themeContext = useRoleThemeContext();
  const themesQuery = useAdminRoleThemes();
  const [activeRole, setActiveRole] = useState<Role>("ADMIN");
  const [draft, setDraft] = useState<RoleThemeTokens | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const savedTheme = useMemo(
    () => themesQuery.data?.find((t) => t.role === activeRole),
    [themesQuery.data, activeRole],
  );

  const savedTokens = useMemo(
    () => (savedTheme?.tokens as RoleThemeTokens | undefined) ?? getDefaultThemeTokensForRole(activeRole),
    [savedTheme, activeRole],
  );

  useEffect(() => {
    setDraft(savedTokens);
    setConfirmReset(false);
    setError(null);
  }, [activeRole, savedTokens]);

  useEffect(() => {
    if (!draft) return;
    themeContext?.applyPreview(draft);
  }, [draft, themeContext]);

  const updateToken = useCallback((key: RoleThemeTokenKey, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("No theme draft");
      const parsed = roleThemeTokensSchema.parse(draft);
      return apiMutation<ApiRoleTheme>(`/api/admin/themes/${activeRole}`, "PUT", {
        tokens: parsed,
      });
    },
    onMutate: async () => {
      if (draft) themeContext?.applyPreview(draft);
    },
    onSuccess: (data) => {
      setError(null);
      invalidateRoleThemeQueries(queryClient, activeRole);
      if (data.tokens) {
        setDraft(data.tokens as RoleThemeTokens);
      }
      themeContext?.clearPreview();
    },
    onError: (err: Error) => {
      setError(err.message);
      themeContext?.clearPreview();
    },
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      apiMutation<ApiRoleTheme>(`/api/admin/themes/${activeRole}/reset`, "POST", {}),
    onSuccess: (data) => {
      setConfirmReset(false);
      setError(null);
      invalidateRoleThemeQueries(queryClient, activeRole);
      setDraft(data.tokens as RoleThemeTokens);
      themeContext?.clearPreview();
    },
    onError: (err: Error) => setError(err.message),
  });

  const isDirty = useMemo(() => {
    if (!draft) return false;
    return (Object.keys(draft) as RoleThemeTokenKey[]).some(
      (key) => draft[key] !== savedTokens[key],
    );
  }, [draft, savedTokens]);

  const handleDiscard = () => {
    setDraft(savedTokens);
    setError(null);
    themeContext?.clearPreview();
  };

  if (themesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-theme-surface-muted" />
        <div className="h-96 animate-pulse rounded-[20px] bg-theme-surface-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/settings"
          className="text-sm font-semibold text-theme-status-success hover:underline"
        >
          ← Settings
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-theme-heading">
          Theme Management
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-theme-muted">
          Configure colors for each role. Changes apply immediately across authenticated dashboard
          and admin screens (landing pages are not affected).
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {ROLES.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            onClick={() => setActiveRole(role)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeRole === role
                ? "bg-theme-button-primary text-theme-button-primary"
                : "bg-theme-button-secondary text-theme-button-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-theme-status-error">{error}</p>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6 rounded-[20px] border border-theme bg-theme-surface p-6 shadow-[0_8px_28px_-20px_rgba(0,0,0,0.12)]">
          {THEME_TOKEN_GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="text-sm font-semibold text-theme-heading">{group.title}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.keys.map((key) => (
                  <ThemeColorField
                    key={key}
                    tokenKey={key}
                    label={TOKEN_LABELS[key]}
                    value={draft?.[key] ?? ""}
                    onChange={(v) => updateToken(key, v)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="space-y-4">
          {draft ? <ThemePreviewPanel tokens={draft} /> : null}
          <div className="rounded-[20px] border border-theme bg-theme-surface-muted p-4 text-xs text-theme-muted">
            <p>
              Version: <span className="font-semibold">{savedTheme?.version ?? 1}</span>
            </p>
            <p className="mt-1">
              {savedTheme?.isCustomized ? "Custom theme" : "Factory defaults"}
            </p>
            {savedTheme?.updatedAt ? (
              <p className="mt-1">Last saved: {new Date(savedTheme.updatedAt).toLocaleString()}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-theme-muted pt-6">
        <button
          type="button"
          disabled={!isDirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="rounded-full bg-theme-button-primary px-6 py-2.5 text-sm font-semibold text-theme-button-primary hover:bg-theme-button-primary-hover disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          disabled={!isDirty || saveMutation.isPending}
          onClick={handleDiscard}
          className="rounded-full bg-theme-button-secondary px-6 py-2.5 text-sm font-semibold text-theme-button-secondary disabled:opacity-50"
        >
          Discard
        </button>
        {confirmReset ? (
          <>
            <button
              type="button"
              disabled={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
              className="rounded-full bg-theme-status-error px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {resetMutation.isPending ? "Resetting…" : "Confirm reset"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="text-sm font-semibold text-theme-muted hover:underline"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="rounded-full border border-theme px-6 py-2.5 text-sm font-semibold text-theme-heading"
          >
            Reset to defaults
          </button>
        )}
      </div>
    </div>
  );
}
