# agents Context

## 프로젝트 개요
SDK 에이전트 모노레포 — Claude Agent SDK 기반 자동화 서비스 개발

## 서비스 맵
| 서비스 | 역할 | 상태 |
|--------|------|------|
| services/fe-auto | FE 자동화 에이전트 (Linear→스펙→코드→PR) | 진행 중 |
| services/morning-brief | 모닝 브리핑 에이전트 | 보류 (todo) |
| packages/shared | 공용 모듈 | — |
| learning/ | 학습 자료 (agent-study, claude-code) | — |

## 작업 현황
- **active**: fe-auto (workflow-automation) — Phase 1 SDK 파이프라인
- **active**: openclaw-learn — OpenClaw 프레임워크 학습 + 에이전트 구축
- **todo**: morning-brief, isc-sync (daily-sync-plugin)
- **archive**: agents-monorepo (완료), agent-fundamentals-learn (완료)

## 구조
- 모노레포: pnpm workspace (`packages/*`, `services/*`)
- 언어: TypeScript (ESM)
- 런타임: tsx

## 핵심 결정
- Claude Agent SDK(`@anthropic-ai/claude-agent-sdk`) 기반
- pnpm 워크스페이스 모노레포 구조
- ESM(`"type": "module"`) 채택
