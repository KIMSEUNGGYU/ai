---
title: cc-monitor History 탭
date: 2026-03-15
status: draft
---

# cc-monitor History 탭 — 프롬프트 단위 행동 추적

## 목적
"내 프롬프트에 대해 CC가 제대로 동작했는가"를 프롬프트 타임라인으로 확인

## 탭 구조 변경
```
[Overview] [Sessions] [History] [Cost] [Config]
```
- Analysis, Adoption 탭 → 제거 또는 Overview에 통합 검토
- HOURLY ACTIVITY → 제거

## History 탭 설계

### 데이터 구조
프롬프트 기준 그룹핑: `UserPromptSubmit` 이벤트 사이의 모든 이벤트를 하나의 "턴"으로 묶음

```
턴 = {
  prompt: UserPromptSubmit.prompt_text,
  timestamp: UserPromptSubmit.timestamp,
  events: [다음 UserPromptSubmit 전까지의 이벤트들],
  checks: [기대 동작 vs 실제 동작 비교 결과]
}
```

### UI 레이아웃

```
┌─ 필터 (전역) ──────────────────────────┐
│ 세션 선택 | 기간 | 프로젝트              │
└─────────────────────────────────────────┘

┌─ 프롬프트 타임라인 ─────────────────────┐
│ 오후 02:36 | "merchant 상세 API 연동해줘"│
│   ✓ fe-convention-prompt → api-layer.md │
│   ✓ Read → models/merchant.dto.ts       │
│   ✗ harness → dto.ts models/ 밖에 생성  │
│   → Edit 3회, Bash 1회                  │
│                                         │
│ 오후 02:15 | "이 컴포넌트 리팩토링해줘"  │
│   ✓ fe-convention-prompt → code-prin... │
│   ✗ Skill(fe:implement) 미호출          │
│   → Edit 5회                            │
└─────────────────────────────────────────┘
```

### 체크 규칙 (자동 판정)

| 체크 항목 | 조건 | 판정 |
|-----------|------|------|
| 컨벤션 주입 | PluginHook(fe-convention-prompt) 존재 | ✓/✗ |
| 주입된 파일 | raw_data.injected_conventions | 파일명 표시 |
| 하네스 통과 | PluginHook(harness-check) stderr 없음 | ✓/✗ |
| Skill 호출 | PostToolUse(Skill) 존재 | ✓/✗ + skill명 |
| Agent 위임 | PostToolUse(Agent) 존재 | 서브에이전트 정보 |

### 도구 요약 (접힌 상태)
턴 내 도구 사용을 카테고리별 카운트로 요약:
```
→ Edit 3회, Read 5회, Bash 2회, Agent 1회
```
펼치면 개별 이벤트 (기존 EventTimeline 재사용)

### API
- 기존 `/api/sessions/[id]/events` 사용
- 프론트에서 UserPromptSubmit 기준으로 그룹핑 (DB 변경 불필요)

## 기존 탭 정리

### Overview 개선
- TOKEN USAGE + COST TRACKING 합치기 → "비용 + 토큰" 통합 뷰
- 컨텍스트 주입량 (injection_bytes 누적) 표시 추가
- HOURLY ACTIVITY 제거
- TOP TOOLS → 의도적 행동만 (PluginHook, Skill, Agent)

### Sessions 유지
- 기존 task_name 그룹핑 + 드로어 유지
- Plugin Health + Convention 주입 비용 (이번 세션 추가분)

### Cost 개선
- 토큰 + 비용 통합
- 컨텍스트 주입 낭비량 표시

### 전역 필터
- 기간 (오늘/이번주/이번달/커스텀)
- 프로젝트 (project_path 기반)
- 전체 탭에 공통 적용

## 구현 순서
1. History 탭 (핵심 기능) — 하네스 체크 제외, 컨벤션 주입 + 도구 사용만
2. 전역 필터
3. Overview 정리 (합치기/제거)
4. Cost 개선
5. 하네스 위반 전송 + History 연동 (이후)
