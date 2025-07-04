import { safeDivide, round, getValue } from "../utils/helpers";

type StockInfo = {
  financialData?: Record<string, unknown>;
  defaultKeyStatistics?: Record<string, unknown>;
};

function getFieldAllSources(
  stockInfo: StockInfo | null,
  statement: Record<string, unknown> | undefined,
  keys: string[]
): number {
  // Try financialData
  if (stockInfo?.financialData) {
    for (const key of keys) {
      const val = getValue(stockInfo.financialData, key);
      if (val) return val;
    }
  }
  // Try defaultKeyStatistics
  if (stockInfo?.defaultKeyStatistics) {
    for (const key of keys) {
      const val = getValue(stockInfo.defaultKeyStatistics, key);
      if (val) return val;
    }
  }
  // Fallback to statement
  if (statement) {
    for (const key of keys) {
      const val = getValue(statement, key);
      if (val) return val;
    }
  }
  return 0;
}

function getLatestByDate(
  arr: Record<string, unknown>[] | null
): Record<string, unknown> | undefined {
  if (!arr || arr.length === 0) return undefined;
  function extractDate(obj: Record<string, unknown>): number {
    const endDate = obj["endDate"];
    if (typeof endDate === "object" && endDate && "raw" in endDate) {
      return (endDate as { raw?: number }).raw ?? 0;
    }
    if (typeof endDate === "number") return endDate;
    if (typeof obj["date"] === "number") return obj["date"] as number;
    return 0;
  }
  return arr.reduce((a, b) => {
    const aDate = extractDate(a);
    const bDate = extractDate(b);
    return aDate > bDate ? a : b;
  });
}

export function calculateFinancialHealthMetrics(
  balanceSheet: Record<string, unknown>[] | null,
  incomeStatement: Record<string, unknown>[] | null,
  cashflow: Record<string, unknown>[] | null,
  stockInfo: StockInfo | null
) {
  try {
    const bs = getLatestByDate(balanceSheet);
    const is = getLatestByDate(incomeStatement);
    const cf = getLatestByDate(cashflow);
    if (!bs || !is) return {};
    // Balance Sheet items
    const totalDebt = getFieldAllSources(stockInfo, bs, [
      "totalDebt",
      "Total Debt",
    ]);
    const stockholdersEquity = getFieldAllSources(stockInfo, bs, [
      "totalStockholderEquity",
      "Stockholders Equity",
      "bookValue",
    ]);
    const currentAssets = getFieldAllSources(stockInfo, bs, [
      "totalCurrentAssets",
      "Current Assets",
    ]);
    const currentLiabilities = getFieldAllSources(stockInfo, bs, [
      "totalCurrentLiabilities",
      "Current Liabilities",
    ]);
    const cashEquivalents = getFieldAllSources(stockInfo, bs, [
      "cashAndCashEquivalents",
      "Cash And Cash Equivalents",
      "totalCash",
    ]);
    const accountsReceivable = getFieldAllSources(stockInfo, bs, [
      "netReceivables",
      "Accounts Receivable",
    ]);
    const inventory = getFieldAllSources(stockInfo, bs, [
      "inventory",
      "Inventory",
    ]);
    const accountsPayable = getFieldAllSources(stockInfo, bs, [
      "accountsPayable",
      "Accounts Payable",
    ]);
    // Income Statement items
    const totalRevenue = getFieldAllSources(stockInfo, is, [
      "totalRevenue",
      "Total Revenue",
    ]);
    const ebit = getFieldAllSources(stockInfo, is, ["ebit", "EBIT"]);
    const interestExpense = Math.abs(
      getFieldAllSources(stockInfo, is, ["interestExpense", "Interest Expense"])
    );
    const costOfRevenue = getFieldAllSources(stockInfo, is, [
      "costOfRevenue",
      "Cost Of Revenue",
    ]);
    // Cash Flow items
    let freeCashFlow = getFieldAllSources(stockInfo, cf, [
      "freeCashFlow",
      "Free Cash Flow",
    ]);
    if (!freeCashFlow) {
      freeCashFlow =
        getFieldAllSources(stockInfo, cf, [
          "totalCashFromOperatingActivities",
        ]) - getFieldAllSources(stockInfo, cf, ["capitalExpenditures"]);
    }
    // PPE calculation
    const grossPPE = getFieldAllSources(stockInfo, bs, [
      "propertyPlantEquipment",
      "Gross PPE",
    ]);
    const accumulatedDepreciation = Math.abs(
      getFieldAllSources(stockInfo, bs, [
        "accumulatedDepreciation",
        "Accumulated Depreciation",
      ])
    );
    const netPPE = grossPPE - accumulatedDepreciation;
    // Calculate ratios
    const debtToEquity = safeDivide(totalDebt, stockholdersEquity);
    const currentRatio = safeDivide(currentAssets, currentLiabilities);
    const interestCoverageRatio = safeDivide(ebit, interestExpense);
    const quickRatio = safeDivide(
      cashEquivalents + accountsReceivable,
      currentLiabilities
    );
    const fcfToDebt = totalDebt > 0 ? safeDivide(freeCashFlow, totalDebt) : 0;
    const fcfToSales = safeDivide(freeCashFlow, totalRevenue) * 100;
    // Cash Conversion Cycle
    const dio =
      costOfRevenue > 0 ? safeDivide(inventory, costOfRevenue) * 365 : 0;
    const dso = safeDivide(accountsReceivable, totalRevenue) * 365;
    const dpo =
      costOfRevenue > 0 ? safeDivide(accountsPayable, costOfRevenue) * 365 : 0;
    const ccc = dio + dso - dpo;
    // Fixed Asset Turnover
    const fixedAssetTurnover = safeDivide(totalRevenue, netPPE);
    return {
      "Debt-to-Equity Ratio": round(debtToEquity, 2),
      "Current Ratio": round(currentRatio, 2),
      "Interest Coverage Ratio": round(interestCoverageRatio, 2),
      "Quick Ratio": round(quickRatio, 2),
      "FCF/Debt": round(fcfToDebt, 2),
      "FCF/Sales (%)": round(fcfToSales, 2),
      "Cash Conversion Cycle": round(ccc, 2),
      "Fixed Asset Turnover": round(fixedAssetTurnover, 2),
      "Inventory Days": round(dio, 2),
      "Receivable Days": round(dso, 2),
    };
  } catch (e) {
    console.error("Error calculating financial health metrics:", e);
    return {};
  }
}
