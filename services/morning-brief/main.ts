import { query } from "@anthropic-ai/claude-agent-sdk";

// ──────────────────────────────────────────────
// 평가 함수 — 브리프 품질 검증
// ──────────────────────────────────────────────
function evaluateBrief(result: string): { pass: boolean; feedback: string } {
  const checks = {
    hasSchedule: /일정|미팅|회의|meeting|calendar/i.test(result),
    hasTasks: /이슈|작업|태스크|task|issue/i.test(result),
    hasPriority: /우선|중요|먼저|priority|P[0-3]/i.test(result),
  };

  const missing: string[] = [];
  if (!checks.hasSchedule) missing.push("오늘 일정/미팅");
  if (!checks.hasTasks) missing.push("할 일/이슈 목록");
  if (!checks.hasPriority) missing.push("우선순위 정리");

  console.log(
    `   체크: 일정=${checks.hasSchedule} 태스크=${checks.hasTasks} 우선순위=${checks.hasPriority}`
  );

  if (missing.length === 0) {
    return { pass: true, feedback: "" };
  }
  return {
    pass: false,
    feedback: `브리프 불완전. 누락: ${missing.join(", ")}. 반드시 포함해서 보완해주세요.`,
  };
}

// ──────────────────────────────────────────────
// 공통 옵션
// ──────────────────────────────────────────────
const today = new Date().toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

const baseOptions = {
  model: "haiku" as const,
  permissionMode: "bypassPermissions" as const,
  allowDangerouslySkipPermissions: true,

  systemPrompt: `당신은 개인 업무 비서입니다. 오늘(${today})의 업무 플랜을 정리합니다.

## 역할
linear-agent와 calendar-agent를 사용해서 데이터를 수집한 뒤, 오늘의 플랜을 작성합니다.

## 출력 형식
### 📅 오늘 일정
- 시간순으로 미팅/일정 나열

### 📋 오늘 할 일
- Linear 이슈를 우선순위 순으로 정리
- 각 이슈에 예상 소요시간 추정

### 🎯 오늘의 포커스
- 가장 중요한 1~2가지를 선정하고 이유 설명

마크다운 형식으로 출력하세요.`,

  agents: {
    "linear-agent": {
      description:
        "Linear에서 나에게 할당된 이슈를 가져옵니다. 진행 중인 이슈와 백로그를 구분합니다.",
      prompt: `Linear에서 나에게 할당된 이슈를 조회하세요.
- 진행 중(In Progress) 이슈를 먼저
- 그 다음 할 일(Todo/Backlog) 이슈
- 각 이슈의 제목, 상태, 우선순위를 포함
- 간결하게 목록으로 정리`,
    },
    "calendar-agent": {
      description: "오늘의 Google Calendar 일정을 가져옵니다.",
      prompt: `오늘(${today})의 Google Calendar 일정을 조회하세요.
- 시간, 제목, 참석자를 포함
- 시간순으로 정렬
- 간결하게 목록으로 정리`,
    },
  },
};

// ──────────────────────────────────────────────
// 메인 — 평가 루프
// ──────────────────────────────────────────────
async function main() {
  console.log(`\n☀️  모닝 브리프 — ${today}\n`);

  const MAX_RETRIES = 1;
  let sessionId: string | undefined;
  let lastResult = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      `${isFirst ? "📡 수집 중..." : "🔄 보완 중 (피드백 반영)..."}\n`
    );

    for await (const message of query({
      prompt: isFirst
        ? "오늘의 모닝 브리프를 작성해주세요. linear-agent와 calendar-agent를 사용해서 데이터를 수집하세요."
        : lastResult,
      options: {
        ...baseOptions,
        ...(isFirst ? {} : { resume: sessionId }),
      },
    })) {
      const msg = message as any;

      if (msg.type === "system" && msg.subtype === "init" && !sessionId) {
        sessionId = msg.session_id;
      }

      if (msg.type === "assistant") {
        const toolUses = msg.message?.content?.filter(
          (c: any) => c.type === "tool_use"
        );
        if (toolUses?.length) {
          for (const t of toolUses) {
            console.log(`  🔧 ${t.name}`);
          }
        }
      }

      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        console.log(`  📊 턴: ${msg.num_turns} | 비용: $${msg.total_cost_usd}`);
      }
    }

    // 평가
    console.log("\n🔍 평가 중...");
    const evaluation = evaluateBrief(lastResult);

    if (evaluation.pass) {
      console.log("✅ 브리프 완성!\n");
      console.log("─".repeat(50));
      console.log(lastResult);
      console.log("─".repeat(50));
      break;
    }

    if (attempt < MAX_RETRIES) {
      console.log(`❌ ${evaluation.feedback}\n`);
      lastResult = evaluation.feedback;
    } else {
      console.log("⚠️  최대 재시도 도달. 현재 결과:\n");
      console.log(lastResult);
    }
  }
}

main().catch(console.error);
