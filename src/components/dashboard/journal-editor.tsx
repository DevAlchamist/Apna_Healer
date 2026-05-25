"use client";

import { easeCalm, hoverLiftTransition } from "@/components/ui/fade-in";
import { JournalStreakCelebration } from "@/components/dashboard/journal-streak-celebration";
import { apiFetch } from "@/lib/api-client";
import type {
  ApiJournalCompleteResponse,
  ApiJournalEntry,
  ApiJournalTodayPayload,
} from "@/types/api";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";

const AUTOSAVE_MS = 30_000;

type JournalEditorProps = {
  journalDateKey?: string;
  userName?: string | null;
  initialEntry?: ApiJournalEntry | null;
  initialStreak?: ApiJournalTodayPayload["streak"];
};

export function JournalEditor({
  journalDateKey,
  userName,
  initialEntry,
  initialStreak,
}: JournalEditorProps) {
  const [entryTitle, setEntryTitle] = useState(initialEntry?.title ?? "");
  const [entryHtml, setEntryHtml] = useState(initialEntry?.contentHtml ?? "");
  const [lastSavedAt, setLastSavedAt] = useState<Date>(
    initialEntry ? new Date(initialEntry.updatedAt) : new Date(),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<ApiJournalCompleteResponse | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const payloadRef = useRef({ title: "", contentHtml: "", journalDateKey: undefined as string | undefined });

  const formattedDate = useMemo(() => {
    const key = journalDateKey ?? initialEntry?.journalDateKey;
    if (key) {
      const d = new Date(`${key}T12:00:00.000Z`);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });
    }
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [journalDateKey, initialEntry?.journalDateKey]);

  const displayName = userName?.split(" ")[0] ?? "friend";

  useEffect(() => {
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), AUTOSAVE_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hydratedRef.current || !initialEntry) return;
    hydratedRef.current = true;
    setEntryTitle(initialEntry.title ?? "");
    setEntryHtml(initialEntry.contentHtml);
    if (editorRef.current) {
      editorRef.current.innerHTML = initialEntry.contentHtml;
    }
  }, [initialEntry]);

  const autoSaveLabel = useMemo(() => {
    if (isSaving) return "Auto-saving...";
    if (isDirty) return "Unsaved changes";
    if (nowMs === null) return "Auto-save ready";
    const seconds = Math.max(0, Math.floor((nowMs - lastSavedAt.getTime()) / 1000));
    if (seconds < 30) return "Auto-saved just now";
    if (seconds < 60) return "Auto-saved less than a minute ago";
    const mins = Math.floor(seconds / 60);
    return `Auto-saved ${mins}m ago`;
  }, [isDirty, isSaving, lastSavedAt, nowMs]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    payloadRef.current = {
      title: entryTitle,
      contentHtml: entryHtml,
      journalDateKey,
    };
  }, [entryTitle, entryHtml, journalDateKey]);

  const runAutosave = useCallback(async () => {
    if (!isDirtyRef.current) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiFetch<ApiJournalEntry>("/api/journal/today", {
        method: "PATCH",
        body: JSON.stringify(payloadRef.current),
      });
      setLastSavedAt(new Date());
      setNowMs(Date.now());
      setIsDirty(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Auto-save failed");
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void runAutosave();
    }, AUTOSAVE_MS);
    return () => window.clearInterval(timer);
  }, [runAutosave]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && isDirty) {
        void runAutosave();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isDirty, runAutosave]);

  const runEditorCommand = (command: "bold" | "italic" | "insertUnorderedList") => {
    editorRef.current?.focus();
    document.execCommand(command);
    setEntryHtml(editorRef.current?.innerHTML ?? "");
    setIsDirty(true);
  };

  const insertAtCursor = (value: string) => {
    editorRef.current?.focus();
    document.execCommand("insertText", false, value);
    setEntryHtml(editorRef.current?.innerHTML ?? "");
    setIsDirty(true);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 72,
      origin: { y: 0.65 },
      colors: ["#7faf9a", "#2f5d50", "#e8e5de", "#f4f4f2"],
    });
  };

  const saveEntryNow = async () => {
    const plain = entryHtml.replace(/<[^>]+>/g, "").trim();
    if (!plain) {
      setSaveError("Write something before saving your entry.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await apiFetch<ApiJournalCompleteResponse>("/api/journal/today/complete", {
        method: "POST",
        body: JSON.stringify(payloadRef.current),
      });
      setLastSavedAt(new Date());
      setNowMs(Date.now());
      setIsDirty(false);
      if (result.isNewCompletion) {
        setCelebration(result);
        fireConfetti();
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setIsSaving(false);
    }
  };

  if (celebration) {
    return (
      <JournalStreakCelebration
        streak={celebration.streak}
        onDismiss={() => setCelebration(null)}
      />
    );
  }

  return (
    <div className="rounded-calm border border-[#ebe5de] bg-white p-6 shadow-soft transition-[border-color,box-shadow,border-radius] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-[#dfd5c8] hover:shadow-soft-hover md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-[#ece5dc] pb-4 md:pb-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold text-text-primary/75">
          <motion.button
            type="button"
            onClick={() => runEditorCommand("bold")}
            title="Bold"
            className="rounded-soft px-3 py-2 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent/70 hover:text-text-secondary"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={hoverLiftTransition}
          >
            B
          </motion.button>
          <motion.button
            type="button"
            className="rounded-soft px-3 py-2 italic transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent/70 hover:text-text-secondary"
            onClick={() => runEditorCommand("italic")}
            title="Italic"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={hoverLiftTransition}
          >
            I
          </motion.button>
          <motion.button
            type="button"
            className="rounded-soft px-3 py-2 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-accent/70 hover:text-text-secondary"
            onClick={() => runEditorCommand("insertUnorderedList")}
            title="Bullet list"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={hoverLiftTransition}
          >
            • List
          </motion.button>
          <motion.button
            type="button"
            className="rounded-soft px-3 py-2 text-text-secondary transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-primary/15 hover:text-text-secondary"
            onClick={() => insertAtCursor("/ ")}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={hoverLiftTransition}
          >
            / Set Intent
          </motion.button>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {initialStreak && !initialStreak.todayCompleted ? (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Complete today to grow your streak
            </span>
          ) : null}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-primary/45 transition-opacity duration-300 hover:opacity-80">
            {autoSaveLabel}
          </span>
          <motion.button
            type="button"
            disabled={isSaving}
            className="rounded-full bg-text-secondary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)] disabled:opacity-60"
            onClick={() => void saveEntryNow()}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={hoverLiftTransition}
          >
            {isSaving ? "Saving…" : "Save Entry"}
          </motion.button>
        </div>
      </div>

      {saveError ? (
        <p className="mt-4 text-sm font-medium text-[#cf4f45]">{saveError}</p>
      ) : null}

      <motion.div
        className="mt-6 min-h-[470px] rounded-gentle bg-[radial-gradient(circle,#f2efe9_1px,transparent_1px)] bg-size-[14px_14px] p-6 transition-[border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] focus-within:rounded-[22px] focus-within:shadow-[inset_0_0_0_1px_rgb(127_175_154/22%),0_0_0_4px_rgb(127_175_154/12%)] sm:p-8 md:p-10"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: easeCalm }}
      >
        <p className="text-sm font-semibold text-text-secondary">{formattedDate}</p>
        <p className="mt-1 text-sm text-text-primary/50">
          Writing as {displayName}
        </p>
        <input
          type="text"
          value={entryTitle}
          onChange={(event) => {
            setEntryTitle(event.target.value);
            setIsDirty(true);
          }}
          placeholder="Give this moment a name..."
          className="mt-5 w-full bg-transparent font-display text-5xl font-semibold text-text-primary/80 placeholder:text-text-primary/25 focus:outline-none"
        />
        <div className="relative mt-6 min-h-[280px]">
          {entryHtml.trim() === "" ? (
            <p className="pointer-events-none absolute left-0 top-0 text-2xl text-text-primary/20 transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
              Start writing from the heart...
            </p>
          ) : null}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              setEntryHtml(event.currentTarget.innerHTML);
              setIsDirty(true);
            }}
            className="min-h-[280px] whitespace-pre-wrap bg-transparent text-xl leading-relaxed text-text-primary/85 outline-none transition-[color,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none"
          />
        </div>
      </motion.div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-x-8 gap-y-2 pt-1 text-xs text-text-primary/60 md:mt-8">
        <span className="transition-colors duration-300 hover:text-text-primary/80">
          Auto-saves every 30 seconds
        </span>
        <span className="transition-colors duration-300 hover:text-text-primary/80">
          Private for your eyes only
        </span>
      </div>
    </div>
  );
}
