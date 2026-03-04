// ── GET /api/adoption — 채택률 메트릭 조회 ──
import type { NextApiRequest, NextApiResponse } from "next";
import type { AdoptionPeriod, AdoptionFilterParams } from "@/lib/types";
import {
  getAdoptionSummary,
  getActiveUsersMetrics,
  getSessionFrequencyMetrics,
  getFeatureUsageMetrics,
  getEngagementMetrics,
  getRetentionMetrics,
  getAdoptionSnapshots,
  createDailySnapshot,
} from "@/lib/adoption-queries";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const view = (req.query.view as string) ?? "summary";
    const period = (req.query.period as AdoptionPeriod) ?? "day";
    const userId = req.query.userId as string | undefined;
    const since = req.query.since as string | undefined;
    const until = req.query.until as string | undefined;

    const filters: AdoptionFilterParams = {
      userId,
      period,
      since,
      until,
    };

    switch (view) {
      case "summary": {
        const summary = await getAdoptionSummary(filters);
        return res.status(200).json(summary);
      }

      case "active-users": {
        const metrics = await getActiveUsersMetrics(filters);
        return res.status(200).json({ metrics, period });
      }

      case "session-frequency": {
        const metrics = await getSessionFrequencyMetrics(filters);
        return res.status(200).json({ metrics });
      }

      case "feature-usage": {
        const metrics = await getFeatureUsageMetrics(filters);
        return res.status(200).json({ metrics });
      }

      case "engagement": {
        const metrics = await getEngagementMetrics(filters);
        return res.status(200).json({ metrics });
      }

      case "retention": {
        const maxWeeks = Number(req.query.maxWeeks) || 8;
        const metrics = await getRetentionMetrics(filters, maxWeeks);
        return res.status(200).json({ metrics });
      }

      case "snapshots": {
        const limit = Number(req.query.limit) || 30;
        const snapshots = await getAdoptionSnapshots(period, limit);
        return res.status(200).json({ snapshots });
      }

      case "snapshot-create": {
        const snapshot = await createDailySnapshot();
        return res.status(200).json({ snapshot });
      }

      default:
        return res.status(400).json({
          error: `Unknown view: ${view}`,
          validViews: [
            "summary",
            "active-users",
            "session-frequency",
            "feature-usage",
            "engagement",
            "retention",
            "snapshots",
            "snapshot-create",
          ],
        });
    }
  } catch (error) {
    console.error("[cc-monitor] Adoption metrics error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
