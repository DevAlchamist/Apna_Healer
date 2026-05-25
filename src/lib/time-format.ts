/** Normalize DB / user input to HH:mm for validators and time inputs. */
export function normalizeTimeToHHmm(value: string): string {
  const trimmed = value.trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(trimmed);
  if (!match) return trimmed;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return trimmed;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return trimmed;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeWeeklyWindows<T extends { startTime: string; endTime: string }>(
  windows: T[],
): T[] {
  return windows.map((row) => ({
    ...row,
    startTime: normalizeTimeToHHmm(row.startTime),
    endTime: normalizeTimeToHHmm(row.endTime),
  }));
}
