---
title: 멀티모델 오케스트레이션 설계
status: backlog
created: 2026-03-08
last-active: 2026-03-08
tags: [design, multi-model, codex, review]
---

# 멀티모델 오케스트레이션 설계

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Claude(구현/설계) + Codex(리뷰/반박) 멀티모델 구조로 편향 방지 및 토큰 분배

**Architecture:** Claude Code가 메인 오케스트레이터. 리뷰/검증/반박 계열 작업 시 `codex exec`를 bash로 호출하여 다른 모델의 관점을 확보. Codex는 ChatGPT 구독 계정 사용 (API 키 불필요).

**Tech Stack:** Claude Code, OpenAI Codex CLI (`codex exec`), bash 래퍼 스크립트

---

## 핵심 원칙

- **구현/설계/분석** → Claude (메인)
- **리뷰/반박/검증** → Codex (편향 방지)
- 같은 모델이 구현 + 리뷰하면 편향 → 다른 모델이 리뷰

---

## Phase 1: 인프라 — Codex exec 래퍼

### Task 1-1: Codex CLI 설치 및 인증

**Step 1: 설치**
```bash
npm i -g @openai/codex
```

**Step 2: 인증 확인**
```bash
codex exec "say hello"
```
ChatGPT 구독 계정으로 인증 (API 키 불필요).

**Step 3: 동작 확인**
```bash
codex exec --json "이 텍스트를 분석해줘: 테스트 메시지"
```

---

### Task 1-2: 공통 래퍼 스크립트 생성

**Files:**
- Create: `plugins/fe-workflow/hooks/scripts/codex-review.sh`

래퍼 역할:
- conventions 파일 내용을 프롬프트에 주입
- `codex exec`의 stdout에서 최종 응답 파싱
- 에러 처리 (codex 미설치, 인증 실패 등 → Claude fallback)

```bash
#!/usr/bin/env bash
# codex-review.sh — Codex exec 래퍼
# Usage: codex-review.sh <prompt-file> [--schema <schema-file>]

PROMPT_FILE="$1"
SCHEMA_FILE="${3:-}"

if ! command -v codex &>/dev/null; then
  echo '{"error": "codex not installed", "fallback": true}' >&2
  exit 1
fi

ARGS=(exec --full-auto)
if [[ -n "$SCHEMA_FILE" ]]; then
  ARGS+=(--output-schema "$SCHEMA_FILE")
fi

codex "${ARGS[@]}" "$(cat "$PROMPT_FILE")"
```

**Step: 실행 권한 부여**
```bash
chmod +x plugins/fe-workflow/hooks/scripts/codex-review.sh
```

---

### Task 1-3: 리뷰 출력 JSON Schema 정의

**Files:**
- Create: `plugins/fe-workflow/schemas/review-output.json`

```json
{
  "type": "object",
  "properties": {
    "score": {
      "type": "object",
      "properties": {
        "readability": { "type": "number" },
        "maintainability": { "type": "number" },
        "performance": { "type": "number" },
        "conventions": { "type": "number" },
        "architecture": { "type": "number" }
      }
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "enum": ["must", "should", "nit"] },
          "file": { "type": "string" },
          "line": { "type": "number" },
          "message": { "type": "string" },
          "suggestion": { "type": "string" }
        }
      }
    },
    "challenges": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Devil's advocate 질문들 — '왜 이렇게?', '다른 방법은?'"
    }
  }
}
```

---

## Phase 2: fe-workflow 코드 리뷰 전환

### Task 2-1: `/fe:review` 커맨드에 Codex 옵션 추가

**Files:**
- Modify: `plugins/fe-workflow/commands/review.md`

변경 사항:
- 기존 Claude code-reviewer 에이전트 호출 유지 (fallback)
- Codex 사용 가능 시 `codex-review.sh`로 리뷰 실행
- conventions 파일 내용을 프롬프트에 포함
- 결과를 기존 리뷰 포맷으로 변환하여 출력

---

### Task 2-2: conventions 주입 방식 설계

Codex는 파일 시스템 접근이 다르므로:
- conventions 파일 내용을 **프롬프트 텍스트에 인라인 포함**
- diff/변경 코드도 프롬프트에 포함
- 프롬프트 조립은 래퍼 스크립트가 담당

---

### Task 2-3: Fallback 구조

```
/fe:review 실행
    ↓
codex 설치됨?
    ├→ YES: codex-review.sh 실행
    │       ├→ 성공: Codex 리뷰 결과 출력
    │       └→ 실패: Claude code-reviewer fallback
    └→ NO: Claude code-reviewer (기존 방식)
```

---

## Phase 3: Devil's Advocate 에이전트

### Task 3-1: 반박 프롬프트 템플릿

**Files:**
- Create: `plugins/fe-workflow/templates/devils-advocate.md`

```markdown
당신은 시니어 엔지니어이자 Devil's Advocate입니다.
아래 코드 변경/설계를 비판적으로 검토하세요.

규칙:
- 모든 결정에 "왜?"라고 질문하세요
- 대안을 최소 1개 제시하세요
- 잠재적 문제점을 찾으세요
- 칭찬은 최소화하고 개선점에 집중하세요

{conventions}

{code_or_design}
```

---

### Task 3-2: 리뷰 계열 작업에 자동 통합

`/fe:review` 실행 시:
1. Codex가 코드 리뷰 수행 (Phase 2)
2. 동시에 Devil's Advocate 질문 생성 (`challenges` 필드)
3. 리뷰 결과 + 반박 질문을 함께 출력

→ Phase 2의 review-output.json에 `challenges` 필드가 이미 포함되어 있으므로 별도 호출 불필요. 리뷰 프롬프트에 반박 지시를 포함하면 됨.

---

### Task 3-3: plugin.json 버전 올리기 + 커밋

**Files:**
- Modify: `plugins/fe-workflow/.claude-plugin/plugin.json` (minor bump)

---

## 백로그

- [ ] **Gemini 추가** — 구현 분담 (아이디어 구체화 후)
  - 가능한 역할: FE 코드 생성, 테스트 작성, 문서 생성
  - `gemini` CLI 또는 API 방식 검토 필요
  - 트리거 조건 및 오케스트레이션 방식 설계 필요

---

## 참고: 현재 플러그인 구조

### session-manager (v0.9.0)
- Codex 전환 대상 없음 — 자가학습 분류는 편향과 무관
- 현재 구조 유지

### fe-workflow (v0.18.1)
- `/fe:review` → Codex 전환 대상
- `/fe:architecture` → Claude 유지 (설계)
- `/fe:api-integrate` → Claude 유지 (구현)
