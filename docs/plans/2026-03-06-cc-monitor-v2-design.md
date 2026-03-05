# cc-monitor v2 설계

> 날짜: 2026-03-06
> 상태: 확정
> 목적: 팀용 Claude Code 모니터링 대시보드 — 비용 + 생산성 + 설정 가시성

## 핵심 문제

1. **Read/Edit 이벤트 과다 수집** — 건당 이벤트 저장은 노이즈, 카운트만 의미있음
2. **Token 수집 불가 (원격)** — transcript 파싱이 서버에서만 동작, Vercel에서는 로컬 파일 접근 불가
3. **설정 컨텍스트 미수집** — CLAUDE.md, rules, MCP, hooks, skills 정보가 없음

## 설계 결정

### 1. 수집 레이어: send-event.ts enrichment

로컬 hook 스크립트(send-event.ts)가 데이터를 **로컬에서 enrichment**한 후 원격 서버로 전송.

```
[현재]  Hook → send-event.ts → POST {raw event} → 서버 → transcript 파싱(로컬에서만)
[변경]  Hook → send-event.ts → (로컬 enrichment) → POST {enriched event} → 서버
```

#### 이벤트별 전략

| 이벤트 | 전송 여부 | 추가 데이터 |
|--------|----------|------------|
| SessionStart | O | config_counts, config_names (CLAUDE.md, rules, MCP, hooks 목록) |
| PreToolUse (경량: Read/Edit/Glob/Grep/Write) | X | 파일 캐시에 카운터만 증가 |
| PreToolUse (의미: Bash/Agent/Skill/MCP/WebFetch) | O | 기존 상세 데이터 |
| PostToolUse (경량) | X | 카운터 증가 |
| PostToolUse (의미) | O | 기존 + tool_duration 계산 |
| Stop | O | + transcript_usage (tokens) + tool_summary (카운터 요약) |
| SessionEnd | O | + transcript_usage (최종) + tool_summary |
| UserPromptSubmit | O | 기존 유지 (prompt 500자 truncate) |

#### 경량 도구 카운터

- send-event.ts는 매번 새 프로세스로 실행됨
- 파일 기반 캐시: `/tmp/cc-monitor-{session_id}.json`
- 구조: `{ read: 42, edit: 8, glob: 15, grep: 5, write: 3 }`
- Stop/SessionEnd 시 카운터 읽어서 tool_summary로 전송 후 파일 삭제

#### config 수집 (SessionStart)

claude-hud의 `config-reader.ts` 로직 참고:
- CLAUDE.md 파일 목록 (경로)
- rules 파일 목록 (파일명)
- MCP 서버 목록 (이름)
- hooks 이벤트 목록 (이벤트명)

### 2. DB 스키마 변경

**Session 테이블 추가 컬럼**:

```prisma
config_claude_md_count    Int?
config_rules_count        Int?
config_mcp_count          Int?
config_hooks_count        Int?
config_mcp_names          String?   // JSON array: ["serena", "linear"]
config_rules_names        String?   // JSON array: ["git-workflow.md", "security.md"]
config_claude_md_paths    String?   // JSON array: ["~/.claude/CLAUDE.md", "{cwd}/CLAUDE.md"]
tool_summary              String?   // JSON: {"Read": 42, "Edit": 8, "Glob": 15}
```

**서버 측 transcript 파싱 제거**: send-event.ts가 이미 파싱해서 보내므로 서버는 저장만.

### 3. 대시보드 탭 구성

#### Overview 탭
- KPI 카드: DAU, 총 세션 수, 평균 세션 시간, 오늘 총 비용
- 활성 세션 목록 (현재 ActiveSessions 컴포넌트)
- 시간대별 활동 차트 (현재 HourlyActivity)
- 도구 사용 요약 (경량 도구 카운트 + 의미 도구 상세)

#### Cost 탭
- 비용 요약 카드 (총비용, 모델별, 세션당 평균)
- 모델별 비용 비교
- 일별 비용 추이 차트
- 사용자별 비용 순위

#### Sessions 탭
- 세션 목록 (검색/필터: 사용자, 프로젝트, 날짜)
- 세션 상세 클릭 시: 도구 사용 타임라인, 프롬프트 로그, 토큰 사용량
- (기존 prompt-logs 페이지를 여기로 통합)

#### Config 탭
- 사용자별 설정 매트릭스: 누가 어떤 CLAUDE.md/rules/MCP/hooks를 사용하는지
- 설정 채택률: "팀에서 X% 가 serena MCP를 사용 중"
- 최근 세션의 설정 스냅샷

### 4. 제거/축소 대상

- ~~AdoptionSummaryCards~~ → Overview KPI로 축소
- ~~AdoptionTrendChart~~ → Overview에 DAU 트렌드로 대체
- ~~ToolAdoptionChart~~ → Config 탭으로 이동
- ~~개별 Read/Edit Activity Feed~~ → tool_summary 카운트로 대체
- ~~별도 prompt-logs 페이지~~ → Sessions 탭 세션 상세로 통합

### 5. 참고: HUD 데이터 소스

| HUD 데이터 | 소스 | cc-monitor 적용 |
|-----------|------|----------------|
| Usage % (5h/7d) | OAuth API (`api.anthropic.com/api/oauth/usage`) | 개인 구독 정보라 팀 모니터링에는 부적합 |
| Tool 사용 | transcript JSONL 파싱 | send-event.ts에서 파싱 후 전송 |
| Config 카운트 | 파일시스템 읽기 | send-event.ts SessionStart에서 수집 |
| Token 수 | transcript의 `message.usage` | send-event.ts Stop/SessionEnd에서 파싱 |
