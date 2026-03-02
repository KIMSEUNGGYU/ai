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
- **SDK 에이전트** (플러그인 파이프라인 X)
- 평가 루프: 각 단계에서 시도 → 평가 → 부족하면 재시도
- 기존 플러그인 = 에이전트가 사용하는 "도구"
- 디자인 입력: 내가 UI 레이아웃 배치 → AI가 로직+API 채움
- 위치: `services/fe-auto/`
- **점진적 진화**: SDK → Slack 알림 → Slack Bot → 자율 협업

## 아키텍처
```
Orchestrator Agent (main.ts)
  ├── Spec Agent     → 평가 루프 (요구사항 커버리지)
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
- [ ] 프로젝트 셋업 (services/fe-auto/)
- [ ] Spec Agent 구현
- [ ] Code Agent 구현
- [ ] Review Agent 구현
- [ ] Orchestrator 구현
- [ ] 파일럿 실행 + 디버깅

## 진행 — Phase 2 (Phase 1 완료 후)
- [ ] Slack Webhook 연동
- [ ] 채널 알림 포맷 설계
- [ ] 파이프라인에 Slack 포스팅 추가

<!-- last-active: 2026-03-03 -->
