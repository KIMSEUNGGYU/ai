# 나의 업무 워크플로우 & AI 자동화 설계

## 현재 워크플로우 (as-is)

1. 출근 → 구글 캘린더로 오늘 회의 확인
2. Slack `#product-dev`에 스크럼 작성 (기분/어제/오늘/공유)
3. 어제 Slack 확인 (놓친 것)
4. 개발 작업:
   - Deus(토스 디자인 시스템)로 디자인 확인
   - Cursor IDE로 작업
   - Swagger + 백엔드 개발자에게 API 확인
   - 백엔드 코드 → `.ai/ref`에 복사 → `fe:api-integrate`로 API 정의
   - 스펙문서 작성 → 단계별 구현
   - context 70% → `dev:save` → `/clear` → `dev:continue`

## 핵심 고민 (명확화 완료)

### 1. AI에게 컨텍스트 전달이 어려움 (가장 아픈 문제)
- **새 작업 시작 시**: Linear 티켓/디자인 → AI에게 설명하는 과정이 번거로움
- **이어서 작업 시**: 어제 하던 거 이어가려면 설명을 또 해야 함
- **원하는 것**: AI가 초안 생성 → 내가 확인/수정

### 2. 스펙 문서 관리
- 프로젝트마다 스펙이 사라짐 (`.ai/specs/`에 만들지만 관리 안 됨)
- Linear 연동으로 해결 가능할지 고민 중

### 3. Deus(디자인 도구)가 AI 친화적이지 않음
- 디자인 → 스펙 자동 변환이 어려움

### 4. 플러그인 vs SDK 에이전트 구분
- 언제 플러그인, 언제 SDK 에이전트를 써야 하는지 아직 불명확

### 5. compound engineering (최종 목표)
- AI가 자연스럽게 내 문맥을 인지
- 작업한 내용이 자동으로 축적 → CLAUDE.md, memory 등에 반영
- 점진적 개선 (처음부터 100% X)

### 6. session-manager
- 최근 개선함 → 써보면서 판단 예정

---

## AI 에이전트 팀 구성

> 워크플로우를 4개 Phase로 나누고, 각 Phase를 담당할 에이전트 팀 구성
> 기존 도구 최대 활용 + 공백 영역만 신규 구축

### 기존 자산 현황

| 플러그인 | 구성 요소 | 비고 |
|----------|-----------|------|
| `fe@ishopcare` | architect, code-reviewer, perf-optimizer, refactor-analyzer + api-integrate, review | FE 개발 핵심 |
| `dev@ishopcare` | pr, auto, ticket + git-commit-messages | 커밋/PR/티켓 |
| `session-manager@gyu` | save, resume, note + SessionStart/End 훅 | 컨텍스트 관리 |
| `episodic-memory` | 대화 히스토리 검색 (MCP) | 크로스세션 |
| `everything-claude-code` | architect, planner, tdd-guide, security-reviewer 등 | 범용 에이전트 |
| **MCP 연동** | Google Calendar, Slack, Linear, Notion, Gmail | 외부 서비스 |

### Phase 1: 모닝 루틴

| 에이전트 | 상태 | 역할 | 사용 도구 |
|----------|------|------|-----------|
| **Morning Briefer** | 🆕 신규 | 출근 시 하루 컨텍스트 세팅 | Calendar + Slack + Linear MCP |
| **Scrum Writer** | 🆕 신규 | 스크럼 초안 생성 + Slack 전송 | Slack MCP |

### Phase 2: 작업 준비

| 에이전트 | 상태 | 역할 | 사용 도구 |
|----------|------|------|-----------|
| **Spec Manager** | 🆕 신규 | 스펙 문서 생성/관리/동기화 | Linear MCP + 파일시스템 |
| **API Scout** | 🔧 강화 | 백엔드 API 탐색 + ref 정리 | fe:api-integrate 기반 |

### Phase 3: 개발 작업

| 에이전트 | 상태 | 역할 | 사용 도구 |
|----------|------|------|-----------|
| **fe:architect** | ✅ 기존 | 설계 지시서 생성 | FE 컨벤션 |
| **fe:api-integrate** | ✅ 기존 | 백엔드 API → FE 코드 통합 | 백엔드 ref 참조 |
| **fe:code-reviewer** | 🔧 수정필요 | 코드 리뷰 | FE 컨벤션 (before/after 누락 수정) |

### Phase 4: 마무리 & 축적

| 에이전트 | 상태 | 역할 | 사용 도구 |
|----------|------|------|-----------|
| **dev:pr** | ✅ 기존 | 커밋 + PR 생성 | Git + Linear |
| **session-manager:save** | 🔧 강화 | 컨텍스트 저장 | `.ai/current.md` |
| **Knowledge Accumulator** | 🆕 신규 | 세션 학습 자동 축적 | memory/ + CLAUDE.md |

### 메타 레이어

| 에이전트 | 상태 | 역할 |
|----------|------|------|
| **Plugin Improver** | 🆕 신규 | 사용 중 문제 리포트 수집 → 플러그인 개선 제안 |

### 워크플로우 전체 흐름

```
출근 → [Morning Briefer] → [Scrum Writer] → Slack 전송
  ↓
작업 시작 → [Spec Manager] → 스펙 확인/생성
  ↓
개발 → [fe:architect] → [fe:api-integrate] → 코딩 → [fe:code-reviewer]
  ↓
마무리 → [dev:pr] → [session-manager:save] → [Knowledge Accumulator]
```

### 구현 우선순위

```
1순위 (즉시 효과)   : Spec Manager — 스펙 문서 사라지는 문제 해결
2순위 (매일 사용)   : Morning Briefer + Scrum Writer — 모닝 루틴 자동화
3순위 (장기 가치)   : Knowledge Accumulator — compound engineering 자동 축적
4순위 (버그 수정)   : fe:review before/after 수정
5순위 (메타 개선)   : Plugin Improver — 플러그인 점진적 개선 루프
```

---

## 미해결 사항

- [ ] 플러그인 vs SDK 에이전트 사용 기준 정리
- [ ] Deus 디자인 → AI 읽을 수 있는 형태 변환 방법
- [ ] session-manager 개선 결과 검증 (써보면서)
