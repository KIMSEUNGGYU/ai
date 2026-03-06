import { query } from "@anthropic-ai/claude-agent-sdk";
import { evaluateSpec } from "../evaluators/spec-eval.js";
import type { AgentResult, SpecInput } from "../types.js";

const MAX_RETRIES = 3;

export async function runSpecAgent(input: SpecInput): Promise<AgentResult> {
  console.log("\n📋 [Spec Agent] 기획문서 → 구현 스펙 변환 시작\n");

  let sessionId: string | undefined;
  let lastResult = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isFirst = attempt === 0;

    console.log(
      isFirst
        ? "  📡 기획문서 분석 + 구현 스펙 생성 중..."
        : `  🔄 보완 중 (${attempt}/${MAX_RETRIES})...`
    );

    let turns = 0;
    let cost = 0;

    for await (const message of query({
      prompt: isFirst ? buildSpecPrompt(input) : lastResult,
      options: {
        model: "sonnet" as const,
        permissionMode: "bypassPermissions" as const,
        allowDangerouslySkipPermissions: true,
        systemPrompt: SPEC_SYSTEM_PROMPT,
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
            console.log(`    🔧 ${t.name}`);
          }
        }
      }

      if (msg.type === "result") {
        lastResult = msg.result ?? "";
        turns = msg.num_turns ?? 0;
        cost = msg.total_cost_usd ?? 0;
        console.log(`    📊 턴: ${turns} | 비용: $${cost}`);
      }
    }

    // 평가
    console.log("\n  🔍 스펙 평가 중...");
    const evaluation = evaluateSpec(lastResult);

    if (evaluation.pass) {
      console.log("  ✅ 구현 스펙 완성!\n");
      return { output: lastResult, sessionId, turns, cost };
    }

    if (attempt < MAX_RETRIES) {
      console.log(`  ❌ ${evaluation.feedback}\n`);
      lastResult = evaluation.feedback;
    } else {
      console.log("  ⚠️ 최대 재시도 도달. 현재 스펙으로 진행.\n");
    }
  }

  return { output: lastResult, sessionId, turns: 0, cost: 0 };
}

function buildSpecPrompt(input: SpecInput): string {
  const parts: string[] = [];

  parts.push("아래 기획문서를 분석하여 FE 구현 스펙으로 변환하세요.");

  if (input.ticketId) {
    parts.push(
      `\nLinear 티켓 ${input.ticketId}도 조회하여 추가 맥락을 확보하세요.`
    );
  }

  parts.push(`\n---\n## 기획문서\n${input.planningDoc}`);

  if (input.designInput) {
    parts.push(`\n---\n## 디자인 참고\n${input.designInput}`);
  }

  return parts.join("\n");
}

// ─────────────────────────────────────────────
// 시스템 프롬프트
// ─────────────────────────────────────────────

const SPEC_SYSTEM_PROMPT = `당신은 기획문서를 FE 구현 스펙으로 변환하는 전문가입니다.

## 핵심 역할
기획문서에서 **구현에 필요한 정보만 추출**하여, Code Agent가 바로 작업할 수 있는 구조화된 스펙을 생성합니다.

## 기획문서에서 추출할 것
- 사용자 행동/인터랙션 (뭘 클릭하면 뭐가 나온다)
- 화면 구성 요소 (어떤 UI가 필요한지)
- 데이터 흐름 (어디서 데이터를 가져와서 어디에 보여주는지)
- 비즈니스 규칙 (조건부 표시, 유효성 검증 등)
- API 관련 언급 (엔드포인트, 파라미터, 응답 구조)

## 기획문서에서 무시할 것 (노이즈)
- 프로젝트 배경, 목적, 비즈니스 임팩트
- 의사결정 히스토리, 회의 기록
- 마케팅/운영 관련 내용
- 일정, 담당자, 이해관계자 정보
- "왜 이걸 만드는가"에 대한 설명

## 출력 포맷 (반드시 이 구조로 작성)

### 1. 요구사항
MUST/SHOULD/MAY로 우선순위를 매겨 체크리스트로 작성합니다.

- MUST: 이 기능 없으면 의미 없음 (핵심 기능)
- SHOULD: 있으면 좋지만 첫 구현에서 빠져도 됨
- MAY: 나중에 해도 됨

예시:
- [MUST] 사용자는 목록에서 항목을 선택할 수 있다
- [MUST] 선택 시 상세 정보가 표시된다
- [SHOULD] 목록은 필터링이 가능하다
- [MAY] 키보드 네비게이션을 지원한다

### 2. 컴포넌트 구조
ASCII 트리로 컴포넌트 계층과 주요 props를 명시합니다.

예시:
PageLayout
  ├── FilterSection (props: filters, onChange)
  │   ├── SearchInput
  │   └── StatusFilter
  ├── ItemList (props: items, selectedId, onSelect)
  │   └── ItemCard (props: item, isSelected)
  └── DetailPanel (props: item, onClose)
      ├── DetailHeader
      └── DetailContent

### 3. API 계약
메서드, 경로, 요청/응답 타입을 명시합니다.

예시:
GET  /api/items         → ItemDTO[]        (params: { status?, search? })
GET  /api/items/:id     → ItemDetailDTO
POST /api/items         → ItemDTO          (body: CreateItemRequest)

- 기획문서에 API 정보가 없으면 화면 동작에서 유추하고 [유추] 태그 표시
- 기존 API가 있을 수 있으므로 가능하면 프로젝트 코드를 참조

### 4. 폴더 구조
생성할 파일 경로를 명시합니다. **Page First** 원칙: 리소스(remotes/queries/mutations/models)는 페이지 로컬에 배치합니다.

예시:
src/pages/orders/                          (도메인)
  ├── _common/                             (도메인 내 형제 페이지 간 공유)
  │   └── components/OrderStatusBadge.tsx
  ├── order-list/                          (기능 단위)
  │   ├── OrderListPage.tsx
  │   ├── components/
  │   │   ├── OrderFilter.tsx
  │   │   └── OrderTable.tsx
  │   ├── models/orders.dto.ts             (서버 DTO — 도메인별 단일 파일)
  │   ├── remotes/orders.ts                (API 호출 함수 — httpClient만 사용)
  │   ├── queries/orders.query.ts          (queryOptions 팩토리)
  │   └── mutations/orders.mutation.ts     (mutationOptions 팩토리)
  └── order-detail/
      ├── OrderDetailPage.t
      ├── components/
      ├── models/orders.dto.ts
      ├── remotes/orders.ts
      └── queries/orders.query.ts

주의:
- **Page First**: remotes/queries/mutations/models는 페이지 로컬에 배치 (전역 src/ 아래가 아님)
- 여러 페이지에서 공유할 때만 전역(src/remotes/ 등)으로 승격
- 도메인 내 형제 페이지 간 공유 → _common/ 폴더 사용
- 디렉토리 kebab-case, 컴포넌트 PascalCase, 페이지 PascalCase+Page
- 디자인 시스템: @tds/desktop (Button, Table, Modal, Select, TextField 등)

### 5. 스코프 아웃
이번 구현 범위에 포함하지 않는 것을 명시합니다.

예시:
- 페이지네이션 (다음 단계)
- 권한 체크 (기존 미들웨어 사용)
- 모바일 반응형 (별도 티켓)

### 6. 확인 필요
기획문서에서 불명확하거나 정보가 부족한 부분입니다.

예시:
- [확인] 에러 상태 UI가 정의되지 않음
- [확인] 목록 정렬 기본값 미정

## 규칙
- 기획문서에 명시되지 않은 내용을 추측으로 채우지 마세요
- API가 불명확하면 [유추] 태그를 붙이고 화면 동작에서 유추하세요
- 정보가 부족한 부분은 "확인 필요" 섹션에 모으세요
- 모든 6개 섹션을 빠짐없이 작성하세요 (해당 없으면 "해당 없음" 명시)
- Linear MCP가 있으면 티켓 정보를 조회하여 추가 맥락을 확보하세요`;
