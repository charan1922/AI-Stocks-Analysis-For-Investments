import { getLatestYear, safeDivide, round } from "../utils/helpers";

function getField(
  obj: Record<string, unknown> | undefined,
  keys: string[]
): number {
  if (!obj) return 0;
  for (const key of keys) {
    if (typeof obj[key] === "number") return obj[key] as number;
    if (
      typeof obj[key] === "object" &&
      obj[key] &&
      "raw" in (obj[key] as object)
    ) {
      const raw = (obj[key] as { raw?: unknown }).raw;
      if (typeof raw === "number") return raw;
    }
  }
  return 0;
}

type StockInfo = {
  price?: {
    marketCap?: number;
    regularMarketPrice?: number;
  };
  defaultKeyStatistics?: Record<string, unknown>;
  summaryDetail?: Record<string, unknown>;
  financialData?: Record<string, unknown>;
};

export function calculateValuationMetrics(
  incomeStatement: Record<string, unknown>[] | null,
  balanceSheet: Record<string, unknown>[] | null,
  cashflow: Record<string, unknown>[] | null,
  stockInfo: StockInfo | null
) {
  try {
    // Prefer financialData for Indian stocks
    const fd = stockInfo?.financialData;
    const dks = stockInfo?.defaultKeyStatistics;
    const price = stockInfo?.price;
    // Market data
    const marketCap =
      getField(price, ["marketCap"]) ||
      getField(fd, ["marketCap"]) ||
      getField(stockInfo || undefined, ["marketCap", "Market Cap"]) ||
      0;
    const sharesOutstanding =
      getField(dks, ["sharesOutstanding"]) ||
      getField(stockInfo || undefined, [
        "sharesOutstanding",
        "Shares Outstanding",
      ]) ||
      0;
    const currentPrice =
      getField(price, ["regularMarketPrice"]) ||
      getField(fd, ["currentPrice"]) ||
      getField(stockInfo || undefined, ["currentPrice", "Current Price"]) ||
      0;
    // Financial data
    const netIncome =
      getField(fd, ["netIncome"]) ||
      getField(getLatestYear(incomeStatement) || undefined, ["netIncome", "Net Income"]);
    const totalRevenue =
      getField(fd, ["totalRevenue"]) ||
      getField(getLatestYear(incomeStatement) ?? undefined, [
        "totalRevenue",
        "Total Revenue",
      ]);
    const stockholdersEquity =
      getField(dks, ["bookValue"]) * sharesOutstanding ||
      getField(getLatestYear(balanceSheet) ?? undefined, [
        "totalStockholderEquity",
        "Stockholders Equity",
      ]);
    // Ratios
    const eps =
      sharesOutstanding > 0 ? safeDivide(netIncome, sharesOutstanding) : 0;
    const peRatio = fd?.trailingPE
      ? Number(fd.trailingPE)
      : eps > 0
      ? safeDivide(currentPrice, eps)
      : 0;
    const pbRatio = fd?.priceToBook
      ? Number(fd.priceToBook)
      : safeDivide(marketCap, stockholdersEquity);
    const psRatio = fd?.priceToSalesTrailing12Months
      ? Number(fd.priceToSalesTrailing12Months)
      : safeDivide(marketCap, totalRevenue);
    // EBITDA
    const operatingIncome =
      getField(fd, ["ebitda"]) ||
      getField(getLatestYear(incomeStatement) ?? undefined, [
        "operatingIncome",
        "Operating Income",
      ]);
    const depreciation = getField(getLatestYear(cashflow) ?? undefined, [
      "depreciation",
      "Depreciation",
    ]);
    const ebitda = operatingIncome + depreciation;
    // Enterprise Value
    const totalDebt =
      getField(fd, ["totalDebt"]) ||
      getField(getLatestYear(balanceSheet) ?? undefined, ["totalDebt", "Total Debt"]);
    const cash =
      getField(fd, ["totalCash"]) ||
      getField(getLatestYear(balanceSheet) ?? undefined, [
        "cashAndCashEquivalents",
        "Cash And Cash Equivalents",
      ]);
    const enterpriseValue = fd?.enterpriseValue
      ? Number(fd.enterpriseValue)
      : marketCap + totalDebt - cash;
    const evEbitda = fd?.enterpriseToEbitda
      ? Number(fd.enterpriseToEbitda)
      : ebitda > 0
      ? safeDivide(enterpriseValue, ebitda)
      : 0;
    // FCF Yield
    let freeCashFlow =
      getField(fd, ["freeCashflow"]) ||
      getField(getLatestYear(cashflow) ?? undefined, ["freeCashFlow", "Free Cash Flow"]);
    if (!freeCashFlow) {
      freeCashFlow =
        getField(getLatestYear(cashflow) ?? undefined, [
          "totalCashFromOperatingActivities",
        ]) - getField(getLatestYear(cashflow) ?? undefined, ["capitalExpenditures"]);
    }
    const fcfYield =
      marketCap > 0 ? safeDivide(freeCashFlow, marketCap) * 100 : 0;
    // Dividend Yield
    const dividendYield =
      (getField(stockInfo?.summaryDetail, ["dividendYield"]) ||
        getField(fd, ["dividendYield"]) ||
        0) * 100;
    return {
      "P/E Ratio": round(peRatio, 2),
      "P/B Ratio": round(pbRatio, 2),
      "P/S Ratio": round(psRatio, 2),
      "EV/EBITDA": round(evEbitda, 2),
      "FCF Yield (%)": round(fcfYield, 2),
      "Dividend Yield (%)": round(dividendYield, 2),
    };
  } catch (e) {
    console.error("Error calculating valuation metrics:", e);
    return {};
  }
}
