# OpenClaw 아키텍처 정리

## 전체 구조

```
┌─────────────────────────────────────────────────┐
│                   Gateway                        │
│  (단일 장기 실행 프로세스, WS 서버 :18789)         │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ WhatsApp │  │ Telegram │  │ Discord  │ ...   │
│  │ (Baileys)│  │ (grammY) │  │          │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │             │
│       ▼              ▼              ▼             │
│  ┌──────────────────────────────────────┐        │
│  │         라우팅 엔진 (Bindings)        │        │
│  │  채널 → accountId → peer → agentId   │        │
│  └──────────────────┬───────────────────┘        │
│                     │                            │
│       ┌─────────────┼─────────────┐              │
│       ▼             ▼             ▼              │
│  ┌────────┐   ┌────────┐   ┌────────┐           │
│  │Agent A │   │Agent B │   │Agent C │           │
│  │(main)  │   │(coding)│   │(family)│           │
│  └────────┘   └────────┘   └────────┘           │
│                                                  │
│  클라이언트: macOS앱 / CLI / WebUI / 노드(iOS등)  │
└─────────────────────────────────────────────────┘
```

## 핵심 컴포넌트

### 1. Gateway
- **역할**: 모든 메시징 채널을 소유하는 단일 데몬
- **프로토콜**: WebSocket (JSON 프레임), 포트 18789
- **1 호스트 = 1 Gateway** (WhatsApp 세션 독점)
- 이벤트 기반: agent, chat, presence, health, heartbeat, cron

### 2. Agent (에이전트)
각 에이전트는 완전 격리된 "뇌":
- **Workspace**: 파일, AGENTS.md, SOUL.md, USER.md, 스킬
- **State Dir**: `~/.openclaw/agents/<id>/agent` (인증, 모델 설정)
- **Session Store**: `~/.openclaw/agents/<id>/sessions` (대화 기록)
- **Auth Profiles**: 에이전트별 독립 (공유 안 됨)

### 3. 라우팅 (Bindings)
메시지 → 에이전트 매핑, 우선순위:
1. peer 매칭 (특정 DM/그룹)
2. guildId + roles (Discord)
3. accountId
4. 채널별 와일드카드
5. 기본 에이전트 (fallback)

### 4. 에이전트 루프
```
메시지 수신 → 세션 해석 → 컨텍스트 조립 → 모델 추론
→ 도구 실행 → 스트리밍 응답 → 영속화
```
- 세션별 직렬화 (동시 실행 방지)
- pi-agent-core 런타임 사용
- 스트림: lifecycle / assistant / tool

### 5. 스킬 시스템
- 에이전트별: `workspace/skills/`
- 공유: `~/.openclaw/skills/`
- 3단계 로딩: 메타데이터 → 본문 → 번들 리소스

### 6. 메모리
**플레인 마크다운 파일이 진실의 원천:**
- `memory/YYYY-MM-DD.md` — 일일 로그 (오늘 + 어제 자동 로드)
- `MEMORY.md` — 장기 기억 (큐레이션)
- 도구: `memory_search` (시맨틱 검색), `memory_get` (직접 읽기)
- 벡터 검색 지원 (OpenAI/Gemini/로컬 임베딩)
- 자동 메모리 플러시: 컴팩션 직전에 기억 저장 유도

### 7. 세션 관리
- DM: 기본적으로 모든 DM이 하나의 세션 공유 (`dmScope: main`)
- 그룹: 각 그룹별 독립 세션
- 리셋: 매일 새벽 4시 자동 리셋 (설정 가능)
- 영속화: JSONL 트랜스크립트

## 멀티 에이전트 패턴

### 채널별 분리
```json5
bindings: [
  { agentId: "chat", match: { channel: "whatsapp" } },
  { agentId: "opus", match: { channel: "telegram" } },
]
```

### 계정별 분리 (Telegram 봇 2개)
```json5
channels: {
  telegram: {
    accounts: {
      default: { botToken: "..." },
      alerts: { botToken: "..." },
    }
  }
}
```

### 특정 대화 오버라이드
```json5
bindings: [
  // 특정 DM만 Opus로
  { agentId: "opus", match: { channel: "whatsapp", peer: { kind: "direct", id: "+82..." } } },
  // 나머지는 기본
  { agentId: "chat", match: { channel: "whatsapp" } },
]
```

## 설정 파일
- 메인 설정: `~/.openclaw/openclaw.json` (JSON5)
- 에이전트 워크스페이스: `~/.openclaw/workspace/`
- 인증: `~/.openclaw/credentials/`

## Claude Agent SDK vs OpenClaw 비교

| 항목 | Claude Agent SDK | OpenClaw |
|------|-----------------|----------|
| 실행 방식 | 코드로 에이전트 정의 (TS) | 마크다운으로 행동 정의 |
| 채널 | 없음 (CLI/API) | 30+ 메신저 내장 |
| 메모리 | 직접 구현 | 내장 (마크다운 + 벡터) |
| 도구 | MCP + 코드 | 스킬(마크다운) + 도구(코드) |
| 멀티 에이전트 | 코드로 오케스트레이션 | 설정(bindings)으로 라우팅 |
| 적합한 경우 | 커스텀 파이프라인 | 채팅 기반 어시스턴트 |
