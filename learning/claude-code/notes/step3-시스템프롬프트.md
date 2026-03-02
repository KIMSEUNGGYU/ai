---
tags:
  - ai-agent
  - claude-agent-sdk
  - system-prompt
date: 2026-03-01
step: 3
---

# Step 3: System Prompt — 역할 정의

## 배운 것

- `systemPrompt`로 에이전트의 "무엇을 볼지"와 "어떻게 출력할지"를 결정
- 같은 도구(Read, Glob, Grep)인데 Step 2(의존성 나열)와 Step 3(구조화된 코드 리뷰)이 완전히 다른 행동
- 플러그인의 `agents/*.md` 본문 = SDK의 `systemPrompt` 옵션

## 핵심 인사이트

### System Prompt는 가이드이지 템플릿이 아니다

프롬프트에서 "1. 에러 핸들링 2. 타입 안전성 3. 개선 제안" 순서로 지시했지만:
- LLM이 심각도 순으로 **재정렬** (타입→에러→안전성)
- 요청 안 한 섹션 **추가** (긍정적 측면, 권장사항 우선순위)
- **매 실행마다 다른 구조** — 같은 프롬프트여도 비결정적

→ 정확한 형식이 필요하면 "반드시 이 형식을 따르세요" + few-shot 예시 필요

### 메시지 스트리밍 구조 발견

assistant 메시지가 한 턴에 2번 옴 — 스트리밍 초기 `(empty)` → 내용 확정 후 재전송:

```
🤖 [2] assistant | (empty)         ← 스트리밍 시작
🤖 [3] assistant | tools: [Glob]   ← 도구 호출 확정
👤 [5] user                        ← SDK가 tool_result 피드백
```

초기 코드에서 `if (text)` 조건 때문에 empty 메시지가 숨겨져서 번호가 점프하는 것처럼 보였음.

### 맥락 없는 프롬프트의 한계

학습용 코드인 step1-hello.ts를 리뷰시켰더니 프로덕션 기준으로 `as any`를 🔴 Critical로 판정.
"이 코드는 학습용이다"라는 맥락을 주지 않으면 LLM은 자기 기준으로 판단.

## 비용

- Haiku 모델, 3턴: ~$0.10 (리뷰 출력이 길어서 Step 2의 ~$0.01보다 높음)

## 다음 스텝

Step 4: Hooks — 에이전트 루프의 특정 시점에 개입하는 콜백. 도구 사용 감사 로그, 위험 명령 차단.
