"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiMutation } from "@/lib/api-client";
import type { ApiClubDetail } from "@/types/api";

type ClubJoinModalProps = {
  club: ApiClubDetail;
  open: boolean;
  onClose: () => void;
};

export function ClubJoinModal({ club, open, onClose }: ClubJoinModalProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const joinMutation = useMutation({
    mutationFn: () =>
      apiMutation<{ id: string }>("/api/clubs/join-requests", "POST", {
        clubId: club.id,
        message,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["club", club.slug] });
      void queryClient.invalidateQueries({ queryKey: ["clubs"] });
      onClose();
      setMessage("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-calm bg-white p-6 shadow-soft">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          Join {club.title}
        </h2>
        <p className="mt-2 text-sm text-text-primary/60">
          Monthly fee: ₹{club.monthlyFee} (charged from your wallet upon approval).
        </p>
        <label className="mt-4 block text-sm font-medium text-text-primary/75">
          Why do you want to join?
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-gentle border border-accent/80 bg-background px-4 py-3 text-sm outline-none focus:border-primary/40"
            placeholder="Share what draws you to this circle..."
          />
        </label>
        {error ? <p className="mt-2 text-sm text-[#cf4f45]">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-accent px-5 py-2 text-sm font-semibold text-text-primary/70"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={message.trim().length < 10 || joinMutation.isPending}
            onClick={() => joinMutation.mutate()}
            className="rounded-full bg-text-secondary px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {joinMutation.isPending ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
