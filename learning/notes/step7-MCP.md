---
tags:
  - ai-agent
  - claude-agent-sdk
  - mcp
date: 2026-03-02
step: 7
---

# Step 7: MCP — 외부 시스템 연동

## 배운 것

- `mcpServers` 옵션으로 MCP 서버를 SDK 세션에 추가 연결 가능
- MCP 도구 이름 규칙: `mcp__{서버명}__{도구명}` (예: `mcp__playwright__browser_click`)
- `tools: []`는 빌트인만 차단, MCP는 독립 레이어로 항상 로드됨 — Step 2 발견 재확인
- `tools` 생략하면 빌트인 21개 + MCP 91개 = 112개 도구 풀 전체 사용 가능
- 튜토리얼의 `@anthropic-ai/mcp-playwright`는 존재하지 않음 → 실제 패키지는 `@playwright/mcp`

## 핵심 인사이트

### MCP는 별도 축이 아니라 tools의 확장점

```
하네스 5축:
  tools ──────── 빌트인 도구 (Read, Glob, Write, Bash...)
  systemPrompt ─ 역할
  hooks ──────── 감시
  agents ─────── 위임
  sessions ───── 기억

MCP = tools의 확장:
  tools ──┬── 빌트인 (SDK가 제공)
          └── MCP (외부 서버가 제공) ← mcpServers 옵션
```

빌트인이 "태어날 때 가진 능력"이라면, MCP는 "후천적으로 장착하는 능력".

### MCP의 두 레이어

```
글로벌 MCP  → ~/.claude/mcp.json (Linear 등)  → 항상 로드, 끌 수 없음
SDK 세션 MCP → mcpServers 옵션                  → 해당 쿼리에만 추가
```

Step 2에서 `mcpServers: {}`가 기존 MCP를 못 끈 이유: 글로벌은 글로벌대로, SDK는 추가만 가능.

### 에이전트는 MCP와 빌트인을 자연스럽게 조합한다

v2 실험에서 `tools` 생략(빌트인+MCP 모두 허용) 시, 에이전트가 자동 구분:

```
웹 읽기 → Playwright MCP (browser_navigate, browser_click...)
로컬 저장 → 빌트인 (Write)
```

112개 도구 중 5개만 선택해서 작업 완료.

## 실험 기록

### v1: MCP 도구만으로 작업 (tools: [])

```
빌트인: 0개 | MCP: 91개 (Playwright 22 + 기타 69)

도구 흐름: browser_navigate → 끝
결과: example.com 제목+본문 설명
턴: 2 | 비용: $0.08
```

- `browser_navigate`가 접근성 스냅샷을 자동 반환 → 별도 snapshot 불필요
- Playwright MCP가 22개 도구 제공: navigate, click, snapshot, evaluate, fill_form, press_key, take_screenshot, tabs, drag, hover 등

### v2: 복합 작업 (MCP + 빌트인 협력)

```
빌트인: 21개 | MCP: 91개

도구 흐름:
  1. 🌐 browser_navigate  → HN 프론트 이동
  2. 🌐 browser_click      → 첫 번째 기사 댓글 링크 클릭
  3. 🌐 browser_snapshot   → 댓글 페이지 스냅샷
  4. 🌐 browser_evaluate   → JS 실행으로 댓글 데이터 추출
  5. 🔧 Write              → 로컬 markdown 파일 저장

결과: hn-report.md 생성 (상위 3개 기사 + 댓글 분석)
턴: 6 | 비용: $0.17
```

- 페이지 전환 전략: URL 직접 이동(navigate) vs 요소 클릭(click ref="e51") 구분
- 큰 페이지 → `browser_evaluate`로 JS 실행이 snapshot보다 효율적이라 판단
- MCP 4개 → 빌트인 1개로 자연 전환

## Step 1~6과의 비교

| Step | SDK 옵션 | 성격 | 제어 대상 |
|:----:|----------|------|-----------|
| 2 | `tools` | 빌트인 도구 제한 | "뭘 할 수 있나" (빌트인) |
| 7 | `mcpServers` | 외부 도구 추가 | "뭘 할 수 있나" (외부) |

둘 다 "에이전트의 능력"을 정의하는 tools 축. 차이는 빌트인(차감) vs MCP(추가).

## 비용

```
v1 (단순): $0.08 (2턴)
v2 (복합): $0.17 (6턴)
```

MCP 도구 91개의 설명이 입력 토큰을 소비 → Haiku여도 비용 상승.

## 다음 스텝

Step 8: 나만의 하네스 — Step 1~7 전체 조합. 평가 루프(실행→검증→재시도) 패턴 구현. 플러그인으로는 불가능한 프로그래밍 가능한 루프.
