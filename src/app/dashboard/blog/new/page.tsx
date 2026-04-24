"use client";

import { FadeIn, hoverLiftTransition } from "@/components/ui/fade-in";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

const defaultTags = ["Mindfulness", "Healing"] as const;

export default function NewStoryPage() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");

  const runCommand = (command: "bold" | "italic" | "insertUnorderedList" | "insertHorizontalRule") => {
    editorRef.current?.focus();
    document.execCommand(command);
    setContentHtml(editorRef.current?.innerHTML ?? "");
  };

  const addLink = () => {
    const url = window.prompt("Paste a link URL");
    if (!url) return;
    editorRef.current?.focus();
    document.execCommand("createLink", false, url);
    setContentHtml(editorRef.current?.innerHTML ?? "");
  };

  return (
    <FadeIn className="space-y-8 pb-10 md:space-y-10 md:pb-12">
      <section className="rounded-calm bg-white p-5 shadow-soft md:p-7">
        <button
          type="button"
          className="group relative flex h-48 w-full items-center justify-center rounded-gentle bg-[#eef1ef] text-text-secondary/70 md:h-56"
        >
          <div className="pointer-events-none absolute inset-0 rounded-gentle border-2 border-dashed border-[#d4dbd6]" />
          <span className="text-center">
            <span className="block text-base font-semibold">Add a cover image</span>
            <span className="mt-1 block text-xs text-text-primary/45">1600 × 900px recommended</span>
          </span>
        </button>
      </section>

      <section className="space-y-5">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title your reflection..."
          className="w-full bg-transparent font-display text-6xl font-semibold text-text-primary/75 placeholder:text-text-primary/25 focus:outline-none md:text-7xl"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          {defaultTags.map((tag) => (
            <span key={tag} className="rounded-full bg-[#ece9e2] px-3 py-1 text-xs font-semibold text-text-primary/70">
              {tag}
            </span>
          ))}
          <button
            type="button"
            className="rounded-full border border-dashed border-text-primary/30 px-3 py-1 text-xs font-semibold text-text-primary/50 transition-colors hover:bg-accent/40"
          >
            + Add tag
          </button>
        </div>

        <div className="flex justify-center pt-2">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-white p-2 shadow-soft">
            <motion.button
              type="button"
              onClick={() => runCommand("bold")}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-text-primary/70 transition-colors hover:bg-accent/45"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverLiftTransition}
            >
              B
            </motion.button>
            <motion.button
              type="button"
              onClick={() => runCommand("italic")}
              className="rounded-full px-3 py-1.5 text-sm italic text-text-primary/70 transition-colors hover:bg-accent/45"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverLiftTransition}
            >
              I
            </motion.button>
            <motion.button
              type="button"
              onClick={() => runCommand("insertUnorderedList")}
              className="rounded-full px-3 py-1.5 text-sm text-text-primary/70 transition-colors hover:bg-accent/45"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverLiftTransition}
            >
              • List
            </motion.button>
            <motion.button
              type="button"
              onClick={() => runCommand("insertHorizontalRule")}
              className="rounded-full px-3 py-1.5 text-sm text-text-primary/70 transition-colors hover:bg-accent/45"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverLiftTransition}
            >
              Quote
            </motion.button>
            <motion.button
              type="button"
              onClick={addLink}
              className="rounded-full px-3 py-1.5 text-sm text-text-primary/70 transition-colors hover:bg-accent/45"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverLiftTransition}
            >
              Link
            </motion.button>
          </div>
        </div>

        <div className="min-h-[360px] rounded-calm bg-white px-5 py-4 shadow-soft md:min-h-[460px] md:px-7 md:py-6">
          {contentHtml.trim() === "" ? (
            <p className="pointer-events-none text-2xl text-text-primary/25 md:text-3xl">
              Start writing here... Let your thoughts flow without judgment.
            </p>
          ) : null}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => setContentHtml(event.currentTarget.innerHTML)}
            className="min-h-[320px] whitespace-pre-wrap bg-transparent text-xl leading-relaxed text-text-primary/85 outline-none md:min-h-[420px] md:text-2xl"
          />
        </div>
      </section>
    </FadeIn>
  );
}
