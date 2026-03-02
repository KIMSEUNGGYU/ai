import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile, writeFile } from "fs/promises";

// ──────────────────────────────────────────────
// 1. 평가 함수 — 결정론적 검증 (Step 8의 핵심)
//    에이전트(비결정적) + 코드(결정론적) = 하네스의 가치
// ──────────────────────────────────────────────
function evaluateReview(result: string): { pass: boolean; feedback: string } {
  const codeBlockCount = (result.match(/```/g) ?? []).length / 2; // 열림+닫힘 = 1쌍

  const checks = {
    codeExamples: codeBlockCount >= 4,  // 파일당 최소 1개
    severity: /심각|중요|낮음|높음|critical|high|medium|low/i.test(result),
    suggestions: /제안|개선|추천|suggest|improv/i.test(result),
    lineNumbers: /[Ll]ine\s*\d+|줄\s*\d+|\d+번\s*줄|\(Line \d+\)/i.test(result),
    security: /보안|security|injection|xss|취약|sanitiz/i.test(result),
  };

  const missing: string[] = [];
  if (!checks.codeExamples) missing.push(`코드 예시 (파일당 1개, 현재 ${codeBlockCount}개)`);
  if (!checks.severity) missing.push("심각도 레벨 (높음/중요/낮음)");
  if (!checks.suggestions) missing.push("개선 제안");
  if (!checks.lineNumbers) missing.push("구체적 라인 번호 참조 (예: Line 28)");
  if (!checks.security) missing.push("보안 취약점 분석 (입력 검증, injection 등)");

  console.log(`   체크: 코드블록=${codeBlockCount}개 심각도=${checks.severity} 제안=${checks.suggestions} 라인번호=${checks.lineNumbers} 보안=${checks.security}`);

  if (missing.length === 0) {
    return { pass: true, feedback: "" };
  }
  return {
    pass: false,
    feedback: `리뷰 품질 미달. 누락 항목: ${missing.join(", ")}. 반드시 포함해서 보완해주세요.`,
  };
}

// ──────────────────────────────────────────────
// 2. 감사 로그 훅 — PostToolUse (Step 4)
// ──────────────────────────────────────────────
async function auditLogger(input: any, _toolUseID: string | undefined) {
  const ts = new Date().toISOString();
  const tool = input.tool_name ?? "unknown";
  const line = `${ts} | ${tool} | ${JSON.stringify(input.tool_input ?? {}).slice(0, 100)}\n`;
  await appendFile("./audit.log", line);
  console.log(`  📋 [audit] ${tool}`);
  return {};
}

// ──────────────────────────────────────────────
// 3. 공통 옵션 — resume 시에도 재사용 (Step 6 교훈)
//    "resume은 대화 맥락만 이어가고, 옵션은 리셋"
// ──────────────────────────────────────────────
const baseOptions = {
  // tools 생략 = 전부 허용 (Task 포함 → 서브에이전트 호출 가능)
  // Step 5 교훈: tools 화이트리스트에 Task 없으면 서브에이전트 호출 불가
  model: "haiku" as const,
  permissionMode: "bypassPermissions" as const,
  allowDangerouslySkipPermissions: true,

  // Step 3: 역할 + 관점 + 출력 형식
  systemPrompt: `당신은 코드 리뷰 총괄자입니다.

## 역할
file-reviewer 서브에이전트를 사용해서 각 파일을 개별 리뷰한 뒤, 전체 요약 보고서를 작성합니다.

## 출력 요구사항 (반드시 포함)
1. 파일별 리뷰 요약
2. 심각도 레벨 (높음/중요/낮음)
3. 개선 제안 — 구체적 코드 예시(\`\`\` 블록) 포함

마크다운 형식으로 출력하세요.`,

  // Step 5: 서브에이전트 정의
  agents: {
    "file-reviewer": {
      description:
        "TypeScript 파일 1개를 리뷰합니다. 파일 경로를 지정하면 코드를 읽고 품질/에러 핸들링/타입 안전성을 분석합니다.",
      prompt: `당신은 TypeScript 코드 리뷰어입니다.
지정된 파일을 읽고 분석하세요:
1. 코드 품질 (가독성, 구조)
2. 에러 핸들링
3. 타입 안전성
4. 심각도: 높음/중요/낮음
5. 개선 제안 (구체적 코드 예시 포함)

마크다운으로 요약하세요.`,
      tools: ["Read", "Glob", "Grep"],
    },
  },

  // Step 4: 감사 로그
  hooks: {
    PostToolUse: [{ matcher: ".*", hooks: [auditLogger] }],
  },
};

// ──────────────────────────────────────────────
// 4. 메인 — 이중 루프 (에이전트 루프 × 평가 루프)
// ──────────────────────────────────────────────
async function main() {
  console.log("=== Step 8: 나만의 하네스 — 평가 루프 코드 리뷰 ===\n");

  await writeFile(
    "./audit.log",
    `=== 세션 시작: ${new Date().toISOString()} ===\n`
  );

  const TARGET =
    "step1-hello.ts, step2-tools.ts, step3-prompt.ts, step4-hooks.ts";
  const MAX_RETRIES = 2;

  let sessionId: string | undefined;
  let lastResult = "";

  // ── 외부 루프: 평가 루프 (TypeScript 제어) ──
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(`\n${"═".repeat(50)}`);
    console.log(
      `📍 시도 ${attempt + 1}/${MAX_RETRIES + 1}${isFirst ? "" : " (resume + 피드백)"}`
    );
    console.log(`${"═".repeat(50)}\n`);

    // ── 내부 루프: 에이전트 루프 (SDK 제어) ──
    for await (const message of query({
      prompt: isFirst
        ? `다음 파일들을 file-reviewer 에이전트로 각각 리뷰하고 전체 보고서를 작성해주세요: ${TARGET}`
        : lastResult, // 평가 실패 시 피드백이 새 프롬프트
      options: {
        ...baseOptions,
        ...(isFirst ? {} : { resume: sessionId }), // Step 6: 세션 이어가기
      },
    })) {
      const msg = message as any;

      // 세션 ID 캡처 (최초 1회)
      if (msg.type === "system" && msg.subtype === "init" && !sessionId) {
        sessionId = msg.session_id;
        console.log(`📌 세션: ${sessionId}\n`);
      }

      // 에이전트 행동 관찰
      if (msg.type === "assistant") {
        const text = msg.message?.content
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("");
        const toolUses = msg.message?.content?.filter(
          (c: any) => c.type === "tool_use"
        );

        if (toolUses?.length) {
          for (const t of toolUses) {
            console.log(
              `🔧 ${t.name}(${JSON.stringify(t.input).slice(0, 80)})`
            );
          }
        }
        if (text) console.log(`🤖 ${text.slice(0, 500)}`);
      }

      // 결과 캡처
      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        console.log(`\n📊 턴: ${msg.num_turns} | 비용: $${msg.total_cost_usd}`);
      }
    }

    // ── 평가 ──
    console.log(`\n${"─".repeat(50)}`);
    console.log("🔍 평가 중...\n");

    const evaluation = evaluateReview(lastResult);

    if (evaluation.pass) {
      console.log("✅ 평가 통과!\n");
      console.log("── 최종 리뷰 보고서 ──\n");
      console.log(lastResult);
      break;
    }

    if (attempt < MAX_RETRIES) {
      console.log(`❌ ${evaluation.feedback}`);
      console.log(`🔄 resume으로 피드백 전달 → 재시도\n`);
      lastResult = evaluation.feedback; // 피드백을 다음 프롬프트로
    } else {
      console.log(
        `❌ 최대 재시도(${MAX_RETRIES + 1}회) 도달. 마지막 결과:\n`
      );
      console.log(lastResult);
    }
  }

  console.log("\n📋 감사 로그: cat audit.log");
  console.log("=== 하네스 실행 완료 ===");
}

main().catch(console.error);
