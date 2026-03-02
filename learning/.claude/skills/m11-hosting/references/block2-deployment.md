# Block 2: 배포 패턴

## Phase A — 설계

### 배포 환경별 패턴

**패턴 1: 크론잡 (정기 실행)**

```typescript
// daily-review.ts — 매일 코드 리뷰 실행
import { query } from "@anthropic-ai/claude-agent-sdk";

async function dailyReview() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`[${today}] 일일 코드 리뷰 시작`);

  for await (const msg of query({
    prompt: "어제 변경된 파일을 리뷰하고 보고서를 생성해줘.",
    options: {
      tools: ["Read", "Glob", "Grep", "Bash"],
      systemPrompt: "일일 코드 리뷰 봇. 간결한 보고서 형식.",
      maxTurns: 10,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    if ((msg as any).type === "result") {
      await saveReport(today, (msg as any).result);
    }
  }
}

// crontab: 0 9 * * * npx tsx daily-review.ts
```

**패턴 2: Express 서버 (API 엔드포인트)**

```typescript
import express from "express";
import { query } from "@anthropic-ai/claude-agent-sdk";

const app = express();

app.post("/api/review", async (req, res) => {
  const { filePath } = req.body;

  let result = "";
  for await (const msg of query({
    prompt: `${filePath} 파일을 리뷰해줘.`,
    options: {
      tools: ["Read"],
      maxTurns: 5,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    if ((msg as any).type === "result") result = (msg as any).result;
  }

  res.json({ review: result });
});
```

**패턴 3: GitHub Actions (CI/CD)**

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npx tsx scripts/pr-review.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 설계 과제

다음 시나리오의 배포 아키텍처를 설계해보자:

**"Slack 봇 — 코드 질문 답변"**
- Slack에서 `@ai-bot 코드 질문` 멘션
- 에이전트가 코드베이스를 탐색하고 답변
- 답변을 Slack 스레드에 게시

어떤 배포 패턴, 권한 설정, 에러 핸들링을 사용할지 설계해보자.

> ⛔ **STOP** — Slack 봇 아키텍처를 설계해서 공유해주세요.

---

## Phase B — 피드백 + 종합

### Slack 봇 아키텍처 예시

```
Slack Event API → Express 서버 → Agent SDK query()
                                      │
                                      ├── tools: ["Read", "Glob", "Grep"]
                                      ├── systemPrompt: "코드베이스 Q&A 전문가"
                                      ├── maxTurns: 5 (비용 제어)
                                      ├── hooks: PostToolUse → 감사 로그
                                      └── model: "haiku" (비용 절약)
                                      │
                                      ▼
                                 Slack API → 스레드에 답변
```

### M11 종합 퀴즈

**Q1**: 프로덕션에서 `bypassPermissions`를 사용해도 되는가?

**Q2**: 에이전트의 비용을 사용자별로 추적하려면?

### 정답 가이드

- Q1: 무인 실행(크론잡, CI)에서는 불가피. 하지만 반드시 (1) tools 제한, (2) maxTurns 설정, (3) hooks로 감사 로그 추가
- Q2: `result.total_cost_usd`를 사용자 ID와 함께 DB에 저장. 일별/월별 집계

### 학습 노트

```
notes/m11-hosting.md에 정리:
- result 메시지의 비용 지표
- 비용 최적화 전략 (모델/도구/턴수/프롬프트)
- 에러 핸들링 3패턴 (재시도/타임아웃/폴백)
- 배포 패턴 (크론잡/서버/CI)
- 프로덕션 안전장치 체크리스트
```

> M11 완료! 다음 **M12: 통합 프로젝트**에서 모든 것을 조합합니다. `/m12-integration`을 호출하세요.
