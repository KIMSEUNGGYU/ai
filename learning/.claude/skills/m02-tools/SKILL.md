---
name: m02-tools
description: "Claude Agent SDK M02 학습 모듈. tools 옵션으로 에이전트에게 능력을 부여하고, 도구 선택 과정을 관찰한다. '/m02-tools', 'M02 시작', 'tools 학습' 요청에 사용."
---

# M02: Tools — 에이전트에게 능력 부여

## STOP PROTOCOL

이 교안은 **2단계 인터랙티브 진행**을 따른다.

### Phase A (첫 턴)
1. 현재 Block의 **개념 설명**을 제시한다
2. 학습자에게 **코드를 작성하거나 실행**하도록 안내한다
3. 관찰 포인트를 제시한다
4. **⛔ STOP** — 학습자의 실행 결과 또는 응답을 기다린다

### Phase B (학습자 응답 후)
1. 학습자의 관찰/답변에 대해 **피드백**을 제공한다
2. 핵심 인사이트를 정리한다
3. **퀴즈** 1~2개를 제시한다
4. 다음 Block으로 안내한다

> 절대 Phase A에서 Phase B로 자동 진행하지 않는다.

---

## 학습 목표

- `tools` 옵션으로 에이전트의 능력을 제어할 수 있다
- `tools` vs `allowedTools` vs `disallowedTools`의 차이를 이해한다
- 에이전트가 도구를 스스로 선택하는 과정을 관찰한다
- `tool_use` → `tool_result` 메시지 흐름을 이해한다

## 사전 조건

- M01 완료
- `npm install` 완료

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | 도구의 3가지 옵션 — tools, allowedTools, disallowedTools | `references/block0-tool-options.md` |
| 1 | 파일 탐색 에이전트 — Read + Glob 도구 부여 | `references/block1-file-explorer.md` |
| 2 | 도구 선택 관찰 — 에이전트의 자율적 판단 | `references/block2-tool-selection.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 `references/block0-tool-options.md`를 읽고 Phase A를 시작한다.
