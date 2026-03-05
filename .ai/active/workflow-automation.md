# FE 자동화 에이전트 (fe-auto)

## 목표
Linear 티켓 → 스펙 → 코드 → PR까지 완전 자동화.
**최종 비전**: Slack 기반 자율 에이전트 사일로 (토스 사일로 구조 참고).

## 스펙
- `.ai/specs/my-workflow.md` — 워크플로우 & 배경
- `.ai/specs/fe-auto-architecture.md` — Phase 1 아키텍처 (SDK 파이프라인)
- `.ai/specs/fe-auto-roadmap.md` — 전체 진화 로드맵 (Phase 1→4)
- `.ai/specs/references/agent.md` — 레퍼런스 (토스 사일로 → AI 에이전트)

## 현재 Phase: 1 — SDK 파이프라인
> Phase 1만으로도 자동화 가치 있음. 동작하면 Phase 2(Slack 가시성)로 진화.

## 핵심 결정
- **SDK 에이전트** (플러그인 파이프라인 X) — 멀티 에이전트 오케스트레이션, 평가 루프, 상태 전달은 SDK에서만 가능
- 평가 루프: 각 단계에서 시도 → 평가 → 부족하면 재시도
- 기존 플러그인 = 에이전트가 사용하는 "도구" (fe:architect, fe:api-integrate 등)
- 디자인 입력: 내가 UI 레이아웃 배치(@tds/desktop) → AI가 로직+API 채움
- 위치: `services/fe-auto/`
- **점진적 진화**: SDK → Slack 알림 → Slack Bot → 자율 협업
- **기획문서는 Notion** → Spec Agent가 노이즈 제거 + 구조화 (PM은 평소처럼 작성)

## 실제 워크플로우 (역할 분담)
```
PM (Notion)        → 기획문서 작성 (평소처럼)
Spec Agent (AI)    → 노이즈 제거 + 구현 스펙 구조화 (MUST/SHOULD/MAY, 트리, API 계약)
승규님             → 스펙 검토/보완 + TDS 컴포넌트로 UI 레이아웃 배치 (껍데기)
Code Agent (AI)    → 로직 + API + 상태관리 채움
Review Agent (AI)  → 코드 리뷰 → PR
승규님             → 최종 검수
```

## 아키텍처
```
Orchestrator Agent (main.ts)
  ├── Spec Agent     → 기획문서 → 구현 스펙 변환 (평가 루프: 6섹션 + 구조적 품질)
  ├── Code Agent     → 평가 루프 (빌드/타입/컨벤션)
  └── Review Agent   → 평가 루프 (CRITICAL 이슈 0개)
       ↓
  PR 생성 → 사람 검수
```

## 진행 — Phase 1
- [x] 워크플로우 현황 정리
- [x] 고민 명확화 (clarify:vague)
- [x] 플러그인 vs SDK 구분 정리
- [x] 에이전트 아키텍처 설계
- [x] 아키텍처 스펙 문서 작성 (fe-auto-architecture.md)
- [x] 진화 로드맵 작성 (fe-auto-roadmap.md)
- [x] 프로젝트 셋업 (services/fe-auto/)
- [x] Spec Agent 구현 (기획문서→구현스펙 변환 + 평가 루프)
- [x] Code Agent 구현 (평가 루프 + FE 컨벤션)
- [x] Review Agent 구현 (CRITICAL/HIGH 기반 판정)
- [x] Orchestrator 구현 (--convert 모드 + Code↔Review 사이클 루프)
- [x] Spec Agent 프롬프트 개선 — 노이즈 필터링, 6섹션 출력 포맷, 실제 프로젝트 구조 반영
- [x] 평가기 강화 — 섹션 체크 + 구조적 품질(우선순위 태그, 트리, API 시그니처)
- [x] 실제 ishopcare-frontend 구조 분석 → 스펙 출력 포맷 보정 (플랫 파일 패턴)
- [ ] 파일럿 실행 + 디버깅
- [ ] Notion MCP 연동 (--notion 옵션)

## 진행 — Phase 2 (Phase 1 완료 후)
- [ ] Slack Webhook 연동
- [ ] 채널 알림 포맷 설계
- [ ] 파이프라인에 Slack 포스팅 추가

## 현재 컨텍스트
Spec Agent 프롬프트/평가기 개선 완료. 실제 프로젝트 구조(플랫 파일 패턴) 반영됨.
다음 단계: 파일럿 실행으로 전체 파이프라인 검증.

## 메모
- ishopcare-frontend 구조: `remotes/*.ts`, `queries/*.query.ts`, `mutations/*.mutation.ts`, `models/*.dto.ts` (플랫)
- 디자인시스템: `@tds/desktop` (Button, Table, Modal, Select, TextField 등)
- 컴포넌트 레지스트리(DEUS/TDS AI 친화적 활용)는 나중에 별도 작업
- AI 모니터링 필요성 인식됨 — 향후 검토

<!-- last-active: 2026-03-05 02:52 -->
