"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency } from "@/lib/display";
import type { ApiEventDetail, ApiWallet, BookingPaymentMethodValue } from "@/types/api";

type EventRegisterModalProps = {
  event: ApiEventDetail;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function EventRegisterModal({
  event,
  open,
  onClose,
  onSuccess,
}: EventRegisterModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<BookingPaymentMethodValue>("WALLET");
  const [externalReady, setExternalReady] = useState(false);
  const [note, setNote] = useState("");

  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<ApiWallet>("/api/wallet"),
    enabled: open && event.priceForMe > 0,
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      apiMutation(`/api/events/${event.slug}/register`, "POST", {
        paymentMethod: event.priceForMe > 0 ? paymentMethod : undefined,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  if (!open) return null;

  const amount = event.priceForMe;
  const walletBalance = Number(walletQuery.data?.availableBalance ?? 0);
  const canPayWallet = walletBalance >= amount;
  const needsPayment = amount > 0;
  const canSubmit =
    !registerMutation.isPending &&
    (!needsPayment ||
      (paymentMethod === "WALLET" && canPayWallet) ||
      (paymentMethod !== "WALLET" && externalReady));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-calm bg-white p-6 shadow-soft"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-text-primary">Register</h2>
            <p className="mt-1 text-sm text-text-primary/60">{event.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-primary/50 hover:text-text-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mt-4 text-sm text-text-primary/70">
          {needsPayment ? (
            <>
              Your price:{" "}
              <span className="font-semibold text-text-secondary">{formatCurrency(amount)}</span>
              {event.clubTitle ? (
                <span className="text-text-primary/55"> · {event.clubTitle}</span>
              ) : null}
            </>
          ) : (
            "This registration is free for you."
          )}
        </p>

        {needsPayment ? (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-primary/45">
              Payment method
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "WALLET" as const, label: "Wallet" },
                  { id: "QR" as const, label: "UPI / QR" },
                  { id: "CARD" as const, label: "Card" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(opt.id);
                    setExternalReady(opt.id !== "WALLET");
                  }}
                  className={`rounded-gentle border px-3 py-2 text-sm font-semibold ${
                    paymentMethod === opt.id
                      ? "border-text-secondary bg-text-secondary/10"
                      : "border-accent/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {paymentMethod === "WALLET" ? (
              <div className="rounded-gentle border border-accent/80 bg-background/80 px-4 py-3 text-sm">
                <p>
                  Balance:{" "}
                  <span className="font-semibold">{formatCurrency(walletBalance)}</span>
                </p>
                {!canPayWallet ? (
                  <p className="mt-2 text-theme-status-error">
                    Insufficient balance.{" "}
                    <Link href="/dashboard/wallet" className="font-semibold underline">
                      Top up wallet
                    </Link>
                  </p>
                ) : (
                  <p className="mt-2 text-text-primary/55">
                    {formatCurrency(amount)} will be charged immediately on registration.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-gentle border border-accent/80 bg-background/80 px-4 py-3 text-sm">
                <p>Confirm once external payment is complete (demo).</p>
                <button
                  type="button"
                  onClick={() => setExternalReady(true)}
                  className="mt-2 rounded-full bg-text-secondary px-4 py-2 text-xs font-semibold text-white"
                >
                  Confirm payment received
                </button>
              </div>
            )}
          </div>
        ) : null}

        <label className="mt-4 block text-sm">
          <span className="text-text-primary/60">Note (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-gentle border border-accent/80 px-3 py-2 text-sm"
          />
        </label>

        {registerMutation.isError ? (
          <p className="mt-3 text-sm text-theme-status-error">
            {(registerMutation.error as Error).message}
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-accent px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => registerMutation.mutate()}
            className="flex-1 rounded-full bg-text-secondary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {registerMutation.isPending ? "Registering…" : "Confirm registration"}
          </button>
        </div>
      </div>
    </div>
  );
}
