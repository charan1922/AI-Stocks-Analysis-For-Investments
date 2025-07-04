// Helper functions extracted from StockFundamentalAnalyzer

// Safe division
export function safeDivide(numerator: number, denominator: number): number {
  if (
    numerator === null ||
    denominator === null ||
    denominator === 0 ||
    isNaN(numerator) ||
    isNaN(denominator)
  ) {
    return 0;
  }
  return numerator / denominator;
}

// CAGR calculation
export function getCAGR(
  startValue: number,
  endValue: number,
  periods: number
): number {
  if (startValue <= 0 || endValue <= 0 || periods <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
}

// Rounding
export function round(val: number, digits = 2): number {
  return (
    Math.round((val + Number.EPSILON) * Math.pow(10, digits)) /
    Math.pow(10, digits)
  );
}

// Get latest year (for Yahoo data)
export function getLatestYear<T>(objArr: T[] | null): T | null {
  return objArr && objArr.length > 0 ? objArr[0] : null;
}

// Get value from statement
// Enhanced getValue: try both camelCase and Title Case keys, fallback to direct number
export function getValue(
  statement: Record<string, unknown> | null,
  key: string
): number {
  if (!statement) return 0;
  // Try camelCase
  if (
    typeof statement[key] === "object" &&
    statement[key] !== null &&
    "raw" in (statement[key] as object) &&
    (statement[key] as { raw?: unknown }).raw != null
  ) {
    const rawValue = (statement[key] as { raw?: unknown }).raw;
    return typeof rawValue === "number" ? rawValue : 0;
  }
  // Try Title Case (for yfinance/pandas compatibility)
  const titleKey = key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (typeof statement[titleKey] === "number") {
    return statement[titleKey] as number;
  }
  // Try direct number
  if (typeof statement[key] === "number") {
    return statement[key] as number;
  }
  return 0;
}
