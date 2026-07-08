"use client";

import { useQuery } from "@tanstack/react-query";
import { TransactionListSkeleton, WalletBalanceSkeleton } from "@/components/skeletons";
import { FadeIn } from "@/components/ui/fade-in";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/display";
import type { ApiTransaction, ApiWallet } from "@/types/api";

function TxIcon({ type }: { type: ApiTransaction["type"] }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

function getTransactionLabel(transaction: ApiTransaction) {
  if (transaction.type === "PAYOUT") {
    return {
      title: "Direct Payout",
      tag: transaction.purpose.replaceAll("_", " "),
      amountClass: "text-text-secondary",
      sign: "+",
    };
  }

  if (transaction.type === "SESSION_PAYMENT") {
    return {
      title: "Consultation Credit",
      tag: transaction.purpose.replaceAll("_", " "),
      amountClass: "text-text-secondary",
      sign: "+",
    };
  }

  return {
    title: "Adjustment Credit",
    tag: transaction.purpose.replaceAll("_", " "),
    amountClass: "text-text-secondary",
    sign: "+",
  };
}

export default function EarningsPage() {
  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<ApiWallet>("/api/wallet"),
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiFetch<ApiTransaction[]>("/api/transactions?take=20"),
  });

  const wallet = walletQuery.data;
  const transactions = (transactionsQuery.data ?? []).filter(
    (tx) => tx.type === "PAYOUT" || tx.type === "SESSION_PAYMENT"
  );

  const queryError = walletQuery.error?.message ?? transactionsQuery.error?.message;

  return (
    <FadeIn className="space-y-12 pb-10 md:space-y-14 md:pb-12">
      <section className="space-y-4 md:space-y-5">
        <h1 className="font-display text-4xl font-semibold text-text-primary sm:text-5xl">
          Earnings & Payouts
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-text-primary/70 md:text-lg">
          Track your professional revenue, scheduled payout credits, and transaction history.
        </p>
      </section>

      {queryError ? (
        <p className="rounded-calm bg-white px-4 py-3 text-sm font-medium text-theme-status-error shadow-soft">
          {queryError}
        </p>
      ) : null}

      <section className="rounded-calm border border-accent/80 bg-white p-6 shadow-soft md:p-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-primary/45">
            Earnings Balance
          </p>
          {walletQuery.isLoading ? (
            <div className="mt-3 flex justify-center">
              <WalletBalanceSkeleton />
            </div>
          ) : (
            <h2 className="mt-2 font-display text-5xl font-semibold text-[#0d2f2a] sm:text-6xl">
              {formatCurrency(wallet?.availableBalance)}
            </h2>
          )}

          <div className="mt-8 grid gap-3 text-left md:grid-cols-2">
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
                Total Payouts
              </p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">
                {formatCurrency(wallet?.totalReceived)}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-text-primary">
              Payout History
            </h2>
            <p className="mt-1 text-sm text-text-primary/60">
              View direct bank payouts and consultation session credits.
            </p>
          </div>
          <div className="rounded-gentle border border-accent/80 bg-white px-4 py-2 text-sm font-semibold text-text-primary/65">
            {transactions.length} payouts listed
          </div>
        </div>

        {transactionsQuery.isLoading && !transactions.length ? (
          <TransactionListSkeleton count={4} />
        ) : transactions.length > 0 ? (
          <div className="grid gap-3">
            {transactions.map((transaction) => {
              const label = getTransactionLabel(transaction);

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-calm border border-accent/75 bg-white p-4 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdf6f0] text-text-secondary">
                      <TxIcon type={transaction.type} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {label.title}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-primary/40">
                        {label.tag}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-semibold ${label.amountClass}`}>
                      {label.sign} {formatCurrency(transaction.amount)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-primary/40">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-calm border border-accent/70 bg-white px-4 py-3 text-sm text-text-primary/55 shadow-soft">
            No payouts have been processed yet.
          </p>
        )}
      </section>
    </FadeIn>
  );
}
