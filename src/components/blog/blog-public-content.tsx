"use client";

import Image from "next/image";
import type { ApiBlogBlock } from "@/types/api";

type BlogPublicContentProps = {
  blocks: ApiBlogBlock[];
  editable?: boolean;
  onBlockChange?: (index: number, data: Record<string, unknown>) => void;
};

function ParagraphEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className="prose prose-lg max-w-none text-text-primary/85 focus:outline-none"
      dangerouslySetInnerHTML={{ __html: html }}
      onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
    />
  );
}

export function BlogPublicContent({ blocks, editable = false, onBlockChange }: BlogPublicContentProps) {
  return (
    <div className="space-y-10">
      {blocks.map((block, index) => {
        const data = block.data;
        const update = (patch: Record<string, unknown>) =>
          onBlockChange?.(index, { ...data, ...patch });

        switch (block.type) {
          case "HEADING": {
            const level = Number(data.level ?? 2);
            const text = String(data.text ?? "");
            const sizes = {
              1: "text-4xl md:text-5xl",
              2: "text-3xl md:text-4xl",
              3: "text-2xl md:text-3xl",
              4: "text-xl md:text-2xl",
            } as const;
            const className = `font-display font-semibold tracking-[-0.02em] text-[#1f2d2a] ${sizes[Math.min(4, Math.max(1, level)) as 1 | 2 | 3 | 4] ?? sizes[2]}`;
            const content = editable ? (
              <input
                value={text}
                onChange={(e) => update({ text: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
            ) : (
              text
            );
            if (level === 1) return <h1 key={block.id} id={`heading-${block.id}`} className={className}>{content}</h1>;
            if (level === 3) return <h3 key={block.id} id={`heading-${block.id}`} className={className}>{content}</h3>;
            if (level === 4) return <h4 key={block.id} id={`heading-${block.id}`} className={className}>{content}</h4>;
            return <h2 key={block.id} id={`heading-${block.id}`} className={className}>{content}</h2>;
          }
          case "PARAGRAPH":
            return editable ? (
              <ParagraphEditor
                key={block.id}
                html={String(data.html ?? "")}
                onChange={(html) => update({ html })}
              />
            ) : (
              <div
                key={block.id}
                className="text-[17px] leading-8 text-[#4a5553] [&_a]:text-[#2f745f] [&_a]:underline [&_b]:font-semibold [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: String(data.html ?? "") }}
              />
            );
          case "LIST": {
            const items = Array.isArray(data.items) ? data.items.map(String) : [];
            const ListTag = data.ordered ? "ol" : "ul";
            return (
              <ListTag
                key={block.id}
                className={`ml-6 space-y-3 text-[17px] leading-8 text-[#4a5553] ${data.ordered ? "list-decimal" : "list-disc"}`}
              >
                {items.map((item, i) => (
                  <li key={i}>
                    {editable ? (
                      <input
                        value={item}
                        onChange={(e) => {
                          const next = [...items];
                          next[i] = e.target.value;
                          update({ items: next });
                        }}
                        className="w-full bg-transparent focus:outline-none"
                      />
                    ) : (
                      item
                    )}
                  </li>
                ))}
              </ListTag>
            );
          }
          case "QUOTE":
            return (
              <blockquote
                key={block.id}
                className="border-l-2 border-[#d8d4cc] pl-6 italic"
              >
                {editable ? (
                  <textarea
                    value={String(data.text ?? "")}
                    onChange={(e) => update({ text: e.target.value })}
                    className="w-full bg-transparent text-xl leading-9 text-[#4a5553] focus:outline-none md:text-2xl"
                    rows={3}
                  />
                ) : (
                  <p className="text-xl leading-9 text-[#4a5553] md:text-2xl">
                    &ldquo;{String(data.text ?? "")}&rdquo;
                  </p>
                )}
                {(data.attribution || editable) && (
                  <footer className="mt-4 text-sm not-italic text-[#8a9492]">
                    {editable ? (
                      <input
                        value={String(data.attribution ?? "")}
                        onChange={(e) => update({ attribution: e.target.value })}
                        placeholder="Attribution"
                        className="w-full bg-transparent focus:outline-none"
                      />
                    ) : (
                      `— ${String(data.attribution)}`
                    )}
                  </footer>
                )}
              </blockquote>
            );
          case "CODE":
            return (
              <pre
                key={block.id}
                className="overflow-x-auto rounded-gentle bg-[#1e2a24] p-5 text-sm text-[#e8f0eb]"
              >
                <code>{String(data.code ?? "")}</code>
              </pre>
            );
          case "DIVIDER":
            return <hr key={block.id} className="border-[#ded7ce]" />;
          case "HIGHLIGHT":
            return (
              <div
                key={block.id}
                className="rounded-2xl bg-[#f0efec] px-6 py-5 md:px-7 md:py-6"
              >
                <p className="text-sm font-semibold text-[#1f2d2a]">A Gentle Exercise</p>
                <p className="mt-3 text-[16px] leading-7 text-[#4a5553]">{String(data.text ?? "")}</p>
              </div>
            );
          case "IMAGE": {
            const url = String(data.url ?? "");
            if (!url && !editable) return null;
            return (
              <figure key={block.id} className="space-y-3">
                {url ? (
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[28px]">
                    <Image src={url} alt={String(data.alt ?? "")} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-calm border-2 border-dashed border-[#d4dbd6] text-sm text-text-primary/45">
                    Add image URL
                  </div>
                )}
                {editable && (
                  <input
                    value={url}
                    onChange={(e) => update({ url: e.target.value })}
                    placeholder="Image URL"
                    className="w-full rounded-gentle border border-[#ded7ce] px-3 py-2 text-sm"
                  />
                )}
                {(data.caption || editable) && (
                  <figcaption className="text-center text-sm text-text-primary/55">
                    {editable ? (
                      <input
                        value={String(data.caption ?? "")}
                        onChange={(e) => update({ caption: e.target.value })}
                        placeholder="Caption"
                        className="w-full bg-transparent text-center focus:outline-none"
                      />
                    ) : (
                      String(data.caption)
                    )}
                  </figcaption>
                )}
              </figure>
            );
          }
          case "IMAGE_GALLERY": {
            const images = Array.isArray(data.images)
              ? (data.images as { url: string; alt?: string }[])
              : [];
            const cols = data.columns === 3 ? 3 : 2;
            return (
              <div
                key={block.id}
                className={`grid gap-4 ${cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
              >
                {images.map((img, i) =>
                  img.url ? (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-gentle">
                      <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" />
                    </div>
                  ) : null,
                )}
              </div>
            );
          }
          case "VIDEO_EMBED": {
            const provider = String(data.provider ?? "youtube");
            const videoId = String(data.videoId ?? "");
            if (!videoId) return null;
            const src =
              provider === "vimeo"
                ? `https://player.vimeo.com/video/${videoId}`
                : `https://www.youtube.com/embed/${videoId}`;
            return (
              <figure key={block.id} className="space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-calm">
                  <iframe src={src} title="Embedded video" className="h-full w-full" allowFullScreen />
                </div>
                {Boolean(data.caption) && (
                  <figcaption className="text-center text-sm text-text-primary/55">
                    {String(data.caption)}
                  </figcaption>
                )}
              </figure>
            );
          }
          case "BANNER":
            return (
              <div
                key={block.id}
                className={`rounded-2xl px-6 py-5 md:px-7 md:py-6 ${
                  data.tone === "accent"
                    ? "bg-[#2f745f] text-white"
                    : "bg-[#f0efec] text-[#1f2d2a]"
                }`}
              >
                <h3 className="font-display text-xl font-semibold md:text-2xl">{String(data.title ?? "")}</h3>
                {data.subtitle ? (
                  <p className="mt-3 text-[16px] leading-7 opacity-85">{String(data.subtitle)}</p>
                ) : null}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
