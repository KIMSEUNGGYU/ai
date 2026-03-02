# agents Context

## 프로젝트 개요
SDK 에이전트 모노레포 — Claude Agent SDK 기반 자동화 서비스 개발

## 서비스 맵
| 서비스 | 역할 | 기술스택 |
|--------|------|----------|
| services/morning-brief | 모닝 브리핑 에이전트 | Claude Agent SDK, tsx |
| packages/shared | 공용 모듈 | TypeScript |
| learning/ | 학습 자료 (agent-study, claude-code) | — |

## 구조
- 모노레포: pnpm workspace (`packages/*`, `services/*`)
- 언어: TypeScript (ESM)
- 런타임: tsx

## 핵심 결정
- Claude Agent SDK(`@anthropic-ai/claude-agent-sdk`) 기반
- pnpm 워크스페이스 모노레포 구조
- ESM(`"type": "module"`) 채택
