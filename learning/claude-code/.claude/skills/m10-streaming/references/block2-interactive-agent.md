# Block 2: 대화형 에이전트 설계

## Phase A — 설계

### 패턴: 대화형 에이전트 UX

**패턴 1: CLI 대화형 루프**

```typescript
const rl = readline.createInterface({ input: stdin, output: stdout });

while (true) {
  const userPrompt = await rl.question("\n💬 질문: ");
  if (userPrompt === "exit") break;

  for await (const message of query({
    prompt: userPrompt,
    options: { resume: sessionId, tools: ["Read", "Glob"], ... },
  })) {
    // 세션을 유지하면서 대화 계속
    if (msg.type === "system") sessionId = msg.session_id;
    if (msg.type === "assistant") printAssistantMessage(msg);
  }
}
```

**패턴 2: 진행 상황 표시**

```typescript
for await (const message of query({ ... })) {
  const msg = message as any;

  switch (msg.type) {
    case "system":
      console.log("🚀 에이전트 시작...");
      break;
    case "assistant":
      const toolUses = msg.message?.content?.filter((c: any) => c.type === "tool_use");
      if (toolUses?.length) {
        for (const tu of toolUses) {
          console.log(`  ⏳ ${tu.name} 실행 중...`);
        }
      }
      break;
    case "result":
      if (msg.subtype === "success") console.log("✅ 완료!");
      else console.log("❌ 실패:", msg.result);
      break;
  }
}
```

### 설계 과제

다음 대화형 에이전트의 UX를 설계해보자:

**"코드 디버깅 어시스턴트"**
- 사용자가 에러 메시지를 입력
- 에이전트가 관련 파일을 탐색하고 원인을 분석
- 수정 제안을 하기 전에 사용자에게 확인
- 수정 후 테스트 실행 결과를 보여줌

스트리밍 메시지를 어떻게 표시하고, 사용자 입력을 어디서 받을지 설계해보자.

> ⛔ **STOP** — 디버깅 어시스턴트의 UX 설계를 공유해주세요.

---

## Phase B — 피드백 + 종합

### 디버깅 어시스턴트 UX 예시

```
💬 에러: TypeError: Cannot read properties of undefined
🔍 관련 파일 탐색 중...
  ⏳ Grep 실행: "undefined" 패턴 검색
  ⏳ Read 실행: src/utils.ts
📊 분석 결과:
  - 원인: utils.ts:42에서 null 체크 누락
  - 해당 코드: data.user.name (data.user가 undefined일 수 있음)

❓ 수정을 적용할까요? (y/n): y

  ⏳ Edit 실행: src/utils.ts
  ⏳ Bash 실행: npm test
✅ 수정 완료! 테스트 통과 (4/4)
```

### M10 종합 퀴즈

**Q1**: 스트리밍과 세션(resume)을 결합하면 어떤 패턴이 가능해지는가?

**Q2**: 에이전트가 10분 이상 실행되면 어떻게 되는가? 타임아웃이 있는가?

### 정답 가이드

- Q1: CLI 대화형 루프 — 사용자가 질문 → 에이전트가 답변(스트리밍) → 같은 세션에서 후속 질문. Claude Code의 실제 동작 방식
- Q2: SDK에 기본 타임아웃 설정이 있을 수 있음. 장시간 작업은 세션 분할이 권장

### 학습 노트

```
notes/m10-streaming.md에 정리:
- 스트리밍 메시지 타입 전체 목록
- 실시간 처리 패턴 (프로그레스 바, 필터링)
- userInput 콜백 구현
- 대화형 에이전트 UX 패턴
- 스트리밍 + 세션 결합
```

> M10 완료! 다음 **M11: Hosting**에서 프로덕션 배포를 다룹니다. `/m11-hosting`을 호출하세요.
