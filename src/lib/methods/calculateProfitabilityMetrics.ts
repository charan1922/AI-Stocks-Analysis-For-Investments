import { getLatestYear, getValue, safeDivide, round } from "../utils/helpers";

export function calculateProfitabilityMetrics(
  incomeStatement: Record<string, unknown>[] | null,
  balanceSheet: Record<string, unknown>[] | null
) {
  try {
    const is = getLatestYear(incomeStatement);
    const bs = getLatestYear(balanceSheet);
    if (!is || !bs) return {};
    // Try all possible field names for each metric
    const totalRevenue =
      getValue(is, "totalRevenue") || getValue(is, "Total Revenue");
    const grossProfit =
      getValue(is, "grossProfit") || getValue(is, "Gross Profit");
    const operatingIncome =
      getValue(is, "operatingIncome") || getValue(is, "Operating Income");
    const netIncome = getValue(is, "netIncome") || getValue(is, "Net Income");
    const totalAssets =
      getValue(bs, "totalAssets") || getValue(bs, "Total Assets");
    const stockholdersEquity =
      getValue(bs, "totalStockholderEquity") ||
      getValue(bs, "Stockholders Equity");
    // Margins
    const grossMargin = safeDivide(grossProfit, totalRevenue) * 100;
    const operatingMargin = safeDivide(operatingIncome, totalRevenue) * 100;
    const netMargin = safeDivide(netIncome, totalRevenue) * 100;
    // Returns
    const roe = safeDivide(netIncome, stockholdersEquity) * 100;
    const roa = safeDivide(netIncome, totalAssets) * 100;
    // ROCE
    const totalDebt = getValue(bs, "totalDebt") || getValue(bs, "Total Debt");
    const capitalEmployed = stockholdersEquity + totalDebt;
    const roce = safeDivide(operatingIncome, capitalEmployed) * 100;
    // ROIC
    const currentLiabilities =
      getValue(bs, "totalCurrentLiabilities") ||
      getValue(bs, "Current Liabilities");
    const investedCapital = totalAssets - currentLiabilities;
    const roic = safeDivide(netIncome, investedCapital) * 100;
    // Asset Turnover
    const assetTurnover = safeDivide(totalRevenue, totalAssets);
    return {
      "Gross Margin (%)": round(grossMargin),
      "Operating Margin (%)": round(operatingMargin),
      "Net Margin (%)": round(netMargin),
      "ROE (%)": round(roe),
      "ROA (%)": round(roa),
      "ROCE (%)": round(roce),
      "ROIC (%)": round(roic),
      "Asset Turnover": round(assetTurnover),
    };
  } catch (e) {
    console.error("Error calculating profitability metrics:", e);
    return {};
  }
}
