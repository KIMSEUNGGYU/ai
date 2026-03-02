# isc-sync 플러그인 설계

## 목표

매일/매주 흩어진 활동 데이터를 모아서 자동 정리하는 Claude Code 플러그인.
"어제 뭐했지?", "이번 주 뭐했지?"에 즉시 답할 수 있게.

### 두 가지 레이어

1. **개인용** — 나의 활동 정리 (Slack 내 메시지, Calendar, Linear)
2. **회사용** — 전사/팀 동향 파악 (Notion 주간 회의록, Slack 팀장 주간 정리 채널)

> 모든 직무에 적용 가능한 기능. 개인 → 팀 → 전사로 확장 가능.

## 상태: 설계 확정 → 구현 대기

## 확정 사항

| 항목 | 결정 |
|------|------|
| 플러그인 이름 | `isc-sync` |
| 테스트 프로젝트 | `~/isc-sync/` (옵시디언 아님, 별도 프로젝트 폴더) |
| 출력 포맷 | 구현 시 데이터 보고 결정 |
| Subagent 구조 | 소스별 1개씩 (Slack agent, Calendar agent, ...) |
| `/daily` 범위 | 오늘 + 어제 |
| `/weekly` 범위 | 지난 주 |
| 스크럼 연동 | 스크럼 스레드 = 뼈대, Slack 검색 = 보완 |
| 컨텍스트 벤치마크 | 구현 시 측정 |

---

## 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Commands                            │
│              /daily    /weekly    /company-weekly                │
└──────┬────────────┬──────────────────┬──────────────────────────┘
       │            │                  │
       ▼            ▼                  ▼
┌─────────────┐ ┌──────────────┐ ┌────────────────────┐
│  개인 Daily  │ │  개인 Weekly  │ │   회사 Weekly       │
│  Command    │ │  Command     │ │   Command          │
└──────┬──────┘ └──────┬───────┘ └─────────┬──────────┘
       │               │                   │
       ▼               ▼                   ▼
┌──────────────────────────────────────────────────────┐
│              Orchestrator (Main Agent)                │
│  - 날짜 범위 계산                                      │
│  - subagent 병렬 실행                                  │
│  - 결과 합산 → 포맷팅                                  │
└──────┬───────────────────────────────────────────────┘
       │
       │  ┌─── 병렬 실행 (컨텍스트 격리) ───┐
       │  │                                │
       ▼  ▼                                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Slack Agent  │  │ Calendar     │  │ Notion Agent │
│              │  │ Agent        │  │              │
│ • from:me    │  │ • list_events│  │ • 주간 페이지  │
│ • to:me      │  │ • 날짜 필터   │  │ • 팀별 정리   │
│ • concise!   │  │              │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────┐
│              Summary (요약만 반환)                     │
│  각 agent → 짧은 bullet point 요약 → main에 전달      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  File Writer    │
              │                 │
              │ 30_Recap/       │
              │ ├── daily/      │
              │ └── weekly/     │
              └─────────────────┘
```

## 데이터 흐름 요약

```
[MCP 도구들]  ──(raw data)──▶  [Subagent]  ──(요약)──▶  [Main]  ──(파일)──▶  [Obsidian]
  Slack                        컨텍스트                  합산 +               30_Recap/
  Calendar                     격리됨                    포맷팅
  Notion
  Linear
```

## 핵심 컨셉

- **입력**: Slack, Google Calendar, Linear 등 MCP 도구로 활동 데이터 수집
- **처리**: subagent가 검색 → 요약 (메인 컨텍스트 보호)
- **출력**: 옵시디언 노트로 저장

## 데이터 소스 (우선순위)

| 순위 | 소스 | 수집 내용 | MCP 도구 |
|------|------|-----------|----------|
| 1차 | Slack | 내가 보낸 메시지, 멘션, 스레드 | `slack_search_public_and_private` |
| 1차 | Google Calendar | 미팅, 일정 | `gcal_list_events` |
| 2차 | Linear | 이슈 상태 변경, 코멘트 | `list_issues`, `list_comments` |
| 3차 | Gmail | 주요 메일 | `gmail_search_messages` |
| 3차 | Notion | 문서 수정 | 미정 |

## 커맨드 (안)

### 개인용
- `/daily` — 어제(또는 오늘) 나의 활동 정리
- `/weekly` — 이번 주(또는 지난 주) 나의 활동 정리

### 회사용
- `/company-weekly` — 전사 주간 동향 요약 (팀별 하이라이트)
- 또는 `/weekly --scope=company` 같은 옵션 방식?

## 옵시디언 저장 구조 (안)

```
30_Recap/
├── daily/
│   ├── 2026-02-27.md
│   └── 2026-02-28.md
└── weekly/
    └── 2026-W09.md
```

> 폴더명, 구조 미확정. 다른 후보: 30_Sync/, 30_Log/

## 출력 포맷 (안)

### Daily

```markdown
---
date: 2026-02-27
type: daily-recap
sources: [slack, calendar]
---

## 일정
- 10:00 데일리 스크럼
- 14:00 FE 버디
- 15:00 디자인 리뷰

## Slack 활동
### 업무
- 주문 서류 UI 디자인 피드백 (#product_random)
- 신상호님 첫 PR 공유 (#product_dev)

### AI/Tech
- Claude Code 세션 실습 계획 논의
- AI Native 조직 방향 공유 (#techtalk)

### 기타
- 랜덤런치 조율
```

### Weekly

```markdown
---
week: 2026-W09
type: weekly-recap
sources: [slack, calendar, linear]
---

## 주간 요약
- 주문 서류 검수 기능 UI 개발
- Claude Code 세션 기획 (데이터팀 확대)
- 신규 입사자(신상호) 온보딩 지원

## 일자별 하이라이트
### 월 (02/24)
...
```

## 구현 플랜 (DFS 트리)

AI가 각 노드를 순서대로 탐색하며 구현. 깊이 우선 — 한 기능을 끝까지 완성 후 다음으로.

```
isc-sync [ROOT]
│
├── P0: Foundation ─────────────────────── 🔲 미착수
│   ├── P0.1: Plugin scaffold
│   │   ├── plugin.json 생성
│   │   ├── 디렉토리 구조 생성
│   │   └── 버전 0.1.0
│   ├── P0.2: Obsidian 폴더 셋업
│   │   ├── 30_Recap/ 생성
│   │   ├── 30_Recap/daily/
│   │   └── 30_Recap/weekly/
│   └── P0.3: Subagent 아키텍처
│       ├── data-collector agent 정의
│       └── 컨텍스트 격리 패턴 확정
│
├── P1: /daily (개인) ──────────────────── 🔲 미착수
│   ├── P1.1: Slack 수집기
│   │   ├── from:me 검색 (concise 모드)
│   │   ├── to:me 멘션 검색
│   │   ├── 날짜 범위 파라미터
│   │   └── 요약 포맷 (bullet points)
│   ├── P1.2: Calendar 수집기
│   │   ├── gcal_list_events 호출
│   │   ├── 시간순 정렬
│   │   └── 미팅 제목 + 시간 추출
│   ├── P1.3: 합산 + 포맷팅
│   │   ├── Slack + Calendar 병합
│   │   ├── frontmatter 생성
│   │   └── 카테고리 분류 (업무/기술/기타)
│   ├── P1.4: 파일 저장
│   │   ├── 30_Recap/daily/YYYY-MM-DD.md
│   │   └── 기존 파일 있으면 업데이트
│   └── P1.5: 테스트 + 벤치마크
│       ├── 컨텍스트 소비량 측정
│       └── 출력 품질 검증
│
├── P2: /weekly (개인) ─────────────────── 🔲 미착수
│   ├── P2.1: 전략 결정
│   │   ├── A) daily 파일 aggregate
│   │   └── B) 주간 범위 fresh 검색
│   ├── P2.2: 주간 요약 생성
│   │   ├── 일자별 하이라이트
│   │   └── 주간 총평
│   └── P2.3: 파일 저장
│       └── 30_Recap/weekly/YYYY-Wnn.md
│
├── P3: /company-weekly ────────────────── 🔲 미착수 (소스 정보 미확인)
│   ├── P3.1: Notion 주간 페이지 수집기
│   │   ├── 페이지 검색 패턴 확정 ⚠️ 미확인
│   │   ├── 팀별 내용 파싱
│   │   └── 요약 생성
│   ├── P3.2: Slack 팀장 채널 수집기
│   │   ├── 채널명 확정 ⚠️ 미확인
│   │   ├── 주간 메시지 필터
│   │   └── 팀별 요약
│   └── P3.3: 크로스 소스 합산
│       ├── Notion + Slack 병합
│       └── 전사 주간 요약 생성
│
└── P4: Extensions ─────────────────────── 🔲 미착수
    ├── P4.1: Linear 연동
    │   ├── 내 이슈 상태 변경
    │   └── 코멘트 요약
    ├── P4.2: Gmail 연동
    │   └── 주요 메일 요약
    ├── P4.3: Monthly recap
    │   └── weekly aggregate → 월간 정리
    └── P4.4: 스크럼 봇 연동
        └── 기존 스크럼 데이터 재활용
```

### 구현 순서 (선형화)

```
P0.1 → P0.2 → P0.3 → P1.1 → P1.2 → P1.3 → P1.4 → P1.5
                                                       │
                              P2.1 → P2.2 → P2.3 ◄────┘
                                              │
          [Notion/Slack 정보 확보 후] P3.1 → P3.2 → P3.3
                                                    │
                              P4.1 → P4.2 → P4.3 ◄─┘
```

### 마일스톤

| 마일스톤 | 완료 조건 | 의존성 |
|----------|-----------|--------|
| **v0.1** | `/daily` 동작 (Slack + Calendar) | P0 + P1 |
| **v0.2** | `/weekly` 동작 | P2 |
| **v0.3** | `/company-weekly` 동작 | P3 (소스 정보 필요) |
| **v1.0** | Linear + Gmail 연동 | P4 |

---

## 기술 설계 (미정)

### 컨텍스트 절약 전략
- 데이터 수집은 subagent에서 수행 → 요약만 메인에 반환
- Slack 검색: `concise` 모드, 날짜 범위 최소화
- Calendar: 단순 리스트라 가벼움

### 플러그인 구조 (안)
```
~/.claude/plugins/isc-sync/
├── plugin.json
├── commands/
│   ├── daily.md              # /isc:daily
│   ├── weekly.md             # /isc:weekly
│   └── company-weekly.md     # /isc:company-weekly
├── agents/
│   ├── slack-collector.md    # Slack 데이터 수집 (스크럼 + 검색)
│   ├── calendar-collector.md # Calendar 일정 수집
│   └── notion-collector.md   # Notion 주간 페이지 수집 (회사용)
└── skills/
    └── recap-format.md       # 출력 포맷 가이드
```

## 미결정 사항

- [x] ~~플러그인 이름~~ → `isc-sync`
- [x] ~~저장 위치~~ → `~/isc-sync/` (테스트용, 나중에 옵시디언 이동 가능)
- [x] ~~Daily/Weekly 노트 포맷~~ → 구현 시 데이터 보고 결정
- [x] ~~subagent 설계~~ → 소스별 1개씩
- [x] ~~시간 범위 기본값~~ → daily: 오늘+어제 / weekly: 지난 주
- [x] ~~스크럼 봇 연동~~ → 스크럼 뼈대 + Slack 검색 보완
- [ ] 컨텍스트 비용 벤치마크 → 구현 시 측정
- [ ] 회사용 Notion 주간 페이지 구조 → 추후 공유 예정
- [ ] 회사용 Slack 팀장 채널명 → 추후 확인 예정

## 회사용 데이터 소스 (상세화 필요)

### Notion 주간 페이지
- 모든 팀이 회의 내용을 정리하는 주간 페이지가 존재
- 페이지 이름 패턴, 구조: **미확인** (추후 공유 예정)
- MCP: `notion-search`, `notion-fetch`

### Slack 팀장 주간 정리 채널
- 팀장들이 본인 팀 업무를 주간 단위로 정리하는 전용 채널
- 채널명: **미확인** (추후 확인 예정)

### 회사용 출력 포맷 (안)

```markdown
---
week: 2026-W09
type: company-weekly
sources: [notion, slack]
---

## 전사 주간 요약

### Product팀
- 주문 서류 검수 기능 개발 중
- 신규 입사자 온보딩

### Data팀
- ...

### Sales팀
- ...
```

## 아이디어 메모

- 스크럼 봇이 이미 있으니, daily의 "어제 한 일"은 스크럼에서 가져올 수도
- Weekly는 daily를 aggregate하는 방식도 가능 (daily 먼저 쌓고 → weekly는 합산)
- LinkedIn 저장한 글도 수집하면 좋겠지만 API 없음
- 나중에 monthly recap도 추가 가능
- **회사용은 모든 직무에 유용** — PM, 디자이너, 개발자 누구나 "다른 팀 이번 주 뭐했지?" 가능
- 회사용 weekly는 팀장 채널 + Notion을 크로스체크하면 더 정확

## 변경 이력

- 2026-02-28: 초안 작성. Slack 테스트 완료 (컨텍스트 소비 이슈 확인)
- 2026-02-28: 회사용 레이어 추가 (Notion 주간 페이지 + Slack 팀장 채널). 상세 소스 정보는 추후 공유 예정
- 2026-02-28: 미결정 사항 확정 — 이름(isc-sync), 폴더(~/isc-sync/), subagent(소스별), 시간범위, 스크럼 연동
