// ── GET /api/adoption — 채택률 메트릭 조회 ──
//
// 쿼리 파라미터:
//   view: "summary" | "active-users" | "session-frequency" | "feature-usage" |
//         "engagement" | "retention" | "snapshots" | "snapshot-create"
//   period: "day" | "week" | "month" (기본: "day")
//   userId: 사용자 ID 필터
//   since: 조회 시작일 (ISO 8601)
//   until: 조회 종료일 (ISO 8601)
//   limit: 결과 수 제한 (snapshots 뷰에서 사용)
//   maxWeeks: 리텐션 최대 주 수 (retention 뷰, 기본: 8)

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
        const summary = getAdoptionSummary(filters);
        return res.status(200).json(summary);
      }

      case "active-users": {
        const metrics = getActiveUsersMetrics(filters);
        return res.status(200).json({ metrics, period });
      }

      case "session-frequency": {
        const metrics = getSessionFrequencyMetrics(filters);
        return res.status(200).json({ metrics });
      }

      case "feature-usage": {
        const metrics = getFeatureUsageMetrics(filters);
        return res.status(200).json({ metrics });
      }

      case "engagement": {
        const metrics = getEngagementMetrics(filters);
        return res.status(200).json({ metrics });
      }

      case "retention": {
        const maxWeeks = Number(req.query.maxWeeks) || 8;
        const metrics = getRetentionMetrics(filters, maxWeeks);
        return res.status(200).json({ metrics });
      }

      case "snapshots": {
        const limit = Number(req.query.limit) || 30;
        const snapshots = getAdoptionSnapshots(period, limit);
        return res.status(200).json({ snapshots });
      }

      case "snapshot-create": {
        const snapshot = createDailySnapshot();
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
