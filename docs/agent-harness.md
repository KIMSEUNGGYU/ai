---
tags:
  - project
  - ai
  - agent
  - harness
date: 2026-02-23
status: active
---

# Agent Harness 구축

> Claude Agent SDK로 하네스를 직접 구축하며 에이전트 시스템 이해하기

## 개요

- **노트**: `~/hq/15_Projects/agent-harness/` (여기)
- **코드**: `~/dev/agent-harness/`
- **상태**: active
- **스택**: TypeScript, Claude Agent SDK, MCP

## 진행 상태

### Part 1: 에이전트 루프 기초

| # | 파일 | 주제 | 상태 |
|:-:|------|------|:----:|
| 1 | `step1-hello.ts` | Hello World — 에이전트 루프 | 코드 ✅ / 실행 ⏳ |
| 2 | `step2-tools.ts` | Tools — 능력 부여 | ⬜ |

### Part 2: 에이전트 성격과 감시

|  #  | 파일                | 주제                    | 상태  |
| :-: | ----------------- | --------------------- | :-: |
|  3  | `step3-prompt.ts` | System Prompt — 역할 정의 |  ⬜  |
|  4  | `step4-hooks.ts`  | Hooks — 감사 로그         |  ⬜  |

### Part 3: 멀티에이전트

|  #  | 파일                   | 주제                   | 상태  |
| :-: | -------------------- | -------------------- | :-: |
|  5  | `step5-subagents.ts` | Subagents — 병렬 코드 분석 |  ⬜  |
|  6  | `step6-sessions.ts`  | Sessions — 대화 이어가기   |  ⬜  |

### Part 4: 확장과 통합

|  #  | 파일                 | 주제              | 상태  |
| :-: | ------------------ | --------------- | :-: |
|  7  | `step7-mcp.ts`     | MCP — 웹 자동화     |  ⬜  |
|  8  | `step8-harness.ts` | 나만의 하네스 — 전체 통합 |  ⬜  |

## 핵심 개념 (5축)

```
Tools(능력) + Prompt(성격) + Hooks(감시) + Subagents(위임) + Sessions(기억)
```

## 관련 자료

| 자료                 | 위치                                    |
| ------------------ | ------------------------------------- |
| 실습 코드              | `~/dev/agent-harness/`                |
| 코드 README          | [[README]]                            |
| 튜토리얼 (미션별 상세)      | [[tutorial]]                          |
| SDK 레퍼런스           | [[ai-agent-harness-claude-agent-sdk]] |
| Agentic 시스템 & Eval | [[99. AI Agentic 시스템 & Eval Harness]]     |
| Ouroboros 분석       | [[ouroboros-deep-analysis]]           |
| 컨텍스트 관리 정리         | [[Agentic AI와 컨텍스트 관리 정리]]            |
| 세션 연속성 설계          | [[Claude Code 세션 연속성 워크플로우 설계]]       |
| Hook 출력 채널         | [[Claude Code Hook 출력 채널 정리]]         |
| 내부 데이터 구조          | [[Claude Code 내부 데이터 관리 구조]]          |

## 다음 액션

- [ ] step1-hello.ts 실행 확인
- [ ] step2-tools.ts 작성

## 메모

- 비용: 전체 실습 예상 < $1 (haiku 사용 시 추가 절약)
- API 키: console.anthropic.com (구독과 별도)
