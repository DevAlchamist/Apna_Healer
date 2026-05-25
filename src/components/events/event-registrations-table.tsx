"use client";

import type { ApiEventRegistrationRow } from "@/types/api";
import { formatCurrency } from "@/lib/display";

type EventRegistrationsTableProps = {
  rows: ApiEventRegistrationRow[];
  onCancel?: (userId: string) => void;
  cancellingUserId?: string | null;
};

export function EventRegistrationsTable({
  rows,
  onCancel,
  cancellingUserId,
}: EventRegistrationsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-gentle border border-dashed border-accent px-6 py-10 text-center text-sm text-text-primary/60">
        No registrations yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-calm border border-accent/70 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-accent/70 bg-accent/20 text-xs uppercase tracking-wide text-text-primary/55">
          <tr>
            <th className="px-4 py-3 font-semibold">Guest</th>
            <th className="px-4 py-3 font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Method</th>
            <th className="px-4 py-3 font-semibold">Member</th>
            <th className="px-4 py-3 font-semibold">Registered</th>
            {onCancel ? <th className="px-4 py-3 font-semibold" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-accent/40 last:border-0">
              <td className="px-4 py-3">
                <p className="font-semibold text-text-primary">
                  {row.user?.name ?? row.user?.email ?? row.userId}
                </p>
                {row.user?.email ? (
                  <p className="text-xs text-text-primary/55">{row.user.email}</p>
                ) : null}
              </td>
              <td className="px-4 py-3">{formatCurrency(row.amountCharged)}</td>
              <td className="px-4 py-3">{row.paymentMethod ?? "—"}</td>
              <td className="px-4 py-3">{row.isClubMemberAtBooking ? "Yes" : "No"}</td>
              <td className="px-4 py-3 text-text-primary/65">
                {new Date(row.createdAt).toLocaleString()}
              </td>
              {onCancel ? (
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={cancellingUserId === row.userId}
                    onClick={() => onCancel(row.userId)}
                    className="rounded-full border border-accent px-3 py-1 text-xs font-semibold text-text-primary/70 hover:bg-accent/40 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
