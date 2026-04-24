"use client";

import { easeCalm, hoverLiftTransition } from "@/components/ui/fade-in";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

export function JournalEditor() {
  const [entryTitle, setEntryTitle] = useState("");
  const [entryHtml, setEntryHtml] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date>(new Date());
  const [isDirty, setIsDirty] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const editorRef = useRef<HTMLDivElement>(null);

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const autoSaveLabel = useMemo(() => {
    if (isDirty) return "Auto-saving...";
    const seconds = Math.max(0, Math.floor((nowMs - lastSavedAt.getTime()) / 1000));
    if (seconds < 10) return "Auto-saved just now";
    if (seconds < 60) return `Auto-saved ${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    return `Auto-saved ${mins}m ago`;
  }, [isDirty, lastSavedAt, nowMs]);

  useEffect(() => {
    if (!isDirty) return;
    const timer = window.setTimeout(() => {
      setLastSavedAt(new Date());
      setIsDirty(false);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [entryTitle, entryHtml, isDirty]);

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

  const saveEntryNow = () => {
    setLastSavedAt(new Date());
    setIsDirty(false);
  };

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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-primary/45 transition-opacity duration-300 hover:opacity-80">
            {autoSaveLabel}
          </span>
          <motion.button
            type="button"
            className="rounded-full bg-text-secondary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_10px_28px_-8px_rgb(47_93_80/45%)]"
            onClick={saveEntryNow}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={hoverLiftTransition}
          >
            Save Entry
          </motion.button>
        </div>
      </div>

      <motion.div
        className="mt-6 min-h-[470px] rounded-gentle bg-[radial-gradient(circle,#f2efe9_1px,transparent_1px)] bg-size-[14px_14px] p-6 transition-[border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] focus-within:rounded-[22px] focus-within:shadow-[inset_0_0_0_1px_rgb(127_175_154/22%),0_0_0_4px_rgb(127_175_154/12%)] sm:p-8 md:p-10"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: easeCalm }}
      >
        <p className="text-sm font-semibold text-text-secondary">{formattedDate}</p>
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
        <span className="transition-colors duration-300 hover:text-text-primary/80">End-to-end encrypted</span>
        <span className="transition-colors duration-300 hover:text-text-primary/80">Private for your eyes only</span>
      </div>
    </div>
  );
}
