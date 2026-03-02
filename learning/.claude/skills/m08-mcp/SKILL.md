---
name: m08-mcp
description: "Claude Agent SDK M08 학습 모듈. mcpServers 옵션으로 외부 시스템(브라우저, DB 등)을 에이전트에 연동한다. '/m08-mcp', 'M08 시작', 'mcp 학습' 요청에 사용."
---

# M08: MCP — 외부 시스템 연동

## STOP PROTOCOL

Phase A → ⛔ STOP → 학습자 응답 → Phase B. 절대 자동 진행하지 않는다.

---

## 학습 목표

- MCP(Model Context Protocol) 개념과 아키텍처를 이해한다
- `mcpServers` 옵션으로 MCP 서버를 에이전트에 연결할 수 있다
- 빌트인 도구와 MCP 도구의 차이를 안다
- 플러그인의 `.mcp.json`과 SDK `mcpServers`의 관계를 안다

## Block 목차

| Block | 주제 | 파일 |
|:-----:|------|------|
| 0 | MCP 아키텍처 — 프로토콜과 서버 구조 | `references/block0-mcp-architecture.md` |
| 1 | MCP 서버 연결 — mcpServers 옵션 | `references/block1-mcp-connect.md` |
| 2 | 실용 패턴 — 파일시스템, 데이터베이스, 웹 | `references/block2-mcp-patterns.md` |

## 시작

> "Block 0부터 시작하겠습니다" 라고 말하면 진행을 시작한다.
