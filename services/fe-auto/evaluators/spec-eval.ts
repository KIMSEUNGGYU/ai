import type { EvalResult } from "../types.js";

/** 스펙 문서 평가 — 구조화 품질 체크 */
export function evaluateSpec(spec: string): EvalResult {
  const checks = {
    // 필수 섹션 존재
    hasRequirements: /##.*요구사항/i.test(spec),
    hasComponents: /##.*컴포넌트/i.test(spec),
    hasApi: /##.*API/i.test(spec),
    hasStructure: /##.*폴더/i.test(spec),
    hasScopeOut: /##.*스코프\s*아웃/i.test(spec),
    hasOpenQuestions: /##.*확인\s*필요/i.test(spec),

    // 구조적 품질
    hasPriorityTags:
      /\[MUST\]/i.test(spec) || /\[SHOULD\]/i.test(spec),
    hasComponentTree:
      /├──|└──/.test(spec) && /props:/i.test(spec),
    hasApiSignature:
      /(GET|POST|PUT|DELETE|PATCH)\s+\//.test(spec),
  };

  const missing: string[] = [];
  const quality: string[] = [];

  // 필수 섹션
  if (!checks.hasRequirements) missing.push("요구사항 섹션");
  if (!checks.hasComponents) missing.push("컴포넌트 구조 섹션");
  if (!checks.hasApi) missing.push("API 계약 섹션");
  if (!checks.hasStructure) missing.push("폴더 구조 섹션");
  if (!checks.hasScopeOut) missing.push("스코프 아웃 섹션");
  if (!checks.hasOpenQuestions) missing.push("확인 필요 섹션");

  // 구조적 품질 (경고)
  if (!checks.hasPriorityTags)
    quality.push("요구사항에 [MUST]/[SHOULD]/[MAY] 태그 필요");
  if (!checks.hasComponentTree)
    quality.push("컴포넌트 구조를 ASCII 트리(├──) + props로 작성 필요");
  if (!checks.hasApiSignature)
    quality.push("API 계약에 HTTP 메서드 + 경로 형식 필요 (GET /api/...)");

  const sectionLog = Object.entries(checks)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`  스펙 평가: ${sectionLog}`);

  // 필수 섹션 누락 → 실패
  if (missing.length > 0) {
    return {
      pass: false,
      feedback: `스펙 불완전.\n누락 섹션: ${missing.join(", ")}\n반드시 모든 6개 섹션(요구사항, 컴포넌트 구조, API 계약, 폴더 구조, 스코프 아웃, 확인 필요)을 포함하세요.`,
      details: checks,
    };
  }

  // 품질 미달 → 실패 (1회 보완 기회)
  if (quality.length > 0) {
    return {
      pass: false,
      feedback: `섹션은 모두 있지만 구조적 품질 개선 필요:\n${quality.map((q) => `- ${q}`).join("\n")}\n위 포맷에 맞춰 보완하세요.`,
      details: checks,
    };
  }

  return { pass: true, feedback: "", details: checks };
}
