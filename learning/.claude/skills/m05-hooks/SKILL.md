---
name: m05-hooks
description: "Claude Agent SDK M05 학습 모듈. hooks로 에이전트 라이프사이클에 개입하여 감사 로그와 도구 차단을 구현한다. '/m05-hooks', 'M05 시작', 'hooks 학습' 요청에 사용."
---

# M05: Hooks — 라이프사이클 개입

## STOP PROTOCOL

Phase A → ⛔ STOP → 학습자 응답 → Phase B. 절대 자동 진행하지 않는다.

---

## 학습 목표

- `hooks` 옵션으로 에이전트 라이프사이클에 개입할 수 있다
- `PreToolUse` / `PostToolUse` / `Stop` 훅의 차이를 이해한다
- 감사 로그(audit log) 패턴을 구현할 수 있다
- `PreToolUse`로 도구 사용을 차단하는 안전장치를 만들 수 있다
- 플러그인 훅(`.claude/hooks/`) vs SDK 훅의 차이를 안다

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | 훅 시점과 구조 — PreToolUse, PostToolUse, Stop | `references/block0-hook-lifecycle.md` |
| 1 | 감사 로그 — PostToolUse로 모든 도구 사용 기록 | `references/block1-audit-log.md` |
| 2 | 도구 차단 — PreToolUse로 안전장치 구현 | `references/block2-tool-blocking.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 진행을 시작한다.
