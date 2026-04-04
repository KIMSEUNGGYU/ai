# fe-auto 진화 로드맵

## 비전
FE 개발 자동화를 SDK 파이프라인에서 시작해, Slack 기반 자율 에이전트 사일로로 점진 진화.

## 레퍼런스
- `.ai/specs/references/agent.md` — 토스 사일로 → AI 에이전트 사례
- 핵심: 에이전트 1개 = Slack Bot + Claude API + 역할 프롬프트 + 도구

---

## Phase 1: SDK 파이프라인 (현재)
> 스펙: `fe-auto-architecture.md`

**목표**: 동작하는 자동화 파이프라인 확보

```
CLI 실행 → Orchestrator → Spec Agent → Code Agent → Review Agent → PR
```

- 기술: Claude Agent SDK, MCP (Linear, 파일시스템)
- 평가 루프로 품질 보장
- 터미널에서 실행, 결과는 PR

**완료 조건**: Linear 티켓 1개를 입력하면 PR이 나옴

---

## Phase 2: Slack 가시성 추가
**목표**: 진행 상황을 Slack에서 확인

```
Phase 1 파이프라인 + Slack Webhook 알림
```

- 각 단계 시작/완료를 Slack 채널에 포스팅
- 평가 결과(pass/fail)도 포스팅
- 에이전트 "대화"는 아직 없음, 알림 수준
- 기술 추가: Slack Incoming Webhook

**완료 조건**: #fe-auto 채널에서 파이프라인 진행 상황 실시간 확인 가능

---

## Phase 3: Slack Bot 전환
**목표**: 에이전트를 Slack Bot으로 전환, 채널 기반 통신

```
#spec-review  — Spec Bot이 스펙 작성, 리뷰 요청
#fe-dev       — Code Bot이 코드 생성, 빌드 결과 공유
#code-review  — Review Bot이 리뷰 결과 포스팅
```

- 각 에이전트 = 별도 Slack Bot App (고유 아이콘/이름)
- 에이전트 간 통신: 채널 메시지 + 멘션
- 체인 리액션: Spec Bot 완료 → Code Bot 자동 트리거
- 기술 추가: `@slack/bolt`, Slack App 복수 생성

**완료 조건**: Slack 채널에서 에이전트들이 순차적으로 작업 진행

---

## Phase 4: 자율 협업
**목표**: 에이전트가 스스로 판단하고 다른 에이전트에게 요청

- 블로커 발생 시 자동 에스컬레이션
- 에이전트 간 리뷰/피드백 대화
- 스케줄 기반 자동 실행 (예: Linear 티켓 새로 생기면 자동 시작)
- 사람은 아침에 Slack 확인 → 머지 승인만
- 기술 추가: 이벤트 드리븐, 상태 DB (Supabase)

**완료 조건**: 사람 개입 없이 티켓 → PR 자동 생성

---

## 기술 스택 전체

| 레이어 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| AI | Claude Agent SDK | 동일 | Claude API 직접 | 동일 |
| 통신 | 함수 호출 | + Webhook | @slack/bolt | + 이벤트 드리븐 |
| Task | Linear MCP | 동일 | Linear API | + 자동 감지 |
| Code | 로컬 파일 | 동일 | GitHub API | 동일 |
| 상태 | 메모리 | 동일 | Slack 메시지 | + Supabase |
| 가시성 | 터미널 | + Slack 알림 | Slack 채널 | 동일 |

## 핵심 원칙
1. **각 Phase가 독립적 가치** — Phase 1만으로도 자동화 효과 있음
2. **점진적 복잡도** — 동작하는 것에서 출발, 필요할 때 진화
3. **Phase 1 코어 로직은 재사용** — Bot 전환해도 에이전트 프롬프트/평가 로직은 동일
