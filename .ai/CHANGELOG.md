# 작업 이력

## 2026-03-21
- /recap 스킬 구현 + cc-monitor 배포 — 세컨드 브레인 일일 리캡 시스템 ✅
  - 세션: beb59631-7404-4ccb-8b4c-48d1dabd65de (2026-03-20~21)
  - 완료: cc-monitor Vercel 배포, /recap 전역 스킬 설계+구현(SKILL.md + extract-transcripts.mjs), transcript 파싱 검증, 판단 기록 템플릿 확정, 4회 테스트 반복, conventions에 내장 도구 활용 규칙 추가
  - 자가학습: 3건 반영 (decisions)

- cc-monitor session_name 지원 — /rename 기반 세션 이름 그룹핑 ✅
  - 세션: 2903d736-1466-4a02-80e2-01cb56f24b30 (2026-03-21)
  - 완료: DB session_name 컬럼 추가, transcript에서 /rename 파싱(parseSessionName), Stop/SessionEnd 시 자동 저장, HistoryTab 그룹핑 우선순위 변경(session_name > task_name > project_path), 기존 4개 세션 소급 적용, Vercel 배포
  - 자가학습: 추출 없음 (기존 규칙과 중복)

## 2026-03-15
- .ai/ 폴더 정리 + 프로젝트 구조 정비 ✅
  - 세션: 000bd9f6-9a74-454e-b5e2-bded0e338a58 (2026-03-15)
  - 완료: 루트 심링크 3개 삭제, specs 12개→9개 정리(완료된 스펙 삭제), todo→backlog 통합, reference→notes 통합, 6폴더→4폴더로 session-manager 정의 일치
  - 자가학습: 1건 반영 (decisions) — 관리 개선 시 기존 시스템 우선

- 세컨드 브레인 시스템 재설계 — rules 구조 개편 + 자가학습 프로세스 변경 ✅
  - 세션: 16662c09-d48e-43a7-8aa8-dc11d3aae20a (2026-03-15)
  - 완료: rules/ 8→5개 재구성(identity/decisions/conventions/system/pc-map), /done 자가학습 재설계(트리거 A~D + 암묵적 선호 + 자동 저장), session-wrap 삭제, identity 충돌 해소 우선순위 확정
  - 자가학습: 7건 반영 (decisions 6건, system 1건)

- cc-monitor 주입 비용 추적 + active task 자동 분류 ✅
  - 세션: b1bd2f2a-2753-4e8f-9e09-3ebe5c097eb9 (2026-03-13), 42f4f532-9003-47b7-a634-022cf595c58c (2026-03-14), 981e1231-50d7-428c-a9b6-387c542918d6 (2026-03-15)
  - 완료: fe-workflow hook injection_bytes 전송, PluginHealth 주입 비용 시각화, SessionStart 시 .ai/active/ 기반 task_name 자동 설정
  - 자가학습: 2건 반영 (decisions, system) — 워크플로우 우선 분류, 플러그인 날짜 불필요

## 2026-03-14
- cc-monitor 대시보드 개선 — task 그룹핑 + Plugin Health + fe-workflow hook 데이터 수정 ✅
  - 세션: b1bd2f2a-2753-4e8f-9e09-3ebe5c097eb9 (2026-03-13), 42f4f532-9003-47b7-a634-022cf595c58c (2026-03-14)
  - 완료: Slash Commands 분석, 프롬프트 인증, task_name Accordion 그룹핑, Plugin Health 체크리스트, fe-workflow hook 컨벤션 파일명 전송 수정
  - 자가학습: 1건 반영 (meta) — 자가학습 품질 기준 피드백

## 2026-03-09
- 자가학습 개선 — profile.md 도입 + /done profile 트랙 추가 (v0.12.0) ✅

## 2026-03-08
- session-manager 키워드 개선 v0.9.0 (교정+긍정 키워드 카테고리 분리) ✅
- .ai/ 구조 통합 (docs/plans → specs/backlog, archive → CHANGELOG) ✅
- 작업 파일 frontmatter 템플릿 도입 (v0.11.0) ✅
- 멀티모델 오케스트레이션 설계 → backlog
- 자가학습 개선(profile.md) + 제2의 나(비전) → backlog
- session-manager 개선 + .ai 구조 정비 완료 (v0.9.0→v0.11.0) ✅
- CLAUDE.md 전면 개선 (/init)

## 2026-03-07
- OpenClaw Phase 5 완료 — 세컨브레인 자가학습 메모리 아키텍처
- Agent Fundamentals 학습 완료 — 오케스트레이션, Ralph, 하네스, 멀티모델 (PRs: #11~#14)

## 2026-03-02
- agents 모노레포 구축 완료 — pnpm workspace, learning/ 통합, GitHub 레포 생성
