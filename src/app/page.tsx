"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Report {
  [key: string]: unknown;
}

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  async function analyzeStock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setReport(data);
    } catch (err) {
      console.error("Error analyzing stock:", err);
      setError("Failed to analyze stock.");
    } finally {
      setLoading(false);
    }
  }

  function renderStatusCard() {
    if (loading) {
      return (
        <Card className="mb-6">
          <CardContent>
            <span className="text-lg">
              🔍 Analyzing {symbol.toUpperCase() || "..."}
            </span>
          </CardContent>
        </Card>
      );
    }
    if (report) {
      return (
        <Card className="mb-6">
          <CardContent>
            <span className="text-lg">
              ✅ Data fetched successfully for{" "}
              {String(report["Stock Symbol"] || "")}{" "}
            </span>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  function renderMetricsTable(
    title: string,
    metrics: Record<string, unknown>,
    scores?: Record<string, unknown>,
    avg?: number
  ) {
    if (!metrics) return null;
    const keys = Object.keys(metrics);
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                {scores && <TableHead>Score</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k}>
                  <TableCell>{k}</TableCell>
                  <TableCell>{String(metrics[k])}</TableCell>
                  {scores && <TableCell>{String(scores[k])}</TableCell>}
                </TableRow>
              ))}
              {avg !== undefined && (
                <TableRow>
                  <TableCell colSpan={scores ? 2 : 1} className="font-bold">
                    Average Score
                  </TableCell>
                  <TableCell className="font-bold">
                    {avg.toFixed(1)}/10
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  function renderFinalScoringDashboard() {
    if (!report) return null;
    const weights: Record<string, number> = {
      "Financial Health": 0.2,
      Profitability: 0.25,
      Growth: 0.2,
      Valuation: 0.2,
      Ownership: 0.15,
    };
    const cats = [
      "Financial Health",
      "Profitability",
      "Growth",
      "Valuation",
      "Ownership",
    ];
    const categoryScores = report["Category Scores"] as Record<string, number>;
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>🎯 Final Scoring Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Weighted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.map((cat) => {
                const avg = categoryScores?.[cat] ?? 0;
                const weight = weights[cat] ?? 0;
                const weighted = (avg * weight).toFixed(2);
                return (
                  <TableRow key={cat}>
                    <TableCell>{cat}</TableCell>
                    <TableCell>{(weight * 100).toFixed(0)}%</TableCell>
                    <TableCell>{avg?.toFixed(1)}/10</TableCell>
                    <TableCell>{weighted}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-bold">
                <TableCell>FINAL SCORE</TableCell>
                <TableCell>100%</TableCell>
                <TableCell>
                  {Number(report["Final Score"]).toFixed(1)}/10
                </TableCell>
                <TableCell>
                  ** {String(report["Investment Grade"])} **
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Stock Fundamental Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={analyzeStock} className="flex gap-4 items-end">
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter stock symbol (e.g. KPITTECH.NS)"
              required
              className="w-64"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </form>
          {error && <div className="text-red-500 mt-4">{error}</div>}
        </CardContent>
      </Card>

      {renderStatusCard()}

      {report && (
        <>
          {renderMetricsTable(
            "Financial Health Metrics",
            report["Financial Health Metrics"] as Record<string, unknown>,
            report["Financial Health Scores"] as Record<string, unknown>,
            report["Financial Health Average"] as number
          )}
          {renderMetricsTable(
            "Profitability Metrics",
            report["Profitability Metrics"] as Record<string, unknown>,
            report["Profitability Scores"] as Record<string, unknown>,
            report["Profitability Average"] as number
          )}
          {renderMetricsTable(
            "Growth Metrics",
            report["Growth Metrics"] as Record<string, unknown>,
            report["Growth Scores"] as Record<string, unknown>,
            report["Growth Average"] as number
          )}
          {renderMetricsTable(
            "Valuation Metrics",
            report["Valuation Metrics"] as Record<string, unknown>,
            report["Valuation Scores"] as Record<string, unknown>,
            report["Valuation Average"] as number
          )}
          {renderMetricsTable(
            "Ownership Metrics",
            report["Ownership Metrics"] as Record<string, unknown>,
            undefined,
            report["Ownership Average"] as number
          )}

          {renderFinalScoringDashboard()}
        </>
      )}
    </main>
  );
}
