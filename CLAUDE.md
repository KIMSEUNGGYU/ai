# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

AI 올인원 모노레포 — Claude Agent SDK 기반 자동화 서비스 + Claude Code 플러그인 + 학습 자료

## 구조

```
~/dev/ai/
├── packages/shared/           ← @agents/shared 공통 유틸
├── services/                  ← TS 서비스 (pnpm workspace)
│   ├── morning-brief/         ← 모닝 브리프 에이전트
│   ├── fe-auto/               ← FE 자동화 에이전트
│   └── cc-monitor/            ← Claude Code 사용 모니터링
├── plugins/                   ← Claude Code 플러그인 소스
│   ├── session-manager/       ← 세션/작업 관리 (v0.9.0)
│   └── fe-workflow/           ← FE 개발 컨벤션 + 리뷰 (v0.18.1)
├── dotfiles/                  ← 심링크 대상 (~/.claude/, ~/.openclaw/)
├── learning/                  ← 워크스페이스 밖 (npm 패키지 아님)
├── docs/                      ← 개념 문서
└── .ai/                       ← 작업 관리
    ├── active/                ← 진행 중 작업
    ├── specs/                 ← 설계 + 구현 계획
    ├── backlog/               ← 대기 중 작업 + 아이디어
    └── CHANGELOG.md           ← 전체 작업 이력
```

## 워크스페이스

- **pnpm workspace** (`packages/*` + `services/*`)
- `learning/`, `plugins/`, `dotfiles/`는 워크스페이스 밖
- 공통 코드 → `packages/shared/` (`@agents/shared`)
- 새 에이전트 → `services/{에이전트명}/`

## 실행

```bash
pnpm morning              # morning-brief 실행
pnpm fe-auto              # fe-auto 실행 (unset CLAUDECODE 포함)
pnpm cc-monitor           # cc-monitor dev 서버
unset CLAUDECODE          # SDK 에이전트 직접 실행 시 필수
```

## 컨벤션

- TypeScript (ESModule, strict)
- tsconfig.base.json 상속 (`"extends": "../../tsconfig.base.json"`)
- 모델: haiku (비용 절약), 필요시 sonnet
- SDK: `@anthropic-ai/claude-agent-sdk`
- MCP: 글로벌 설정 자동 사용

## 플러그인

소스는 `plugins/`에, 캐시는 `~/.claude/plugins/cache/gyu-plugins/`에 위치.
수정 후 `plugin.json` 버전 올리기 → push → `claude plugin update "session-manager@gyu-plugins"`.

## GitHub

- 레포: `KIMSEUNGGYU/ai` (private)
- push 시 `gh auth switch --user KIMSEUNGGYU` 필요 (회사 계정과 전환)
- `learning/agent-study/`는 git subtree (KIMSEUNGGYU/agent-study에서 --squash로 통합)

## 작업 관리

- `.ai/`에서 자체 관리 (hq 아님)
- **계획 문서는 `docs/plans/` 대신 `.ai/specs/`에 저장**
