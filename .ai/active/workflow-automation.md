# FE 자동화 에이전트 (fe-auto)

## 목표
Linear 티켓 → 스펙 → 코드 → PR까지 **평가 루프가 있는 SDK 에이전트**로 완전 자동화.

## 스펙
- `.ai/specs/my-workflow.md` — 워크플로우 & 배경
- `.ai/specs/fe-auto-architecture.md` — 에이전트 아키텍처 (신규)

## 핵심 결정
- **SDK 에이전트** (플러그인 파이프라인 X)
- 평가 루프: 각 단계에서 시도 → 평가 → 부족하면 재시도
- 기존 플러그인 = 에이전트가 사용하는 "도구"
- 디자인 입력: 내가 UI 레이아웃 배치 → AI가 로직+API 채움
- 위치: `services/fe-auto/`

## 아키텍처
```
Orchestrator Agent (main.ts)
  ├── Spec Agent     → 평가 루프 (요구사항 커버리지)
  ├── Code Agent     → 평가 루프 (빌드/타입/컨벤션)
  └── Review Agent   → 평가 루프 (CRITICAL 이슈 0개)
       ↓
  PR 생성 → 사람 검수
```

## 진행
- [x] 워크플로우 현황 정리
- [x] 고민 명확화 (clarify:vague)
- [x] 플러그인 vs SDK 구분 정리
- [x] 에이전트 아키텍처 설계
- [ ] 아키텍처 스펙 문서 작성 (fe-auto-architecture.md)
- [ ] 프로젝트 셋업 (services/fe-auto/)
- [ ] Spec Agent 구현
- [ ] Code Agent 구현
- [ ] Review Agent 구현
- [ ] Orchestrator 구현
- [ ] 파일럿 실행 + 디버깅

<!-- last-active: 2026-03-02 -->
