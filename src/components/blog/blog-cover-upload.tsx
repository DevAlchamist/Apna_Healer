"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ApiBlogUploadResponse } from "@/types/api";

type BlogCoverUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function BlogCoverUpload({ value, onChange }: BlogCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiFetch<ApiBlogUploadResponse>("/api/uploads/blog", {
        method: "POST",
        body: formData,
      });
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-48 w-full items-center justify-center overflow-hidden rounded-gentle bg-[#eef1ef] text-text-secondary/70 md:h-56"
      >
        {value ? (
          <Image src={value} alt="Cover" fill className="object-cover" />
        ) : (
          <>
            <div className="pointer-events-none absolute inset-0 rounded-gentle border-2 border-dashed border-[#d4dbd6]" />
            <span className="text-center">
              <span className="block text-base font-semibold">
                {uploading ? "Uploading..." : "Add a cover image"}
              </span>
              <span className="mt-1 block text-xs text-text-primary/45">1600 × 900px recommended</span>
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-semibold text-text-primary/50 hover:text-text-secondary"
        >
          Remove cover
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
