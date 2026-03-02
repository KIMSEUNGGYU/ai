---
tags:
  - claude-code
  - 내부구조
date: 2026-02-22
status: active
---

# Claude Code 내부 데이터 관리 구조

## 핵심 요약

Claude Code는 별도의 상태 API가 없다. 모든 데이터를 **파일 시스템 기반**으로 관리하며, 실시간 상태는 transcript JSONL 파일을 매번 파싱해서 재구성한다.

## ~/.claude/ 전체 구조

```
~/.claude/
├── settings.json              # 전역 설정 (모델, 권한, 플러그인, statusLine)
├── settings.local.json        # 로컬 전용 설정 (git 추적 안됨)
├── history.jsonl              # 사용자 입력 히스토리 (전역)
├── stats-cache.json           # 누적 사용 통계 캐시
├── package-manager.json       # 선호 패키지 매니저
├── keybindings.json           # 키바인딩
│
├── projects/                  # ★ 프로젝트별 세션 transcript
├── sessions/                  # 세션 메타/요약 (임시 .tmp)
├── session-env/               # 세션별 환경 변수
├── debug/                     # 디버그 로그
├── file-history/              # 파일 변경 백업 (undo용)
├── plans/                     # Plan 모드 계획서
├── paste-cache/               # 붙여넣기 캐시
├── ide/                       # IDE 연동 lock 파일
│
├── plugins/                   # 플러그인 (HUD 등)
├── rules/                     # 전역 규칙 (.md)
├── skills/                    # 스킬 정의
├── commands/                  # 커스텀 명령어
└── hooks/                     # Hook 스크립트
```

---

## 1. transcript JSONL — 세션의 모든 것

### 위치

```
~/.claude/projects/{프로젝트키}/{sessionId}.jsonl
```

- **프로젝트키**: 작업 디렉토리 경로의 `/`를 `-`로 치환
  - `/Users/gyu/obsidian-note` → `-Users-gyu-obsidian-note`
- **sessionId**: 세션 시작 시 생성되는 UUID
- **서브에이전트**: `{sessionId}/subagents/agent-{id}.jsonl`에 별도 기록

### 정체

한 세션에서 일어나는 **모든 이벤트**가 JSONL (한 줄 = 하나의 JSON) 형태로 실시간 append된다. Claude Code 프로세스가 직접 기록하며 사용자가 제어할 수 없다.

### 공통 필드

모든 줄에 포함:

```json
{
  "type": "user | assistant | progress | file-history-snapshot",
  "timestamp": "2026-02-22T06:37:27.968Z",
  "sessionId": "ef0c2e6f-...",
  "uuid": "메시지-고유-ID",
  "parentUuid": "부모-메시지-ID",
  "cwd": "/Users/gyu/obsidian-note",
  "version": "2.1.50",
  "gitBranch": "main"
}
```

### 타입별 구조

#### `user` — 사용자 입력 or 도구 결과

```json
// 사용자 실제 입력 (content가 문자열)
{
  "type": "user",
  "message": { "role": "user", "content": "아이디어가 있어..." }
}

// 도구 실행 결과 (content가 배열)
{
  "type": "user",
  "message": {
    "content": [{
      "type": "tool_result",
      "tool_use_id": "toolu_01RCJy...",
      "is_error": false,
      "content": "결과값..."
    }]
  }
}
```

#### `assistant` — Claude 응답 + 도구 호출

```json
{
  "type": "assistant",
  "message": {
    "content": [
      { "type": "text", "text": "텍스트 응답..." },
      {
        "type": "tool_use",
        "id": "toolu_01RCJy...",
        "name": "Read",
        "input": { "file_path": "/path/to/file" }
      }
    ]
  }
}
```

#### `progress` — Hook/Agent 이벤트

```json
// Hook 실행
{ "type": "progress", "data": {
    "type": "hook_progress",
    "hookEvent": "SessionStart",
    "hookName": "SessionStart:clear",
    "command": "node .../session-start.js"
}}

// 에이전트 진행
{ "type": "progress", "data": {
    "type": "agent_progress",
    "agentId": "aad81a7c...",
    "prompt": "탐색 프롬프트..."
}}
```

### 현재 세션 찾는 법

1. `history.jsonl` 마지막 줄의 `sessionId` 확인
2. 같은 프로젝트 폴더에서 가장 최근 수정된 `.jsonl`

---

## 2. history.jsonl — 입력 히스토리

```json
{
  "display": "아이디어가 있어...",
  "pastedContents": {},
  "timestamp": 1771686748338,
  "project": "/Users/gyu/obsidian-note",
  "sessionId": "ef0c2e6f-..."
}
```

- 사용자가 **Enter 친 모든 입력** (명령어 포함)
- 전역 단일 파일 (프로젝트 구분 없이 쌓임)

---

## 3. stats-cache.json — 누적 통계

```json
{
  "dailyActivity": [
    { "date": "2026-02-08", "messageCount": 5519, "sessionCount": 44, "toolCallCount": 942 }
  ],
  "dailyModelTokens": [
    { "date": "2026-02-08", "tokensByModel": { "claude-opus-4-6": 180687 } }
  ],
  "modelUsage": {
    "claude-opus-4-6": {
      "inputTokens": 66218, "outputTokens": 198824,
      "cacheReadInputTokens": 168896663,
      "cacheCreationInputTokens": 14883059
    }
  },
  "totalSessions": 142,
  "totalMessages": 13859,
  "hourCounts": { "22": 18, "23": 13, "0": 11 }
}
```

- Claude Code가 자체 계산하여 캐시
- 일별 활동, 모델별 토큰, 시간대별 사용 패턴

---

## 4. file-history/ — 파일 변경 백업

```
file-history/{세션UUID}/
├── 2b233f8de48ce50b@v1    # 파일해시@버전1 (변경 전 내용)
├── 2b233f8de48ce50b@v2    # 버전2
└── ...
```

- Edit/Write 실행 시마다 **변경 전 파일 내용** 백업
- `/undo` 명령의 데이터 소스

---

## 5. debug/ — 디버그 로그

```
debug/{세션UUID}.txt
```

```
[DEBUG] Getting matching hook commands for SessionEnd
[DEBUG] Hook output does not start with {, treating as plain text
[DEBUG] High write ratio: blit=0, write=19846
```

- Hook 실행, 모드 전환, 업데이트 체크 등 내부 동작

---

## 6. statusline(HUD)이 데이터를 얻는 방법

Claude Code 자체에는 상태 API가 없다. HUD는 **4가지 채널**로 정보를 수집한다.

### 채널 1: stdin (Claude Code → HUD)

~300ms마다 HUD 프로세스를 실행하면서 stdin으로 JSON 전달:

```json
{
  "transcript_path": "~/.claude/projects/.../{세션}.jsonl",
  "cwd": "/Users/gyu/obsidian-note",
  "model": { "id": "claude-opus-4-6", "display_name": "Opus" },
  "context_window": { "used_percentage": 45, "context_window_size": 200000 }
}
```

→ 모델명, 컨텍스트 사용률, transcript 경로

### 채널 2: transcript JSONL 파싱

stdin에서 받은 `transcript_path`를 **매번 전체 파싱**:

| transcript 이벤트 | 추출 정보 |
|---|---|
| `tool_use` (status: running) | 실행 중인 도구 |
| `tool_result` | 완료/에러 상태 |
| `Task` tool_use | 실행 중인 에이전트 |
| `TaskCreate` / `TaskUpdate` | 할일 진행 상황 |
| 첫 timestamp | 세션 시작 시간 |

### 채널 3: 파일시스템 직접 스캔

```
CLAUDE.md:  ~/.claude/CLAUDE.md, {cwd}/CLAUDE.md, {cwd}/.claude/CLAUDE.md ...
Rules:      ~/.claude/rules/*.md (재귀)
MCP:        settings.json → mcpServers, .mcp.json
Hooks:      settings.json → hooks
```

### 채널 4: OAuth API

Anthropic OAuth API → 5시간/7일 사용량 (캐시 60초)

### 정보별 소스 매핑

| HUD 표시 | 소스 |
|---|---|
| `[Opus]` 모델명 | stdin |
| `█████░ 45%` 컨텍스트 | stdin |
| `◐ Edit: auth.ts` 실행 중 도구 | transcript 파싱 |
| `✓ Read ×3` 완료 도구 | transcript 파싱 |
| `◐ explore [haiku]` 에이전트 | transcript 파싱 |
| `▸ Fix bug (2/5)` 할일 | transcript 파싱 |
| `git:(main*)` | git 명령 실행 |
| `██░ 25%` 사용량 | OAuth API |
| `2 CLAUDE.md │ 4 rules` | 파일시스템 스캔 |

---

## 데이터 흐름 전체 그림

```
사용자 입력
  │
  ├──→ history.jsonl          (입력 원문)
  │
  ▼
Claude Code 엔진
  │
  ├──→ projects/{프로젝트}/{세션}.jsonl   (전체 대화 transcript)
  │      ├ user: 사용자 메시지 + tool_result
  │      ├ assistant: Claude 응답 + tool_use
  │      └ progress: hook/agent 이벤트
  │
  ├──→ file-history/{세션}/    (Edit/Write 전 파일 백업)
  ├──→ debug/{세션}.txt        (내부 디버그 로그)
  ├──→ stats-cache.json        (누적 통계 갱신)
  └──→ session-env/{세션}/     (환경 변수)
       │
       │  ~300ms마다
       ▼
    statusline(HUD)
       ├ stdin으로 모델/컨텍스트 수신
       ├ transcript 파싱 → 도구/에이전트/할일 상태
       ├ 파일시스템 스캔 → 환경 설정 개수
       └ OAuth API → 사용량
```
