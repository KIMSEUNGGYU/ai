# PC 폴더 지도

AI가 PC 전체 구조를 이해하기 위한 참조 파일.

## 원칙

3폴더 체계: **work**(회사) + **dev**(개인) + **hq**(지식)
두 PC 모두 동일한 구조 사용.

## 멀티 PC

| PC | 용도 | 비고 |
|----|------|------|
| 이 PC (Mac) | 메인 개발 | Claude Code, 회사 업무 |
| 다른 PC | OpenClaw Gateway | `~/.openclaw/`에 설치, 동일 3폴더 구조 |

### 다른 PC 고유 경로
- `~/.openclaw/` — OpenClaw 설정 + 워크스페이스
- `~/.openclaw/workspace/` — 에이전트 워크스페이스 (SOUL.md, AGENTS.md 등)
- `~/.openclaw/workspace/skills/` — 커스텀 스킬

## 홈 디렉토리 구조

```
~/
├── work/          ← 회사 코드
│   ├── ishopcare-frontend/
│   ├── ishopcare-frontend-second/
│   ├── ishopcare-retool-server/
│   ├── claude-plugins-node-main/
│   ├── scripts/               (인프라 유틸리티)
│   └── task/                  (사내 과제 모음)
├── dev/           ← 개인 코드 (개발, 학습, 실험 전부)
│   ├── ai-ax/                 (Claude Code 플러그인 레포)
│   └── agents/                (SDK 에이전트 모노레포, pnpm workspace)
│       ├── packages/shared/   (@agents/shared 공통 유틸)
│       ├── services/morning-brief/ (모닝 브리프 에이전트)
│       ├── learning/          (학습 트랙: claude-code, agent-study)
│       ├── docs/              (개념 문서)
│       └── .ai/               (작업 관리 — 자체 관리)
├── hq/            ← 지식 본부 (Obsidian 볼트)
│   ├── 00_Inbox/
│   ├── 01_TODO/
│   ├── 05_Ideas/
│   ├── 10_Work/
│   ├── 15_Projects/
│   ├── 20_Learn/
│   ├── 30_Career/
│   ├── 40_System/
│   ├── 80_Archive/
│   ├── 99_System/
│   └── 회고/
└── conductor/     ← Conductor 앱 관리 (터치 안 함)
```

## 폴더 역할

| 폴더 | 역할 | CLAUDE.md |
|------|------|-----------|
| `~/work/` | 회사 프로젝트 (ishopcare) | 각 프로젝트 내부 |
| `~/dev/` | 개인 개발/학습/실험 전부 | 각 프로젝트 내부 |
| `~/hq/` | 지식 본부 (노트, TODO, 아이디어) | `~/hq/CLAUDE.md` |
| `~/conductor/` | Conductor 앱 (자동 관리) | — |

## 경로 규칙

### 코드
- 회사 프로젝트 → `~/work/`
- 개인 프로젝트 → `~/dev/`
- 새 프로젝트 생성 시: 회사면 work, 그 외 전부 dev

### 지식 (Obsidian)
- 학습 노트/TIL → `~/hq/00_Inbox/`
- 프로젝트 작업 문서 → 해당 프로젝트의 `.ai/`
- 아이디어 → `~/hq/05_Ideas/`
- TODO → `~/hq/01_TODO/`
- 업무 관련 → `~/hq/10_Work/`
- 프로젝트 기록 → `~/hq/15_Projects/`
- 학습 정리 → `~/hq/20_Learn/`
- 커리어 → `~/hq/30_Career/`
- 시스템/설정 → `~/hq/40_System/`
- 회고 → `~/hq/회고/`

## 프로젝트 ↔ 노트 매핑

| 프로젝트 (코드) | 노트 (지식) |
|----------------|-------------|
| `~/work/ishopcare-frontend/` | `~/hq/10_Work/` |
| `~/dev/ai-ax/` | `~/hq/15_Projects/` |
| `~/dev/agents/` | `~/dev/agents/.ai/` (자체 관리) |

## 플러그인 소스 매핑

**절대 `~/.claude/plugins/cache/`를 직접 수정하지 않는다.** 항상 소스 레포를 수정.

| 플러그인 | 소스 레포 | 성격 |
|---------|----------|------|
| `session-manager` | `~/dev/ai-ax/session-manager/` | 개인 |
| `fe` (fe-workflow) | `~/dev/ai-ax/fe-workflow/` | 개인 |
| `dev` (dev-workflow) | `~/work/claude-plugins-node-main/dev-workflow/` | 회사 |
| `work-recap` | `~/work/claude-plugins-node-main/isc-sync/` | 회사 |

**플러그인 수정 워크플로우:**
1. 소스 레포에서 수정
2. `plugin.json` version 올리기
3. git commit + push
4. `claude plugin update`로 cache 갱신
