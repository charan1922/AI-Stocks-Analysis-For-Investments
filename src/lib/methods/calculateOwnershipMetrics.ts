import { round, safeDivide } from "../utils/helpers";

interface DefaultKeyStatistics {
  floatShares?: number;
  sharesOutstanding?: number;
  heldPercentInsiders?: number;
  heldPercentInstitutions?: number;
}

export function calculateOwnershipMetrics(
  stockInfo: Record<string, unknown> | null
) {
  try {
    const defaultKeyStatistics = stockInfo?.defaultKeyStatistics as
      | DefaultKeyStatistics
      | undefined;
    const floatShares = defaultKeyStatistics?.floatShares || 0;
    const sharesOutstanding = defaultKeyStatistics?.sharesOutstanding || 0;
    const insiderOwnership =
      (defaultKeyStatistics?.heldPercentInsiders || 0) * 100;
    const institutionalOwnership =
      (defaultKeyStatistics?.heldPercentInstitutions || 0) * 100;
    return {
      "Promoter Holding (%)": round(insiderOwnership),
      "Institutional Holding (%)": round(institutionalOwnership),
      "Pledged Shares (%)": 0, // Not available
      "Float Ratio (%)": round(
        safeDivide(floatShares, sharesOutstanding) * 100
      ),
    };
  } catch (e) {
    console.error("Error calculating ownership metrics:", e);
    return {};
  }
}
