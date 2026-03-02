# 모닝 브리프 에이전트 (SDK 실전 프로젝트)

## 목표
매일 아침 Linear 이슈 + Calendar 일정을 자동 수집하여 오늘의 업무 플랜을 생성하는 SDK 에이전트.
Lv.3(통합 설계) → Lv.4(실전 프로젝트) 레벨업이 목적.

## 스펙
- 데이터 소스: Linear + Calendar (MVP), Slack (추후)
- 평가 루프: 일정/태스크/우선순위 포함 여부 검증
- 서브에이전트: linear-agent, calendar-agent
- MCP: 글로벌 설정 자동 사용 (별도 설치 불필요)
- 모델: haiku (비용 절약)

## 프로젝트 위치
- 코드: `~/dev/agents/services/morning-brief/` (pnpm workspace)
- 실행: `cd ~/dev/agents && pnpm morning`

## 진행

### 모닝 브리프
- [x] 프로젝트 셋업 — `~/dev/agents/` 모노레포 + package.json + tsconfig
- [x] MVP 코드 작성 — main.ts (서브에이전트 2개 + 평가 루프)
- [ ] 첫 실행 + 디버깅
- [ ] Obsidian 저장 기능 추가
- [ ] Slack 소스 추가
- [ ] 크론잡 자동 실행

### Agent Harness 학습 (완료)
- [x] Step 1~8 전체 완료 — `learning/claude-code/`
- [x] 치트시트 — `learning/claude-code/notes/치트시트.md`
- [x] 퀴즈 82% (9/11)

### isc-sync (보류)
- [x] 설계 완료 — `.ai/specs/daily-sync-plugin.md`
- [ ] P0~P4 구현 (모닝 브리프 이후 재검토)

## 결정사항
- SDK 에이전트 모노레포: `~/dev/agents/` (플러그인 저장소와 분리)
- MVP 소스: Linear + Calendar (Slack은 추후)
- 모델: haiku
- 평가 루프: TypeScript 함수 (결정론적 검증)
- 출력: 터미널 (Obsidian 저장은 추후)
- 플러그인↔SDK 전환 가능하지만 능력이 다름 (검증 루프, 자동 실행 = SDK만)

## 메모 (SDK 핵심)
- `tools` 생략 ≠ `tools: []`. 생략=전부 허용, `[]`=전부 차단
- tools에 Task 없으면 서브에이전트 불가 → tools 생략 필요
- `resume`은 대화 맥락만 유지, 옵션(tools/model/hooks)은 리셋
- MCP는 tools의 확장점. 글로벌 MCP는 SDK에서도 자동 사용
- SDK = Claude Code CLI spawn → `unset CLAUDECODE` 필수
- 에이전트 우회: 도구 차단해도 MCP 등 대체 경로로 우회함
- 피드백 과보정: LLM이 "부족" 피드백에 과잉 반응하는 경향

<!-- last-active: 2026-03-02 -->
