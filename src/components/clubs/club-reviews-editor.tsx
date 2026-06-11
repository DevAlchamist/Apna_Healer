"use client";

export type ClubReviewDraft = {
  id: string;
  authorLabel: string;
  quote: string;
  memberSince?: string;
};

export function createReviewDraft(
  partial?: Partial<Pick<ClubReviewDraft, "authorLabel" | "quote" | "memberSince">>,
): ClubReviewDraft {
  return {
    id: crypto.randomUUID(),
    authorLabel: partial?.authorLabel ?? "",
    quote: partial?.quote ?? "",
    memberSince: partial?.memberSince ?? "",
  };
}

export function reviewsToPayload(reviews: ClubReviewDraft[]) {
  return reviews
    .map((r, index) => ({
      authorLabel: r.authorLabel.trim(),
      quote: r.quote.trim(),
      memberSince: r.memberSince?.trim() || null,
      sortOrder: index,
    }))
    .filter((r) => r.authorLabel.length > 0 && r.quote.length > 0);
}

type ClubReviewsEditorProps = {
  reviews: ClubReviewDraft[];
  onChange: (reviews: ClubReviewDraft[]) => void;
  labelClassName?: string;
  inputClassName?: string;
};

export function ClubReviewsEditor({
  reviews,
  onChange,
  labelClassName = "text-sm font-semibold text-text-primary/75",
  inputClassName = "mt-2 w-full rounded-gentle border border-accent/80 bg-background px-4 py-2.5 text-sm outline-none focus:border-primary/40",
}: ClubReviewsEditorProps) {
  const update = (id: string, patch: Partial<ClubReviewDraft>) => {
    onChange(reviews.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const remove = (id: string) => {
    onChange(reviews.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={labelClassName}>Voices from the Atrium</p>
          <p className="mt-1 text-xs leading-relaxed text-text-primary/55">
            Optional member quotes shown in the testimonials section on your public club page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...reviews, createReviewDraft()])}
          className="text-xs font-semibold text-theme-status-success hover:underline"
        >
          + Add quote
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-gentle border border-dashed border-accent/80 px-4 py-6 text-center text-xs text-text-primary/50">
          No testimonials yet — add quotes from members or leave empty to use defaults.
        </p>
      ) : (
        reviews.map((review, index) => (
          <div
            key={review.id}
            className="rounded-gentle border border-accent/70 bg-[#fbfaf7] p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#b1a89d]">
                Quote {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(review.id)}
                className="text-xs font-semibold text-theme-status-error hover:underline"
              >
                Remove
              </button>
            </div>
            <input
              value={review.authorLabel}
              onChange={(e) => update(review.id, { authorLabel: e.target.value })}
              placeholder="Author name or initials"
              className={inputClassName}
            />
            <input
              value={review.memberSince ?? ""}
              onChange={(e) => update(review.id, { memberSince: e.target.value })}
              placeholder="Member since (e.g. 2022)"
              className={`${inputClassName} mt-2`}
            />
            <textarea
              value={review.quote}
              onChange={(e) => update(review.id, { quote: e.target.value })}
              placeholder="What did they say about this circle?"
              rows={3}
              className={`${inputClassName} mt-2`}
            />
          </div>
        ))
      )}
    </div>
  );
}
