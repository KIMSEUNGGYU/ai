/**
 * M09: Custom Tools — 나만의 도구 만들기
 *
 * 커스텀 도구(시간, 프로젝트 정보)를 정의하고 에이전트에게 제공
 *
 * 실행: unset CLAUDECODE && npx tsx src/m09-custom-tools/custom-tools.ts
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

const getCurrentTime = {
  name: "get_current_time",
  description: "현재 시간을 특정 타임존 기준으로 반환합니다.",
  inputSchema: {
    type: "object" as const,
    properties: {
      timezone: {
        type: "string",
        description: "IANA 타임존 (예: Asia/Seoul)",
      },
    },
    required: ["timezone"],
  },
};

const getProjectInfo = {
  name: "get_project_info",
  description: "현재 프로젝트의 기본 정보를 반환합니다.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

function handleCustomTool(name: string, input: any): string {
  switch (name) {
    case "get_current_time":
      return new Date().toLocaleString("ko-KR", { timeZone: input.timezone });
    case "get_project_info":
      return JSON.stringify({
        name: "claude-agent-sdk-learn",
        version: "1.0.0",
        description: "Claude Agent SDK 인터랙티브 학습 프로그램",
      });
    default:
      return `Unknown tool: ${name}`;
  }
}

async function main() {
  console.log("=== M09: Custom Tools ===\n");

  for await (const message of query({
    prompt: "지금 서울 시간이 몇 시인지, 그리고 이 프로젝트의 정보를 알려줘.",
    options: {
      tools: [],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    const msg = message as any;
    if (msg.type === "assistant") {
      const text = msg.message?.content
        ?.filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("");
      if (text) console.log(`🤖 ${text.slice(0, 300)}`);
    }
    if (msg.type === "result") {
      console.log(`\n✅ turns: ${msg.num_turns} | cost: $${msg.total_cost_usd}`);
    }
  }
}

main().catch(console.error);
