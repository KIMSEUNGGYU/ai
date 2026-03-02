# Block 2: 복합 도구

## Phase A — 설계

### 패턴: 복합 커스텀 도구

실제 프로덕션에서 사용할 수 있는 복합 도구 패턴을 설계해보자.

**패턴 1: HTTP API 래퍼 도구**

```typescript
const fetchWeather = {
  name: "fetch_weather",
  description: "특정 도시의 현재 날씨를 조회합니다.",
  inputSchema: {
    type: "object",
    properties: {
      city: { type: "string", description: "도시명 (영문)" },
    },
    required: ["city"],
  },
  handler: async (input: any) => {
    const res = await fetch(`https://wttr.in/${input.city}?format=j1`);
    const data = await res.json();
    return {
      temp: data.current_condition[0].temp_C,
      description: data.current_condition[0].weatherDesc[0].value,
    };
  },
};
```

**패턴 2: 데이터 변환 도구**

```typescript
const csvToMarkdown = {
  name: "csv_to_markdown",
  description: "CSV 데이터를 마크다운 테이블로 변환합니다.",
  inputSchema: {
    type: "object",
    properties: {
      csv: { type: "string", description: "CSV 형식의 문자열" },
    },
    required: ["csv"],
  },
  handler: async (input: any) => {
    const rows = input.csv.trim().split("\n").map((r: string) => r.split(","));
    const header = `| ${rows[0].join(" | ")} |`;
    const separator = `| ${rows[0].map(() => "---").join(" | ")} |`;
    const body = rows.slice(1).map((r: string[]) => `| ${r.join(" | ")} |`).join("\n");
    return `${header}\n${separator}\n${body}`;
  },
};
```

### 설계 과제

다음 커스텀 도구를 설계해보자 (코드가 아닌 구조만):

**"코드 복잡도 분석 도구"**
- 파일 경로를 받아서
- 함수 수, 줄 수, 최대 중첩 깊이를 계산
- 결과를 JSON으로 반환

`name`, `description`, `inputSchema`, `handler` 로직을 설계해보자.

> ⛔ **STOP** — 코드 복잡도 분석 도구의 설계를 공유해주세요.

---

## Phase B — 피드백 + 종합

### 코드 복잡도 도구 설계 예시

```typescript
const analyzeComplexity = {
  name: "analyze_code_complexity",
  description: "TypeScript/JavaScript 파일의 복잡도를 분석합니다. 함수 수, 줄 수, 최대 중첩 깊이를 반환합니다.",
  inputSchema: {
    type: "object",
    properties: {
      filePath: { type: "string", description: "분석할 파일의 절대 경로" },
    },
    required: ["filePath"],
  },
  handler: async (input: any) => {
    const content = await readFile(input.filePath, "utf-8");
    const lines = content.split("\n");
    const functions = content.match(/function\s+\w+|=>\s*{|async\s+function/g) ?? [];
    let maxDepth = 0, currentDepth = 0;
    for (const char of content) {
      if (char === "{") { currentDepth++; maxDepth = Math.max(maxDepth, currentDepth); }
      if (char === "}") currentDepth--;
    }
    return { lineCount: lines.length, functionCount: functions.length, maxNestingDepth: maxDepth };
  },
};
```

### M09 종합 퀴즈

**Q1**: 커스텀 도구를 100개 정의하면 에이전트 성능에 어떤 영향이 있는가?

**Q2**: 커스텀 도구에서 에러가 발생하면 에이전트는 어떻게 반응하는가?

### 정답 가이드

- Q1: 도구 설명이 시스템 프롬프트에 포함되므로 토큰 비용 증가. 도구 선택 정확도도 하락할 수 있음. 필요한 도구만 노출하는 것이 중요
- Q2: 에러 메시지가 tool_result로 에이전트에게 전달되고, 에이전트가 재시도하거나 다른 방법을 시도

### 학습 노트

```
notes/m09-custom-tools.md에 정리:
- 커스텀 도구 구조 (name, description, inputSchema, handler)
- description의 중요성 (에이전트의 도구 선택에 직접 영향)
- inputSchema = JSON Schema
- 빌트인 vs MCP vs 커스텀 도구의 역할 분담
- 복합 도구 패턴 (API 래퍼, 데이터 변환)
```

> M09 완료! 다음 **M10: Streaming & User Input**에서 대화형 에이전트를 만듭니다. `/m10-streaming`을 호출하세요.
