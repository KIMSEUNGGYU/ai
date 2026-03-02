---
tags:
  - claude-agent-sdk
  - learning
  - hands-on
date: 2026-03-01
status: active
project: claude-agent-sdk-learn
---

# Claude Agent SDK 학습 프로그램

> Claude Agent SDK의 핵심 기능을 12개 모듈로 나눠 인터랙티브하게 학습하는 프로그램.
> "Skills as Curriculum" — Claude와 대화하면서 직접 코드를 작성하고 실행한다.

## 학습 방법

### 1. 환경 설정

```bash
cd ~/hq/20_Learn/claude-code
npm install
```

### 2. 모듈 학습 (인터랙티브)

```bash
# 이 폴더에서 Claude Code 실행 후:
/m01-hello-agent     # ← 교안이 로드되어 인터랙티브 학습 시작
```

### 3. 코드 실행

```bash
# Claude Code 세션 안에서 실행 시:
unset CLAUDECODE && npx tsx src/m01-hello/hello.ts
```

### 4. 학습 노트

실행 후 관찰한 내용을 `notes/` 폴더에 정리.

---

## 커리큘럼

### Part 1: 에이전트 루프 기초 (Week 1)

| Module | 주제 | SDK 핵심 | 공식 문서 | 상태 |
|:------:|------|----------|-----------|:----:|
| M01 | Hello Agent — 설치와 첫 실행 | `query()` | Overview, Quickstart | ⬜ |
| M02 | Tools — 에이전트에게 능력 부여 | `tools`, `allowedTools` | Built-in tools | ⬜ |
| M03 | System Prompt — 역할 정의 | `systemPrompt` | Memory/System Prompts | ⬜ |

### Part 2: 제어와 안전장치 (Week 2)

| Module | 주제 | SDK 핵심 | 공식 문서 | 상태 |
|:------:|------|----------|-----------|:----:|
| M04 | Permissions — 권한과 안전장치 | `permissionMode` | Permissions, User Input | ⬜ |
| M05 | Hooks — 라이프사이클 개입 | `hooks` | Hooks | ⬜ |
| M06 | Sessions — 기억과 맥락 유지 | `resume`, `session_id` | Sessions | ⬜ |

### Part 3: 확장과 위임 (Week 3)

| Module | 주제 | SDK 핵심 | 공식 문서 | 상태 |
|:------:|------|----------|-----------|:----:|
| M07 | Subagents — 작업 위임과 병렬 처리 | `agents` | Subagents | ⬜ |
| M08 | MCP — 외부 시스템 연동 | `mcpServers` | MCP | ⬜ |
| M09 | Custom Tools — 나만의 도구 만들기 | Custom tool definitions | Custom Tools | ⬜ |

### Part 4: 프로덕션과 통합 (Week 4)

| Module | 주제 | SDK 핵심 | 공식 문서 | 상태 |
|:------:|------|----------|-----------|:----:|
| M10 | Streaming & User Input — 대화형 에이전트 | Streaming, `userInput` | Streaming, User Input | ⬜ |
| M11 | Hosting — 프로덕션 배포 | Cost tracking, hosting | Hosting, Cost Tracking | ⬜ |
| M12 | 통합 프로젝트 — 나만의 하네스 | 전체 조합 | Skills, Plugins | ⬜ |

---

## 폴더 구조

```
claude-code/
├── README.md                    ← 이 파일 (커리큘럼 로드맵)
├── package.json
├── tsconfig.json
├── .env                         ← API 키 설정
├── .gitignore
├── src/
│   ├── m01-hello/
│   │   └── hello.ts             ← M01 실행 코드
│   ├── m02-tools/               ← (추후 추가)
│   └── ...
├── notes/                       ← 학습 노트 (옵시디언 연동)
│   └── (모듈 진행하면서 추가)
└── .claude/
    ├── CLAUDE.md                ← 프로젝트 컨텍스트
    └── skills/
        ├── m01-hello-agent/     ← M01 교안
        │   ├── SKILL.md
        │   └── references/
        │       ├── block0-setup.md
        │       ├── block1-first-agent.md
        │       └── block2-message-stream.md
        └── m02-tools/           ← (추후 추가)
```

## 기존 자료와의 관계

| 기존 자료 | 역할 |
|-----------|------|
| `15_Projects/agent-harness/tutorial.md` | M01~M08 콘텐츠 원본 소스 |
| `15_Projects/agent-harness/concepts/` | 개념 레퍼런스 (심화 학습 시 참조) |
| `15_Projects/agent-harness/project/` | 기존 실습 코드 (레거시 보존) |

## 문제 해결

| 에러 | 원인 | 해결 |
|------|------|------|
| `Claude Code cannot be launched inside another...` | Claude Code 세션 안에서 실행 | `unset CLAUDECODE` |
| `process exited with code 1` | 인증 또는 중첩 세션 | `DEBUG_CLAUDE_AGENT_SDK=1` 로 디버그 |
| `Module not found` | SDK 미설치 | `npm install` |
| 비용이 걱정 | Opus 기본 $0.33/call | `model: "haiku"` 설정 |

## 참고 링크

- [Agent SDK 공식 문서](https://platform.claude.com/docs/en/agent-sdk/)
- [SDK TypeScript GitHub](https://github.com/anthropics/claude-agent-sdk-typescript)
- [SDK Demos](https://github.com/anthropics/claude-agent-sdk-demos)
- [camp-1 포맷 참조](https://github.com/ai-native-camp/camp-1)
