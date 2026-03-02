---
tags:
  - agent
  - monorepo
  - setup
date: 2026-03-02
status: active
---

# ~/dev/agents/ 모노레포 재구성

## 목표
파편화된 에이전트 학습/프로젝트를 `~/dev/agents/` pnpm workspace로 통합

## 현재 상태 (파편)
- `~/dev/agents/morning-brief/` — 실전 에이전트 (SDK 코드)
- `~/hq/15_Projects/agent-harness/` — 개념 문서 + 학습 노트 + 튜토리얼 + step 코드
- `~/hq/20_Learn/claude-code/` — M01~M12 인터랙티브 교안 + 실습 코드

## 목표 구조

```
~/dev/agents/                        ← pnpm workspace 루트
├── pnpm-workspace.yaml
├── package.json                     ← 공통 devDeps (tsx, typescript)
├── tsconfig.base.json
│
├── packages/
│   └── shared/                      ← 공통 유틸 (평가 루프, 로깅)
│
├── services/
│   └── morning-brief/               ← 실전 에이전트
│
├── learning/                        ← 워크스페이스 밖
│   ├── .claude/skills/m01~m12/      ← 인터랙티브 교안
│   ├── src/                         ← 실습 코드 (step*.ts + m0*/*.ts 통합)
│   ├── notes/                       ← 학습 노트 통합
│   ├── templates/                   ← 학습 템플릿
│   └── package.json
│
└── docs/                            ← 개념 문서, 튜토리얼, 치트시트
```

## 이동 계획

### Phase 1: 모노레포 세팅
- pnpm-workspace.yaml 생성
- tsconfig.base.json 생성
- packages/, services/ 구조 세팅
- morning-brief → services/morning-brief 이동

### Phase 2: 학습 자료 통합
- `hq/20_Learn/claude-code/` → `learning/` 이동
  - .claude/skills/ → learning/.claude/skills/
  - src/ → learning/src/
  - notes/ → learning/notes/
- `hq/15_Projects/agent-harness/` → 분리 이동
  - project/step*.ts → learning/src/ (중복 제거)
  - notes/ → learning/notes/
  - concepts/ → docs/
  - tutorial.md → docs/

### Phase 3: hq 정리
- `hq/15_Projects/agent-harness/` → README 포인터만 남김
- `hq/20_Learn/claude-code/` → README 포인터만 남김

## 중복 처리
- harness/project/step*.ts ≈ claude-code/src/m0*/ → step 코드 기준 유지, m0* 교안은 스킬로 유지

## 학습 워크플로우
1. `cd ~/dev/agents/learning`
2. Claude Code 실행
3. `/m01-hello-agent` → 교안 따라 실습
4. `npx tsx src/step1-hello.ts` → 실행
5. notes/에 정리
