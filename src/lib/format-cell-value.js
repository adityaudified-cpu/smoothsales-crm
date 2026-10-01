// Shared cell-rendering utility for SmoothSales Leads module
// Enforces that empty, null, undefined, or NaN values always render as "—" (muted em-dash)

import { isValid, parseISO } from "date-fns";

export function formatCellValue(val, fallback = "—") {
  if (
    val === null ||
    val === undefined ||
    val === "" ||
    val === "NaN" ||
    val === "undefined" ||
    val === "null" ||
    Number.isNaN(val)
  ) {
    return fallback;
  }
  return val;
}

export function formatINR(val, fallback = "—") {
  if (
    val === null ||
    val === undefined ||
    val === "" ||
    val === "NaN" ||
    val === "undefined" ||
    isNaN(val) ||
    Number.isNaN(Number(val))
  ) {
    return fallback;
  }
  const num = Number(val);
  if (num === 0) return fallback; // "render '—' for zero/null, never 'NaN'"

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function parseValidDate(val) {
  if (!val) return null;
  const d = typeof val === "string" ? parseISO(val) : new Date(val);
  return isValid(d) ? d : null;
}
