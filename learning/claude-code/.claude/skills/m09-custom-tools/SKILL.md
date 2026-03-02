---
name: m09-custom-tools
description: "Claude Agent SDK M09 학습 모듈. 커스텀 도구를 정의하여 에이전트에게 고유한 능력을 부여한다. '/m09-custom-tools', 'M09 시작', 'custom tools 학습' 요청에 사용."
---

# M09: Custom Tools — 나만의 도구 만들기

## STOP PROTOCOL

Phase A → ⛔ STOP → 학습자 응답 → Phase B. 절대 자동 진행하지 않는다.

---

## 학습 목표

- 커스텀 도구의 정의 구조 (name, description, inputSchema, handler)를 이해한다
- 에이전트에게 비즈니스 로직을 도구로 노출할 수 있다
- 빌트인 도구와 커스텀 도구를 조합하는 패턴을 이해한다

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | 커스텀 도구 구조 — name, description, schema | `references/block0-tool-definition.md` |
| 1 | 첫 커스텀 도구 — 현재 시간 반환 도구 | `references/block1-first-custom-tool.md` |
| 2 | 복합 도구 — API 호출 + 데이터 변환 | `references/block2-complex-tools.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 진행을 시작한다.
