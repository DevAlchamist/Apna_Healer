"use client";

import {
  applicationInputClass,
  applicationLabelClass,
  applicationSelectClass,
} from "@/components/dashboard/professional-apply/application-form-modal";

export type WeeklyWindow = {
  /** Stable key for React lists — preserved across edits. */
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone?: string;
};

let weeklyRowId = 0;
function nextWeeklyRowId() {
  weeklyRowId += 1;
  return `weekly-${weeklyRowId}`;
}

function rowKey(row: WeeklyWindow, index: number) {
  return row.id ?? `weekly-index-${index}`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type WeeklyProps = {
  value: WeeklyWindow[];
  onChange: (next: WeeklyWindow[]) => void;
  disabled?: boolean;
  errorMessage?: string | null;
};

export function WeeklyAvailabilityFields({ value, onChange, disabled, errorMessage }: WeeklyProps) {
  const updateRow = (index: number, patch: Partial<WeeklyWindow>) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([
      ...value,
      {
        id: nextWeeklyRowId(),
        dayOfWeek: 1,
        startTime: "18:00",
        endTime: "21:00",
        timezone: "Asia/Kolkata",
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] font-medium leading-snug text-text-primary/55">
          Recurring windows when you can take sessions. You can refine these later from your dashboard.
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={addRow}
          className="shrink-0 rounded-full bg-[#edf8f2] px-4 py-2 text-xs font-semibold text-[#2f6f5b] ring-1 ring-[#3e725f]/15 transition hover:bg-[#dff4e7] disabled:opacity-50"
        >
          + Add window
        </button>
      </div>

      {errorMessage ? (
        <p className="rounded-xl border border-[#f5d4d1] bg-[#fff5f4] px-3.5 py-2.5 text-[12px] font-medium text-[#b54a42]">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        {value.map((row, index) => (
          <div
            key={rowKey(row, index)}
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#ebe5dd] bg-linear-to-b from-[#fdfcfa] to-[#f7f3ed] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
          >
            <label className={`${applicationLabelClass} min-w-[5.5rem]`}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7f72]">Day</span>
              <select
                disabled={disabled}
                value={row.dayOfWeek}
                onChange={(e) => updateRow(index, { dayOfWeek: Number(e.target.value) })}
                className={applicationSelectClass}
              >
                {DAY_LABELS.map((label, dow) => (
                  <option key={label} value={dow}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${applicationLabelClass} w-[6.5rem]`}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7f72]">Start</span>
              <input
                disabled={disabled}
                value={row.startTime}
                onChange={(e) => updateRow(index, { startTime: e.target.value })}
                className={applicationInputClass}
              />
            </label>
            <label className={`${applicationLabelClass} w-[6.5rem]`}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7f72]">End</span>
              <input
                disabled={disabled}
                value={row.endTime}
                onChange={(e) => updateRow(index, { endTime: e.target.value })}
                className={applicationInputClass}
              />
            </label>
            <label className={`${applicationLabelClass} min-w-[10rem] flex-1`}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7f72]">Timezone</span>
              <input
                disabled={disabled}
                value={row.timezone ?? ""}
                placeholder="Asia/Kolkata"
                onChange={(e) => updateRow(index, { timezone: e.target.value || undefined })}
                className={applicationInputClass}
              />
            </label>
            <button
              type="button"
              disabled={disabled || value.length <= 1}
              onClick={() => removeRow(index)}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-[#b54a42] transition hover:bg-[#fde2df] disabled:opacity-35"
            >
              <span className="text-base leading-none">×</span>
              Remove
            </button>
          </div>
        ))}
      </div>
      <p className="rounded-xl bg-[#f7f3ed] px-3.5 py-2.5 text-[12px] leading-relaxed text-text-primary/52 ring-1 ring-[#ebe5dd]/80">
        Use 24-hour times (<span className="font-mono text-text-primary/65">HH:mm</span>). Each row is one recurring block (e.g. weekday evenings).
      </p>
    </div>
  );
}

export const defaultWeeklyAvailability: WeeklyWindow[] = [
  { id: "weekly-default-1", dayOfWeek: 1, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
  { id: "weekly-default-2", dayOfWeek: 2, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
  { id: "weekly-default-3", dayOfWeek: 3, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
  { id: "weekly-default-4", dayOfWeek: 4, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
  { id: "weekly-default-5", dayOfWeek: 5, startTime: "18:00", endTime: "21:00", timezone: "Asia/Kolkata" },
];
