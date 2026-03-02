# Block 2: 구현 + 회고

## Phase A — 구현

### 도전: 나만의 하네스 구현

Block 1에서 설계한 구조를 `src/m12-integration/integration.ts`에 구현한다.

기본 스켈레톤:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

// 평가 함수
function evaluateReview(result: string) {
  const hasCodeExamples = result.includes("```");
  const hasSeverity = /심각|중요|낮음|높음/i.test(result);
  const hasSuggestions = result.includes("제안") || result.includes("개선");

  if (hasCodeExamples && hasSeverity && hasSuggestions) {
    return { pass: true, feedback: "" };
  }
  return {
    pass: false,
    feedback: `누락: ${!hasCodeExamples ? "코드 예시 " : ""}${!hasSeverity ? "심각도 " : ""}${!hasSuggestions ? "개선 제안" : ""}`,
  };
}

// 감사 로그 훅
async function auditLogger(input: any) {
  const log = `${new Date().toISOString()} | ${input.tool_name}\n`;
  await appendFile("./review-audit.log", log);
  return {};
}

async function main() {
  const targetFile = "src/m01-hello/hello.ts";
  let sessionId: string | undefined;
  let result = "";
  const maxAttempts = 3;
  let totalCost = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n=== 리뷰 시도 ${attempt}/${maxAttempts} ===\n`);

    const prompt = attempt === 1
      ? `${targetFile} 파일을 리뷰해줘. 코드 예시, 심각도 등급, 개선 제안을 반드시 포함해.`
      : `이전 리뷰에 다음이 누락되었습니다: ${evaluateReview(result).feedback}. 보완해줘.`;

    for await (const message of query({
      prompt,
      options: {
        ...(sessionId ? { resume: sessionId } : {}),
        systemPrompt: `시니어 TypeScript 코드 리뷰어.
각 이슈에 [심각|중요|낮음] 등급을 표시하고,
구체적인 코드 예시와 개선 제안을 포함하세요.`,
        tools: ["Read", "Glob", "Grep"],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        hooks: {
          PostToolUse: [
            { matcher: ".*", hooks: [auditLogger] }
          ],
        },
      },
    })) {
      const msg = message as any;
      if (msg.type === "system" && msg.subtype === "init") {
        sessionId = msg.session_id;
      }
      if (msg.type === "assistant") {
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        if (text) result = text;
      }
      if (msg.type === "result") {
        totalCost += msg.total_cost_usd;
        console.log(`  💰 이번 비용: $${msg.total_cost_usd}`);
      }
    }

    const evaluation = evaluateReview(result);
    if (evaluation.pass) {
      console.log(`\n✅ 리뷰 통과! (${attempt}번째 시도)`);
      break;
    } else {
      console.log(`  ❌ 평가 실패: ${evaluation.feedback}`);
      if (attempt === maxAttempts) {
        console.log(`  ⚠️ 최대 시도 횟수 초과. 마지막 결과를 사용합니다.`);
      }
    }
  }

  console.log(`\n${"═".repeat(40)}`);
  console.log(`📊 최종 리뷰 결과:`);
  console.log(result.slice(0, 500));
  console.log(`\n💰 총 비용: $${totalCost.toFixed(4)}`);
}

main().catch(console.error);
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m12-integration/integration.ts
```

### 관찰 포인트

1. 평가 루프가 몇 번 반복되는가?
2. 2번째 시도에서 누락 항목이 보완되는가?
3. 세션(resume)으로 이전 맥락을 기억하는가?
4. 감사 로그(review-audit.log)에 도구 사용 기록이 남는가?
5. 총 비용은 1회 리뷰 대비 얼마나 증가하는가?

> ⛔ **STOP** — 통합 시스템 실행 결과와 관찰을 공유해주세요.

---

## Phase B — 회고 + 종합

### 전체 커리큘럼 회고

M01~M12를 통해 배운 **하네스의 5축**:

```
         Tools (M02, M09)
            │
Hooks (M05) ┼ Subagents (M07)
            │
  Prompt (M03) ┼ Sessions (M06)

+ Permissions (M04) + MCP (M08) + Streaming (M10)
+ Hosting (M11) + 평가 루프 (M12)
```

### 핵심 인사이트

> **하네스 = Tools + Prompt + Hooks + Subagents + Sessions**
>
> 플러그인은 "남의 하네스에 부품 꽂기". SDK는 "하네스 자체를 구축".
> 평가 루프는 SDK만의 고유 가치. 에이전트의 결과를 프로그래밍으로 검증하고,
> 기준에 미달하면 자동으로 개선을 요청할 수 있다.

### M12 종합 퀴즈

**Q1**: 이 시스템을 CI/CD에 통합하려면 어떤 변경이 필요한가?

**Q2**: 평가 함수를 더 정교하게 만들 수 있는 방법은?

**Q3**: 이 시스템의 비용을 50% 줄이려면?

### 정답 가이드

- Q1: (1) 환경변수로 대상 파일 지정, (2) 결과를 PR 코멘트로 출력, (3) exit code로 pass/fail 전달
- Q2: (1) AST 파싱으로 코드 블록 검증, (2) 다른 에이전트를 평가자로, (3) 과거 리뷰와 비교
- Q3: (1) `model: "haiku"`, (2) maxAttempts 줄이기, (3) systemPrompt에 "간결하게" 추가, (4) 첫 시도 성공률 높이기 (프롬프트 개선)

### 학습 노트 + 최종 정리

```
notes/m12-integration.md에 정리:
- 평가 루프 패턴
- 하네스의 5축 통합
- 플러그인 vs SDK의 핵심 차이
- 프로덕션 배포 체크리스트
- 앞으로 만들고 싶은 에이전트 시스템
```

> 🎉 **전체 커리큘럼 완료!**
> Claude Agent SDK의 핵심 기능을 모두 학습했습니다.
> 이제 나만의 자율 에이전트 시스템을 구축할 준비가 되었습니다.
