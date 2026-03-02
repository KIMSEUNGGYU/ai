---
name: m01-hello-agent
description: "Claude Agent SDK M01 학습 모듈. query()로 첫 에이전트를 실행하고 메시지 스트림을 분석한다. '/m01-hello-agent', 'M01 시작', 'hello agent' 요청에 사용."
---

# M01: Hello Agent — 설치와 첫 실행

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

> 절대 Phase A에서 Phase B로 자동 진행하지 않는다. 반드시 학습자의 응답을 기다린다.

---

## 학습 목표

이 모듈을 완료하면:
- `query()` 함수로 에이전트 루프를 시작할 수 있다
- 메시지 스트림의 타입별 구조를 이해한다 (system, assistant, result)
- SDK가 내부적으로 Claude Code CLI를 실행한다는 것을 안다

## 사전 조건

- Node.js 18+ 설치
- Claude Code CLI 설치 및 인증 완료
- `~/hq/20_Learn/claude-code/` 에서 `npm install` 완료

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | 환경 설정 — SDK 설치와 프로젝트 확인 | `references/block0-setup.md` |
| 1 | 첫 에이전트 — query()로 에이전트 실행 | `references/block1-first-agent.md` |
| 2 | 메시지 스트림 — 타입별 핸들링과 분석 | `references/block2-message-stream.md` |

## 진행 방법

Block 0부터 순서대로 진행한다. 각 Block에서:
1. reference 파일을 읽고 Phase A를 진행한다
2. 학습자가 코드를 실행하고 결과를 공유하면 Phase B를 진행한다
3. 모든 Block 완료 후, 학습 노트를 `notes/m01-hello-agent.md`에 정리한다

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 `references/block0-setup.md`를 읽고 Phase A를 시작한다.
