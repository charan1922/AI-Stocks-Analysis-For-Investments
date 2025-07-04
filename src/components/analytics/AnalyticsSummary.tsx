import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AnalyticsSummaryProps {
  report: Record<string, unknown>;
}

export function AnalyticsSummary({ report }: AnalyticsSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Final Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-primary">
              {String(report["Final Score"])}
            </span>
            <Progress
              value={Number(report["Final Score"])}
              max={10}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Investment Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className="text-lg px-4 py-2" variant="secondary">
            {String(report["Investment Grade"])}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-lg font-semibold">
            {String(report["Stock Symbol"])}{" "}
          </span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Analysis Date</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-lg font-semibold">
            {String(report["Analysis Date"])}{" "}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
