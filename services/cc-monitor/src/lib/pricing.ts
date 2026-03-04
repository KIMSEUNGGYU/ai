// ── 모델별 토큰 단가 매핑 테이블 ──
// 단가: USD per 1M tokens (MTok)
// 출처: https://docs.anthropic.com/en/docs/about-claude/models
// 마지막 업데이트: 2025-06

export interface ModelPricing {
  /** 모델 표시 이름 */
  displayName: string;
  /** Input 토큰 단가 ($/MTok) */
  inputPerMTok: number;
  /** Output 토큰 단가 ($/MTok) */
  outputPerMTok: number;
  /** Cache Write 토큰 단가 ($/MTok) — 미지원 시 inputPerMTok 사용 */
  cacheWritePerMTok: number;
  /** Cache Read 토큰 단가 ($/MTok) — 미지원 시 inputPerMTok * 0.1 사용 */
  cacheReadPerMTok: number;
}

/**
 * Claude 모델별 토큰 단가 매핑 테이블
 * key: 모델 ID (API에서 반환되는 정확한 이름)
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // ── Claude Opus 4.6 ──
  "claude-opus-4-6": {
    displayName: "Claude Opus 4.6",
    inputPerMTok: 15,
    outputPerMTok: 75,
    cacheWritePerMTok: 18.75,
    cacheReadPerMTok: 1.5,
  },

  // ── Claude Opus 4 ──
  "claude-opus-4-20250514": {
    displayName: "Claude Opus 4",
    inputPerMTok: 15,
    outputPerMTok: 75,
    cacheWritePerMTok: 18.75,
    cacheReadPerMTok: 1.5,
  },
  "claude-opus-4-0": {
    displayName: "Claude Opus 4",
    inputPerMTok: 15,
    outputPerMTok: 75,
    cacheWritePerMTok: 18.75,
    cacheReadPerMTok: 1.5,
  },

  // ── Claude Sonnet 4 ──
  "claude-sonnet-4-20250514": {
    displayName: "Claude Sonnet 4",
    inputPerMTok: 3,
    outputPerMTok: 15,
    cacheWritePerMTok: 3.75,
    cacheReadPerMTok: 0.3,
  },
  "claude-sonnet-4-0": {
    displayName: "Claude Sonnet 4",
    inputPerMTok: 3,
    outputPerMTok: 15,
    cacheWritePerMTok: 3.75,
    cacheReadPerMTok: 0.3,
  },

  // ── Claude 3.5 Sonnet ──
  "claude-3-5-sonnet-20241022": {
    displayName: "Claude 3.5 Sonnet",
    inputPerMTok: 3,
    outputPerMTok: 15,
    cacheWritePerMTok: 3.75,
    cacheReadPerMTok: 0.3,
  },
  "claude-3-5-sonnet-20240620": {
    displayName: "Claude 3.5 Sonnet",
    inputPerMTok: 3,
    outputPerMTok: 15,
    cacheWritePerMTok: 3.75,
    cacheReadPerMTok: 0.3,
  },

  // ── Claude 3.5 Haiku ──
  "claude-3-5-haiku-20241022": {
    displayName: "Claude 3.5 Haiku",
    inputPerMTok: 0.8,
    outputPerMTok: 4,
    cacheWritePerMTok: 1,
    cacheReadPerMTok: 0.08,
  },

  // ── Claude 3 Opus ──
  "claude-3-opus-20240229": {
    displayName: "Claude 3 Opus",
    inputPerMTok: 15,
    outputPerMTok: 75,
    cacheWritePerMTok: 18.75,
    cacheReadPerMTok: 1.5,
  },

  // ── Claude 3 Sonnet ──
  "claude-3-sonnet-20240229": {
    displayName: "Claude 3 Sonnet",
    inputPerMTok: 3,
    outputPerMTok: 15,
    cacheWritePerMTok: 3.75,
    cacheReadPerMTok: 0.3,
  },

  // ── Claude 3 Haiku ──
  "claude-3-haiku-20240307": {
    displayName: "Claude 3 Haiku",
    inputPerMTok: 0.25,
    outputPerMTok: 1.25,
    cacheWritePerMTok: 0.3,
    cacheReadPerMTok: 0.03,
  },
};

/**
 * 모델 이름 별칭 → 정규 ID 매핑
 * Claude Code에서 전달되는 다양한 모델 이름 형태를 정규화
 */
const MODEL_ALIASES: Record<string, string> = {
  // Opus 4.6
  "opus": "claude-opus-4-6",
  "claude-opus-4-6": "claude-opus-4-6",
  "claude-opus-4.6": "claude-opus-4-6",

  // Opus 4
  "claude-opus-4": "claude-opus-4-20250514",
  "claude-4-opus": "claude-opus-4-20250514",

  // Sonnet 4
  "sonnet": "claude-sonnet-4-20250514",
  "claude-sonnet-4": "claude-sonnet-4-20250514",
  "claude-4-sonnet": "claude-sonnet-4-20250514",

  // 3.5 Sonnet
  "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",

  // 3.5 Haiku
  "haiku": "claude-3-5-haiku-20241022",
  "claude-3.5-haiku": "claude-3-5-haiku-20241022",
  "claude-3-5-haiku": "claude-3-5-haiku-20241022",

  // 3 Opus
  "claude-3-opus": "claude-3-opus-20240229",

  // 3 Sonnet
  "claude-3-sonnet": "claude-3-sonnet-20240229",

  // 3 Haiku
  "claude-3-haiku": "claude-3-haiku-20240307",
};

/**
 * 모델 이름을 정규화하여 pricing 테이블의 키로 변환
 * @param model - 원본 모델 이름 (e.g., "claude-sonnet-4", "claude-3-5-haiku-20241022")
 * @returns 정규화된 모델 ID 또는 null (매칭 실패 시)
 */
export function normalizeModelName(model: string): string | null {
  if (!model) return null;
  const lower = model.toLowerCase().trim();

  // 정확히 매칭되는 경우
  if (MODEL_PRICING[lower]) return lower;

  // 별칭 매칭
  if (MODEL_ALIASES[lower]) return MODEL_ALIASES[lower];

  // 부분 매칭: 모델 ID에 포함되는 경우 (가장 긴 매칭 우선)
  const keys = Object.keys(MODEL_PRICING).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key) || key.includes(lower)) {
      return key;
    }
  }

  // 별칭 키에서 부분 매칭
  const aliasKeys = Object.keys(MODEL_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliasKeys) {
    if (lower.includes(alias)) {
      return MODEL_ALIASES[alias];
    }
  }

  return null;
}

/**
 * 모델의 단가 정보를 조회
 * @returns ModelPricing 또는 null (알 수 없는 모델)
 */
export function getModelPricing(model: string): ModelPricing | null {
  const normalized = normalizeModelName(model);
  if (!normalized) return null;
  return MODEL_PRICING[normalized] ?? null;
}

/** 비용 계산 결과 */
export interface CostBreakdown {
  /** Input 토큰 비용 (USD) */
  inputCost: number;
  /** Output 토큰 비용 (USD) */
  outputCost: number;
  /** Cache Write 토큰 비용 (USD) */
  cacheWriteCost: number;
  /** Cache Read 토큰 비용 (USD) */
  cacheReadCost: number;
  /** 총 비용 (USD) */
  totalCost: number;
  /** 사용된 모델 이름 */
  model: string;
  /** 모델 표시 이름 */
  modelDisplayName: string;
  /** 알려진 모델인지 여부 */
  isKnownModel: boolean;
}

/**
 * 토큰 수에 기반한 비용 계산
 * @param model - 모델 이름
 * @param tokens - 토큰 사용량
 * @returns CostBreakdown
 */
export function calculateCost(
  model: string | null | undefined,
  tokens: {
    inputTokens: number;
    outputTokens: number;
    cacheWriteTokens?: number;
    cacheReadTokens?: number;
  }
): CostBreakdown {
  const pricing = model ? getModelPricing(model) : null;

  if (!pricing) {
    // 알 수 없는 모델: sonnet 4 가격을 기본값으로 사용 (가장 일반적인 모델)
    const fallback = MODEL_PRICING["claude-sonnet-4-20250514"];
    const inputCost = (tokens.inputTokens / 1_000_000) * fallback.inputPerMTok;
    const outputCost = (tokens.outputTokens / 1_000_000) * fallback.outputPerMTok;
    const cacheWriteCost = ((tokens.cacheWriteTokens ?? 0) / 1_000_000) * fallback.cacheWritePerMTok;
    const cacheReadCost = ((tokens.cacheReadTokens ?? 0) / 1_000_000) * fallback.cacheReadPerMTok;

    return {
      inputCost,
      outputCost,
      cacheWriteCost,
      cacheReadCost,
      totalCost: inputCost + outputCost + cacheWriteCost + cacheReadCost,
      model: model ?? "unknown",
      modelDisplayName: model ?? "Unknown Model",
      isKnownModel: false,
    };
  }

  const inputCost = (tokens.inputTokens / 1_000_000) * pricing.inputPerMTok;
  const outputCost = (tokens.outputTokens / 1_000_000) * pricing.outputPerMTok;
  const cacheWriteCost = ((tokens.cacheWriteTokens ?? 0) / 1_000_000) * pricing.cacheWritePerMTok;
  const cacheReadCost = ((tokens.cacheReadTokens ?? 0) / 1_000_000) * pricing.cacheReadPerMTok;

  return {
    inputCost,
    outputCost,
    cacheWriteCost,
    cacheReadCost,
    totalCost: inputCost + outputCost + cacheWriteCost + cacheReadCost,
    model: model!,
    modelDisplayName: pricing.displayName,
    isKnownModel: true,
  };
}

/**
 * 세션 데이터로 비용 계산
 */
export function calculateSessionCost(session: {
  model: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  total_cache_create_tokens: number | null;
  total_cache_read_tokens: number | null;
}): CostBreakdown {
  return calculateCost(session.model, {
    inputTokens: session.total_input_tokens ?? 0,
    outputTokens: session.total_output_tokens ?? 0,
    cacheWriteTokens: session.total_cache_create_tokens ?? 0,
    cacheReadTokens: session.total_cache_read_tokens ?? 0,
  });
}

/**
 * 금액 포맷팅 (USD)
 * @param amount - USD 금액
 * @returns 포맷팅된 문자열 (예: "$0.0012", "$1.50", "$12.34")
 */
export function formatCost(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}

/**
 * 지원되는 전체 모델 목록과 단가 정보 반환
 * UI에서 단가 테이블 표시용
 */
export function getAllModelPricing(): Array<ModelPricing & { modelId: string }> {
  // 중복 제거: displayName 기준으로 첫 번째 항목만
  const seen = new Set<string>();
  const result: Array<ModelPricing & { modelId: string }> = [];

  for (const [modelId, pricing] of Object.entries(MODEL_PRICING)) {
    if (!seen.has(pricing.displayName)) {
      seen.add(pricing.displayName);
      result.push({ ...pricing, modelId });
    }
  }

  // 단가 높은 순으로 정렬
  return result.sort((a, b) => b.inputPerMTok - a.inputPerMTok);
}
