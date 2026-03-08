# agents — SDK 에이전트 모노레포

## 구조

```
~/dev/agents/
├── packages/shared/           ← @agents/shared 공통 유틸
├── services/morning-brief/    ← 모닝 브리프 에이전트 (MVP)
├── learning/                  ← 워크스페이스 밖 (npm 패키지 아님)
│   ├── claude-code/           ← SDK 학습 (교안+코드+노트)
│   ├── agent-study/           ← Claude Code 사용법 (subtree)
│   └── openclaw/              ← OpenClaw 학습 (스킬+워크스페이스+노트)
├── docs/                      ← 개념 문서
└── .ai/                       ← 작업 관리 (active/specs/archive)
```

## 워크스페이스

- **pnpm workspace** (`packages/*` + `services/*`)
- `learning/`은 워크스페이스 밖 — npm 패키지가 아닌 학습 자료
- 공통 코드 → `packages/shared/` (`@agents/shared`)
- 새 에이전트 → `services/{에이전트명}/`

## 실행

```bash
pnpm morning          # morning-brief 실행
unset CLAUDECODE      # SDK 에이전트 실행 전 필수
```

## 컨벤션

- TypeScript (ESModule, strict)
- tsconfig.base.json 상속 (`"extends": "../../tsconfig.base.json"`)
- 모델: haiku (비용 절약), 필요시 sonnet
- SDK: `@anthropic-ai/claude-agent-sdk`
- MCP: 글로벌 설정 자동 사용

## GitHub

- 레포: `KIMSEUNGGYU/agents` (private)
- push 시 `gh auth switch --user KIMSEUNGGYU` 필요 (회사 계정과 전환)
- `learning/agent-study/`는 git subtree (KIMSEUNGGYU/agent-study에서 --squash로 통합)

## 작업 관리

- `.ai/active/` — 진행 중 작업
- `.ai/specs/` — 설계 + 구현 계획 (superpowers 계획 문서 포함)
- `.ai/backlog/` — 백로그 (아이디어, 미착수 계획)
- `.ai/archive/` — 완료된 작업
- hq가 아닌 이 프로젝트 내에서 자체 관리
- **계획 문서는 `docs/plans/` 대신 `.ai/specs/`에 저장**
