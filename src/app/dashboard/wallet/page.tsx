import { FadeIn } from "@/components/ui/fade-in";

const transactions = [
  {
    title: "Session with Dr. Aris",
    tag: "Mental Wellness",
    date: "24 Oct, 2:30 PM",
    amount: "- ₹800.00",
    amountClass: "text-[#d93025]",
  },
  {
    title: "Wallet Top-up",
    tag: "Razorpay",
    date: "22 Oct, 10:15 AM",
    amount: "+ ₹2,000.00",
    amountClass: "text-text-secondary",
  },
  {
    title: "Event: Forest Bathing",
    tag: "Group Activity",
    date: "18 Oct, 08:00 AM",
    amount: "- ₹45.00",
    amountClass: "text-[#d93025]",
  },
] as const;

function TxIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M8 12h8" strokeLinecap="round" />
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

export default function WalletPage() {
  return (
    <FadeIn className="space-y-10 pb-10 md:space-y-12 md:pb-12">
      <section className="rounded-calm bg-white p-8 shadow-soft md:p-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-primary/45">
            Current Available Balance
          </p>
          <p className="mt-3 font-display text-7xl font-semibold text-text-primary md:text-8xl">
            <span className="align-top text-4xl text-text-secondary/70 md:text-5xl">₹</span>1,250
            <span className="align-top text-3xl text-text-primary/40 md:text-4xl">.00</span>
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-text-secondary px-8 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover"
            >
              ⊕ Add Money
            </button>
            <button
              type="button"
              className="rounded-full border border-accent/80 bg-background px-8 py-3 text-sm font-semibold text-text-primary/75 transition-colors duration-300 hover:bg-accent/35"
            >
              Withdrawal
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl font-semibold text-text-primary">Activity History</h2>
            <p className="mt-1 text-sm text-text-primary/60">View your recent digital atrium transactions</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-gentle border border-accent/80 bg-white px-4 py-2 text-sm font-semibold text-text-primary/70 transition-colors hover:bg-accent/35"
          >
            Filters
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h10M4 12h16M4 17h12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {transactions.map((item, index) => (
            <article
              key={item.title}
              className="flex items-center justify-between gap-4 rounded-calm bg-white px-4 py-4 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft-hover md:px-6"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-gentle bg-primary/15 text-text-secondary">
                  <TxIcon index={index} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-text-primary">{item.title}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-primary/45">
                    <span className="mr-2 rounded bg-primary/15 px-2 py-0.5 text-text-secondary">{item.tag}</span>
                    {item.date}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-display text-4xl font-semibold ${item.amountClass}`}>{item.amount}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/45">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Settled
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
