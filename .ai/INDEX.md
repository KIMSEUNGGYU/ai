# agents Context

## 프로젝트 개요
SDK 에이전트 모노레포 — Claude Agent SDK 기반 자동화 서비스 개발

## 서비스 맵
| 서비스 | 역할 | 상태 |
|--------|------|------|
| services/fe-auto | FE 자동화 에이전트 (Linear→스펙→코드→PR) | 진행 중 |
| services/morning-brief | 모닝 브리핑 에이전트 | 보류 (backlog) |
| packages/shared | 공용 모듈 | — |
| learning/ | 학습 자료 (agent-study, claude-code) | — |

## 작업 현황
- **active**: cc-monitor-개선, fe-workflow-개선, leader-review, workflow-분석-자동화

- **backlog**: workflow-automation, openclaw-learn, ai-silo-agent, 멀티모델 오케스트레이션, second-brain-vision, morning-brief, daily-sync-plugin, 해보고싶은거
- 전체 이력: `.ai/CHANGELOG.md`

## 구조
- 모노레포: pnpm workspace (`packages/*`, `services/*`)
- 언어: TypeScript (ESM)
- 런타임: tsx

## 핵심 결정
- Claude Agent SDK(`@anthropic-ai/claude-agent-sdk`) 기반
- pnpm 워크스페이스 모노레포 구조
- ESM(`"type": "module"`) 채택
