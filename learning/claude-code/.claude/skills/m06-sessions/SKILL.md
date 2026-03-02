---
name: m06-sessions
description: "Claude Agent SDK M06 학습 모듈. session_id를 캡처하고 resume으로 대화 맥락을 유지한다. '/m06-sessions', 'M06 시작', 'sessions 학습' 요청에 사용."
---

# M06: Sessions — 기억과 맥락 유지

## STOP PROTOCOL

Phase A → ⛔ STOP → 학습자 응답 → Phase B. 절대 자동 진행하지 않는다.

---

## 학습 목표

- `system/init` 메시지에서 session_id를 캡처할 수 있다
- `resume` 옵션으로 이전 대화 맥락을 유지할 수 있다
- 세션의 실용적 활용 패턴 (멀티스텝, 피드백 루프)을 이해한다

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | 세션 개념 — 에이전트의 기억 장치 | `references/block0-session-concept.md` |
| 1 | 세션 이어가기 — session_id 캡처 + resume | `references/block1-session-resume.md` |
| 2 | 멀티스텝 워크플로우 — 세션 활용 패턴 | `references/block2-multi-step.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 진행을 시작한다.
