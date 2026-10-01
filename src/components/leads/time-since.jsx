import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";

/**
 * Formats an ISO date string or Date object into a compact relative string:
 * e.g., "2s", "9m", "3h", "2d".
 */
export function formatTimeSince(date) {
  if (!date) return "—";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsed.getTime())) return "—";

  const now = new Date();
  const diffSec = Math.max(0, differenceInSeconds(now, parsed));
  if (diffSec < 60) return `${diffSec}s`;

  const diffMin = differenceInMinutes(now, parsed);
  if (diffMin < 60) return `${diffMin}m`;

  const diffHours = differenceInHours(now, parsed);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = differenceInDays(now, parsed);
  return `${diffDays}d`;
}

export function TimeSince({ date, className = "" }) {
  return <span className={className}>{formatTimeSince(date)}</span>;
}
