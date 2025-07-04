import { getCAGR, getValue, round } from "../utils/helpers";

export function calculateGrowthMetrics(
  incomeStatement: Record<string, unknown>[] | null,
  cashflow: Record<string, unknown>[] | null
) {
  try {
    if (incomeStatement && incomeStatement.length >= 3) {
      const current = incomeStatement[0];
      const threeAgo = incomeStatement[2];
      // Revenue Growth
      const currentRevenue =
        getValue(current, "totalRevenue") || getValue(current, "Total Revenue");
      const pastRevenue =
        getValue(threeAgo, "totalRevenue") ||
        getValue(threeAgo, "Total Revenue");
      const revenueCAGR = getCAGR(pastRevenue, currentRevenue, 3);
      // Net Income Growth
      const currentNetIncome =
        getValue(current, "netIncome") || getValue(current, "Net Income");
      const pastNetIncome =
        getValue(threeAgo, "netIncome") || getValue(threeAgo, "Net Income");
      const netIncomeCAGR = getCAGR(
        Math.abs(pastNetIncome),
        Math.abs(currentNetIncome),
        3
      );
      // FCF Growth
      let fcfCAGR = 0;
      if (cashflow && cashflow.length >= 3) {
        // Try direct field, else calculate
        let currentFCF =
          getValue(cashflow[0], "freeCashFlow") ||
          getValue(cashflow[0], "Free Cash Flow");
        if (!currentFCF) {
          currentFCF =
            getValue(cashflow[0], "totalCashFromOperatingActivities") -
            getValue(cashflow[0], "capitalExpenditures");
        }
        let pastFCF =
          getValue(cashflow[2], "freeCashFlow") ||
          getValue(cashflow[2], "Free Cash Flow");
        if (!pastFCF) {
          pastFCF =
            getValue(cashflow[2], "totalCashFromOperatingActivities") -
            getValue(cashflow[2], "capitalExpenditures");
        }
        if (pastFCF > 0 && currentFCF > 0) {
          fcfCAGR = getCAGR(pastFCF, currentFCF, 3);
        }
      }
      return {
        "Revenue Growth (3Y CAGR %)": round(revenueCAGR),
        "Net Profit Growth (3Y CAGR %)": round(netIncomeCAGR),
        "FCF Growth (3Y CAGR %)": round(fcfCAGR),
      };
    } else {
      return {
        "Revenue Growth (3Y CAGR %)": 0,
        "Net Profit Growth (3Y CAGR %)": 0,
        "FCF Growth (3Y CAGR %)": 0,
      };
    }
  } catch (e) {
    console.error("Error calculating growth metrics:", e);
    return {};
  }
}
