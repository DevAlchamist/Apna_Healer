"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TransactionListSkeleton, WalletBalanceSkeleton } from "@/components/skeletons";
import { FadeIn } from "@/components/ui/fade-in";
import { apiFetch, apiMutation } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/display";
import type { ApiTransaction, ApiWallet } from "@/types/api";

function TxIcon({ type }: { type: ApiTransaction["type"] }) {
  if (type === "CREDIT" || type === "PAYOUT") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M8 12h8" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "SESSION_PAYMENT") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="m12 4 6 11H6l6-11Z" />
      <path d="M12 10v6" strokeLinecap="round" />
    </svg>
  );
}

function getTransactionLabel(transaction: ApiTransaction) {
  if (transaction.type === "CREDIT") {
    return {
      title: "Wallet Top-up",
      tag: transaction.purpose.replaceAll("_", " "),
      amountClass: "text-text-secondary",
      sign: "+",
    };
  }

  if (transaction.type === "PAYOUT") {
    return {
      title: "Session Payout",
      tag: transaction.purpose.replaceAll("_", " "),
      amountClass: "text-text-secondary",
      sign: "+",
    };
  }

  if (transaction.type === "REFUND") {
    return {
      title: "Refund Issued",
      tag: transaction.purpose.replaceAll("_", " "),
      amountClass: "text-text-secondary",
      sign: "+",
    };
  }

  return {
    title: transaction.type === "DEBIT" ? "Wallet Withdrawal" : "Session Hold",
    tag: transaction.purpose.replaceAll("_", " "),
    amountClass: "text-[#d93025]",
    sign: "-",
  };
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const normalizedAmount = Number(amount);
  const isAmountValid = Number.isFinite(normalizedAmount) && normalizedAmount > 0;

  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<ApiWallet>("/api/wallet"),
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiFetch<ApiTransaction[]>("/api/transactions?take=20"),
  });

  const topUpMutation = useMutation({
    mutationFn: () =>
      apiMutation("/api/wallet/add-money", "POST", {
        amount: normalizedAmount,
      }),
    onSuccess: async () => {
      setAmount("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      apiMutation("/api/wallet/withdraw", "POST", {
        amount: normalizedAmount,
      }),
    onSuccess: async () => {
      setAmount("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
    },
  });

  const wallet = walletQuery.data;
  const transactions = transactionsQuery.data ?? wallet?.transactions ?? [];
  const mutationError = topUpMutation.error?.message ?? withdrawMutation.error?.message;

  return (
    <FadeIn className="space-y-10 pb-10 md:space-y-12 md:pb-12">
      <section className="rounded-calm bg-white p-8 shadow-soft md:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-primary/45">
            Current Available Balance
          </p>
          {walletQuery.isLoading ? (
            <WalletBalanceSkeleton />
          ) : (
            <p className="mt-3 font-display text-6xl font-semibold text-text-primary md:text-8xl">
              {formatCurrency(wallet?.availableBalance)}
            </p>
          )}

          {walletQuery.error ? (
            <p className="mt-4 text-sm font-medium text-theme-status-error">
              {walletQuery.error.message}
            </p>
          ) : null}

          <div className="mt-8 grid gap-3 text-left md:grid-cols-3">
            <article className="rounded-gentle bg-background px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                Held Balance
              </p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {formatCurrency(wallet?.heldBalance)}
              </p>
            </article>
            <article className="rounded-gentle bg-background px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                Total Spent
              </p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {formatCurrency(wallet?.totalSpent)}
              </p>
            </article>
            <article className="rounded-gentle bg-background px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/40">
                Total Received
              </p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {formatCurrency(wallet?.totalReceived)}
              </p>
            </article>
          </div>

          <div className="mx-auto mt-8 max-w-xl rounded-calm border border-accent/80 bg-background/80 p-4">
            <label className="block text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">
              Transaction Amount
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              className="mt-3 w-full rounded-gentle border border-accent/80 bg-white px-4 py-3 text-base text-text-primary outline-none transition-colors focus:border-primary/35"
            />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={!isAmountValid || topUpMutation.isPending || withdrawMutation.isPending}
                onClick={() => topUpMutation.mutate()}
                className="rounded-full bg-text-secondary px-8 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow,opacity] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover disabled:cursor-not-allowed disabled:opacity-55"
              >
                {topUpMutation.isPending ? "Adding..." : "Add Money"}
              </button>
              <button
                type="button"
                disabled={!isAmountValid || topUpMutation.isPending || withdrawMutation.isPending}
                onClick={() => withdrawMutation.mutate()}
                className="rounded-full border border-accent/80 bg-white px-8 py-3 text-sm font-semibold text-text-primary/75 transition-colors duration-300 hover:bg-accent/35 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
              </button>
            </div>

            {mutationError ? (
              <p className="mt-3 text-sm font-medium text-theme-status-error">{mutationError}</p>
            ) : (
              <p className="mt-3 text-sm text-text-primary/58">
                Manual wallet actions are enabled for the current internal flow.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl font-semibold text-text-primary">
              Activity History
            </h2>
            <p className="mt-1 text-sm text-text-primary/60">
              View your recent wallet and session ledger activity.
            </p>
          </div>
          <div className="rounded-gentle border border-accent/80 bg-white px-4 py-2 text-sm font-semibold text-text-primary/65">
            {transactions.length} recent entries
          </div>
        </div>

        {transactionsQuery.isLoading && !transactions.length ? (
          <TransactionListSkeleton count={4} />
        ) : null}

        {transactionsQuery.error ? (
          <div className="rounded-calm bg-white px-6 py-8 text-sm text-theme-status-error shadow-soft">
            {transactionsQuery.error.message}
          </div>
        ) : null}

        {!transactionsQuery.isLoading && transactions.length === 0 ? (
          <div className="rounded-calm bg-white px-6 py-8 text-sm text-text-primary/60 shadow-soft">
            No transactions yet. Your wallet activity will appear here once you top up or book a
            session.
          </div>
        ) : null}

        <div className="space-y-3">
          {transactions.map((transaction) => {
            const presentation = getTransactionLabel(transaction);

            return (
              <article
                key={transaction.id}
                className="flex items-center justify-between gap-4 rounded-calm bg-white px-4 py-4 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover md:px-6"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-gentle bg-primary/15 text-text-secondary">
                    <TxIcon type={transaction.type} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold text-text-primary">
                      {presentation.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                      <span className="mr-2 rounded bg-primary/15 px-2 py-0.5 text-text-secondary">
                        {presentation.tag}
                      </span>
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-display text-3xl font-semibold ${presentation.amountClass}`}>
                    {presentation.sign}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    {transaction.status}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </FadeIn>
  );
}
