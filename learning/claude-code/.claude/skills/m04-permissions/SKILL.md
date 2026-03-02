---
name: m04-permissions
description: "Claude Agent SDK M04 학습 모듈. permissionMode로 에이전트의 권한을 제어하고 안전장치를 구축한다. '/m04-permissions', 'M04 시작', 'permissions 학습' 요청에 사용."
---

# M04: Permissions — 권한과 안전장치

## STOP PROTOCOL

Phase A → ⛔ STOP → 학습자 응답 → Phase B. 절대 자동 진행하지 않는다.

---

## 학습 목표

- `permissionMode`의 종류와 차이를 이해한다
- `allowedTools` / `disallowedTools`로 세밀한 권한 제어를 할 수 있다
- 프로덕션에서의 안전장치 패턴을 이해한다
- `bypassPermissions`의 위험성과 적절한 사용 시점을 안다

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | Permission Mode 종류 — default, plan, bypass | `references/block0-permission-modes.md` |
| 1 | allowedTools/disallowedTools — 세밀한 제어 | `references/block1-tool-permissions.md` |
| 2 | 안전장치 패턴 — 프로덕션 시나리오 | `references/block2-safety-patterns.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 진행을 시작한다.
