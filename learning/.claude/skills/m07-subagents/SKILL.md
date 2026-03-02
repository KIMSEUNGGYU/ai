---
name: m07-subagents
description: "Claude Agent SDK M07 학습 모듈. agents 옵션으로 서브에이전트를 정의하고 작업을 위임한다. '/m07-subagents', 'M07 시작', 'subagents 학습' 요청에 사용."
---

# M07: Subagents — 작업 위임과 병렬 처리

## STOP PROTOCOL

Phase A → ⛔ STOP → 학습자 응답 → Phase B. 절대 자동 진행하지 않는다.

---

## 학습 목표

- `agents` 옵션으로 커스텀 서브에이전트를 정의할 수 있다
- 메인 에이전트가 서브에이전트에게 작업을 위임하는 과정을 이해한다
- 서브에이전트의 독립된 컨텍스트 개념을 체감한다
- 플러그인의 `agents/*.md`와 SDK `agents` 옵션의 관계를 안다

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | 서브에이전트 개념 — 독립 컨텍스트 위임 | `references/block0-subagent-concept.md` |
| 1 | 커스텀 서브에이전트 정의 + 위임 | `references/block1-custom-subagent.md` |
| 2 | 멀티 서브에이전트 — 역할 분담 | `references/block2-multi-subagent.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 진행을 시작한다.
