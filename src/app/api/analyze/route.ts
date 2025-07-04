import { NextRequest, NextResponse } from "next/server";
import { StockFundamentalAnalyzer } from "@/lib/stockAnalyzer";

export async function POST(req: NextRequest) {
  try {
    const { symbol } = await req.json();
    if (!symbol || typeof symbol !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid stock symbol." },
        { status: 400 }
      );
    }
    const analyzer = new StockFundamentalAnalyzer(symbol);
    const report = await analyzer.generateComprehensiveReport();
    if (!report) {
      return NextResponse.json(
        {
          error:
            "Failed to analyze stock. Please check the symbol and try again.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(report);
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
