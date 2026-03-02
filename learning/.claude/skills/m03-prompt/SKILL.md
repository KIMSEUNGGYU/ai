---
name: m03-prompt
description: "Claude Agent SDK M03 학습 모듈. systemPrompt로 에이전트의 역할을 정의하고 행동 변화를 관찰한다. '/m03-prompt', 'M03 시작', 'system prompt 학습' 요청에 사용."
---

# M03: System Prompt — 역할 정의

## STOP PROTOCOL

Phase A → ⛔ STOP → 학습자 응답 → Phase B. 절대 자동 진행하지 않는다.

---

## 학습 목표

- `systemPrompt` 옵션으로 에이전트의 역할을 정의할 수 있다
- 같은 도구인데 프롬프트에 따라 행동이 달라지는 것을 관찰한다
- 좋은 System Prompt의 구조 (역할 + 관점 + 출력 형식)를 이해한다
- 플러그인의 `agents/*.md` 본문이 곧 systemPrompt라는 것을 안다

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | System Prompt의 구조 — 역할/관점/출력형식 | `references/block0-prompt-structure.md` |
| 1 | 코드 리뷰어 에이전트 만들기 | `references/block1-code-reviewer.md` |
| 2 | 프롬프트 변경 실험 — 같은 도구, 다른 행동 | `references/block2-prompt-experiment.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 진행을 시작한다.
