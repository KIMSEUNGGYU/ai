import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeScoreFromReview, evaluateReview } from "../evaluators/review-eval.js";

describe("computeScoreFromReview", () => {
  it("이슈 없음 → 100점", () => {
    assert.equal(computeScoreFromReview("리뷰 통과. 이슈 없음."), 100);
  });

  it("HIGH 1개 → 85점", () => {
    assert.equal(
      computeScoreFromReview("- [HIGH] utils.ts:5 — staleTime 미설정"),
      85
    );
  });

  it("CRITICAL 1개 → 70점", () => {
    assert.equal(
      computeScoreFromReview("- [CRITICAL] api.ts:10 — 직접 fetch 사용"),
      70
    );
  });

  it("MEDIUM 2개 → 90점", () => {
    assert.equal(
      computeScoreFromReview(
        "- [MEDIUM] utils.ts:1 — 네이밍\n- [MEDIUM] utils.ts:5 — 폴더 위치"
      ),
      90
    );
  });

  it("CRITICAL 1 + HIGH 2 + MEDIUM 1 → 최대 차감", () => {
    const output = [
      "- [CRITICAL] api.ts:10 — 직접 fetch",
      "- [HIGH] query.ts:5 — queryKey 비계층적",
      "- [HIGH] hook.ts:3 — 명령형 로딩 분기",
      "- [MEDIUM] util.ts:1 — 네이밍",
    ].join("\n");
    // 100 - 30 - 15 - 15 - 5 = 35
    assert.equal(computeScoreFromReview(output), 35);
  });

  it("대량 이슈 → 0점 (음수 방지)", () => {
    const output = Array(5)
      .fill("- [CRITICAL] x.ts:1 — 위반")
      .join("\n");
    // 100 - 150 = -50 → max(0, -50) = 0
    assert.equal(computeScoreFromReview(output), 0);
  });

  it("대소문자 혼용 처리", () => {
    assert.equal(
      computeScoreFromReview("- [critical] a.ts:1 — 문제\n- [High] b.ts:2 — 문제"),
      55 // 100 - 30 - 15
    );
  });
});

describe("evaluateReview", () => {
  it("이슈 없음 → pass", () => {
    const result = evaluateReview("리뷰 통과. 이슈 없음.");
    assert.equal(result.pass, true);
  });

  it("CRITICAL 있으면 → fail", () => {
    const result = evaluateReview("- [CRITICAL] api.ts:10 — 직접 fetch");
    assert.equal(result.pass, false);
    assert.ok(result.feedback.includes("CRITICAL"));
  });

  it("HIGH 있으면 → fail", () => {
    const result = evaluateReview("- [HIGH] hook.ts:3 — 명령형 로딩");
    assert.equal(result.pass, false);
    assert.ok(result.feedback.includes("HIGH"));
  });

  it("MEDIUM만 있으면 → pass", () => {
    const result = evaluateReview("- [MEDIUM] util.ts:1 — 네이밍 개선");
    assert.equal(result.pass, true);
  });

  it("MEDIUM 4개 이상이어도 pass (fewMedium은 통과/실패에 영향 안 줌)", () => {
    const output = Array(5)
      .fill("- [MEDIUM] x.ts:1 — 스타일")
      .join("\n");
    const result = evaluateReview(output);
    assert.equal(result.pass, true);
  });
});
