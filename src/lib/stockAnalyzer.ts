import yahooFinance from "yahoo-finance2";
import { round } from "./utils/helpers";
import { calculateOwnershipMetrics } from "./methods/calculateOwnershipMetrics";
import { calculateFinancialHealthMetrics } from "./methods/calculateFinancialHealthMetrics";
import { calculateProfitabilityMetrics } from "./methods/calculateProfitabilityMetrics";
import { calculateGrowthMetrics } from "./methods/calculateGrowthMetrics";
import { calculateValuationMetrics } from "./methods/calculateValuationMetrics";

export class StockFundamentalAnalyzer {
  stockSymbol: string;
  balanceSheet: Record<string, unknown>[] | null;
  incomeStatement: Record<string, unknown>[] | null;
  cashflow: Record<string, unknown>[] | null;
  stockInfo: Record<string, unknown> | null;
  historicalData: Record<string, unknown>[] | null;

  constructor(stockSymbol: string) {
    // Always use NSE by appending .NS if not present
    if (!stockSymbol.endsWith(".NS")) {
      this.stockSymbol = stockSymbol + ".NS";
    } else {
      this.stockSymbol = stockSymbol;
    }
    this.balanceSheet = null;
    this.incomeStatement = null;
    this.cashflow = null;
    this.stockInfo = null;
    this.historicalData = null;
  }

  async fetchData() {
    try {
      this.stockInfo = await yahooFinance.quoteSummary(this.stockSymbol, {
        modules: [
          "price",
          "summaryDetail",
          "defaultKeyStatistics",
          "financialData",
        ],
      });
      const statements = await yahooFinance.quoteSummary(this.stockSymbol, {
        modules: [
          "balanceSheetHistory",
          "incomeStatementHistory",
          "cashflowStatementHistory",
        ],
      });
      this.balanceSheet =
        statements.balanceSheetHistory?.balanceSheetStatements || [];
      this.incomeStatement =
        statements.incomeStatementHistory?.incomeStatementHistory || [];
      this.cashflow =
        statements.cashflowStatementHistory?.cashflowStatements || [];
      this.historicalData = await yahooFinance.historical(this.stockSymbol, {
        period1: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
      });
      return true;
    } catch (e) {
      console.error("Error fetching data:", e);
      this.balanceSheet = [];
      this.incomeStatement = [];
      this.cashflow = [];
      this.historicalData = [];
      return false;
    }
  }

  // Utility to ensure all metric values are numbers (no undefined)
  private ensureNumbers(
    obj: Record<string, unknown>,
    keys: string[]
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (const k of keys) {
      out[k] =
        typeof obj[k] === "number" && !isNaN(obj[k] as number)
          ? (obj[k] as number)
          : 0;
    }
    return out;
  }

  // Scoring logic
  private scoreMetric(
    value: number,
    ideal: number | [number, number],
    higherBetter = true
  ): number {
    if (value === null || value === undefined || isNaN(value) || value === 0)
      return 1;
    if (Array.isArray(ideal)) {
      const [minVal, maxVal] = ideal;
      if (value >= minVal && value <= maxVal) return 10;
      if (value < minVal)
        return Math.max(1, 10 - ((minVal - value) / minVal) * 5);
      return Math.max(1, 10 - ((value - maxVal) / maxVal) * 5);
    } else {
      if (higherBetter) {
        if (value >= ideal) return 10;
        return Math.max(1, (value / ideal) * 10);
      } else {
        if (value <= ideal) return 10;
        return Math.max(1, 10 - ((value - ideal) / ideal) * 5);
      }
    }
  }

  private calculateScores(
    metrics: Record<string, number>,
    rules: Record<
      string,
      { ideal: number | [number, number]; higher_better?: boolean }
    >
  ) {
    const scores: Record<string, number> = {};
    for (const metric in metrics) {
      if (rules[metric]) {
        const rule = rules[metric];
        scores[metric] = this.scoreMetric(
          metrics[metric],
          rule.ideal,
          rule.higher_better !== false
        );
      } else {
        scores[metric] = 5;
      }
    }
    return scores;
  }

  // Investment grade
  private getInvestmentGrade(score: number): string {
    if (score >= 8) return "A+ (Excellent)";
    if (score >= 7) return "A (Very Good)";
    if (score >= 6) return "B+ (Good)";
    if (score >= 5) return "B (Average)";
    if (score >= 4) return "C+ (Below Average)";
    if (score >= 3) return "C (Poor)";
    return "D (Very Poor)";
  }

  // Main report generator
  async generateComprehensiveReport() {
    const ok = await this.fetchData();
    if (!ok) return null;
    const financialHealth = calculateFinancialHealthMetrics(
      this.balanceSheet,
      this.incomeStatement,
      this.cashflow,
      this.stockInfo
    );
    const profitability = calculateProfitabilityMetrics(
      this.incomeStatement,
      this.balanceSheet
    );
    const growth = calculateGrowthMetrics(this.incomeStatement, this.cashflow);
    const valuation = calculateValuationMetrics(
      this.incomeStatement,
      this.balanceSheet,
      this.cashflow,
      this.stockInfo
    );
    const ownership = calculateOwnershipMetrics(this.stockInfo);
    // Scoring rules
    const financialHealthKeys = [
      "Debt-to-Equity Ratio",
      "Current Ratio",
      "Interest Coverage Ratio",
      "Quick Ratio",
      "FCF/Debt",
      "FCF/Sales (%)",
      "Cash Conversion Cycle",
      "Fixed Asset Turnover",
      "Inventory Days",
      "Receivable Days",
    ];
    const profitabilityKeys = [
      "Gross Margin (%)",
      "Operating Margin (%)",
      "Net Margin (%)",
      "ROE (%)",
      "ROA (%)",
      "ROCE (%)",
      "ROIC (%)",
      "Asset Turnover",
    ];
    const growthKeys = [
      "Revenue Growth (3Y CAGR %)",
      "Net Profit Growth (3Y CAGR %)",
      "FCF Growth (3Y CAGR %)",
    ];
    const valuationKeys = [
      "P/E Ratio",
      "P/B Ratio",
      "P/S Ratio",
      "EV/EBITDA",
      "FCF Yield (%)",
      "Dividend Yield (%)",
    ];
    const fhMetrics = this.ensureNumbers(financialHealth, financialHealthKeys);
    const profMetrics = this.ensureNumbers(profitability, profitabilityKeys);
    const growthMetrics = this.ensureNumbers(growth, growthKeys);
    const valMetrics = this.ensureNumbers(valuation, valuationKeys);
    // Scoring rules
    const financialHealthRules = {
      "Debt-to-Equity Ratio": { ideal: 0.5, higher_better: false },
      "Current Ratio": { ideal: 1.5 },
      "Interest Coverage Ratio": { ideal: 4 },
      "Quick Ratio": { ideal: 1 },
      "FCF/Debt": { ideal: 0.5 },
      "FCF/Sales (%)": { ideal: 5 },
      "Cash Conversion Cycle": { ideal: 90, higher_better: false },
      "Fixed Asset Turnover": { ideal: 1 },
    };
    const profitabilityRules = {
      "Gross Margin (%)": { ideal: 25 },
      "Operating Margin (%)": { ideal: 15 },
      "Net Margin (%)": { ideal: 8 },
      "ROE (%)": { ideal: 15 },
      "ROA (%)": { ideal: 8 },
      "ROCE (%)": { ideal: 15 },
      "ROIC (%)": { ideal: 12 },
    };
    const growthRules = {
      "Revenue Growth (3Y CAGR %)": { ideal: 10 },
      "Net Profit Growth (3Y CAGR %)": { ideal: 15 },
      "FCF Growth (3Y CAGR %)": { ideal: 10 },
    };
    const valuationRules = {
      "P/E Ratio": { ideal: 20, higher_better: false },
      "P/B Ratio": { ideal: 3, higher_better: false },
      "P/S Ratio": { ideal: 5, higher_better: false },
      "EV/EBITDA": { ideal: 12, higher_better: false },
      "FCF Yield (%)": { ideal: 4 },
      "Dividend Yield (%)": { ideal: 2 },
    };
    // Calculate scores
    const fhScores = this.calculateScores(fhMetrics, financialHealthRules);
    const profScores = this.calculateScores(profMetrics, profitabilityRules);
    const growthScores = this.calculateScores(growthMetrics, growthRules);
    const valScores = this.calculateScores(valMetrics, valuationRules);
    // Category averages
    const fhAvg = Object.values(fhScores).length
      ? Object.values(fhScores).reduce((a, b) => a + b, 0) /
        Object.values(fhScores).length
      : 0;
    const profAvg = Object.values(profScores).length
      ? Object.values(profScores).reduce((a, b) => a + b, 0) /
        Object.values(profScores).length
      : 0;
    const growthAvg = Object.values(growthScores).length
      ? Object.values(growthScores).reduce((a, b) => a + b, 0) /
        Object.values(growthScores).length
      : 0;
    const valAvg = Object.values(valScores).length
      ? Object.values(valScores).reduce((a, b) => a + b, 0) /
        Object.values(valScores).length
      : 0;
    const ownershipAvg = 5; // Default
    // Final weighted score
    const weights = {
      "Financial Health": 0.2,
      Profitability: 0.25,
      Growth: 0.2,
      Valuation: 0.2,
      Ownership: 0.15,
    };
    const finalScore =
      fhAvg * weights["Financial Health"] +
      profAvg * weights["Profitability"] +
      growthAvg * weights["Growth"] +
      valAvg * weights["Valuation"] +
      ownershipAvg * weights["Ownership"];
    // Report
    return {
      "Stock Symbol": this.stockSymbol,
      "Analysis Date": new Date().toISOString().slice(0, 10),
      "Financial Health Metrics": fhMetrics,
      "Financial Health Scores": fhScores,
      "Financial Health Average": round(fhAvg),
      "Profitability Metrics": profMetrics,
      "Profitability Scores": profScores,
      "Profitability Average": round(profAvg),
      "Growth Metrics": growthMetrics,
      "Growth Scores": growthScores,
      "Growth Average": round(growthAvg),
      "Valuation Metrics": valMetrics,
      "Valuation Scores": valScores,
      "Valuation Average": round(valAvg),
      "Ownership Metrics": ownership,
      "Ownership Average": ownershipAvg,
      "Category Scores": {
        "Financial Health": round(fhAvg),
        Profitability: round(profAvg),
        Growth: round(growthAvg),
        Valuation: round(valAvg),
        Ownership: ownershipAvg,
      },
      "Final Score": round(finalScore),
      "Investment Grade": this.getInvestmentGrade(finalScore),
    };
  }
}
