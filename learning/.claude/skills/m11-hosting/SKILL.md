---
name: m11-hosting
description: "Claude Agent SDK M11 학습 모듈. 비용 추적, 프로덕션 배포, 에러 핸들링 패턴을 다룬다. '/m11-hosting', 'M11 시작', 'hosting 학습' 요청에 사용."
---

# M11: Hosting — 프로덕션 배포

## STOP PROTOCOL

Phase A → ⛔ STOP → 학습자 응답 → Phase B. 절대 자동 진행하지 않는다.

---

## 학습 목표

- `result` 메시지에서 비용과 성능 지표를 추적할 수 있다
- 프로덕션 환경에서의 에러 핸들링 패턴을 이해한다
- 에이전트를 서버/크론잡/CI에 통합하는 방법을 안다
- SDK의 비용 모델과 최적화 전략을 이해한다

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | 비용 추적 — total_cost_usd, 토큰 최적화 | `references/block0-cost-tracking.md` |
| 1 | 에러 핸들링 — 재시도, 타임아웃, 폴백 | `references/block1-error-handling.md` |
| 2 | 배포 패턴 — 서버, 크론잡, CI/CD | `references/block2-deployment.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 진행을 시작한다.
