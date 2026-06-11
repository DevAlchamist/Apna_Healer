const MS_24H = 24 * 60 * 60 * 1000;
const MS_1H = 60 * 60 * 1000;
const WINDOW_24H_MIN = MS_24H - 15 * 60 * 1000;
const WINDOW_24H_MAX = MS_24H + 15 * 60 * 1000;
const WINDOW_1H_MIN = MS_1H - 5 * 60 * 1000;
const WINDOW_1H_MAX = MS_1H + 5 * 60 * 1000;

export function getReminderWindow(kind: "24h" | "1h", now = Date.now()) {
  if (kind === "24h") {
    return {
      startGte: new Date(now + WINDOW_24H_MIN),
      startLt: new Date(now + WINDOW_24H_MAX),
    };
  }
  return {
    startGte: new Date(now + WINDOW_1H_MIN),
    startLt: new Date(now + WINDOW_1H_MAX),
  };
}
