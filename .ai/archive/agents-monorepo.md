# agents 모노레포 구축

## 스펙
- `.ai/specs/agents-monorepo.md`
- 파편화된 에이전트 학습/프로젝트를 pnpm workspace로 통합

## 작업
- [x] Phase 1: pnpm workspace 세팅 (packages/services 구조)
- [x] Phase 2: 학습 자료 통합 (hq → learning/)
- [x] Phase 3: hq 정리 (원본 폴더 삭제)
- [x] agent-study 통합 (git subtree로 히스토리 포함)
- [x] GitHub 레포 생성 (KIMSEUNGGYU/agents, private)
- [x] learning/ 학습 트랙별 구조 정리 (claude-code, agent-study)
- [x] pc-map.md 업데이트 (agents 레포 매핑 추가)
- [x] CLAUDE.md 작성 (agents 프로젝트용)
- [x] .ai 파일 마이그레이션 (hq → agents 자체 관리)

## 현재 컨텍스트
모든 작업 완료. 최종 구조:
```
~/dev/agents/
├── packages/shared/
├── services/morning-brief/
├── learning/
│   ├── claude-code/      ← SDK 학습 (교안+코드+노트)
│   └── agent-study/      ← Claude Code 사용법 (과제2~6, subtree)
├── docs/                 ← 개념 문서
├── .ai/                  ← 작업 관리 (자체)
│   ├── active/           ← agents-monorepo.md, morning-brief.md
│   └── specs/            ← agents-monorepo.md, daily-sync-plugin.md
└── CLAUDE.md
```

## 결정사항
- pnpm workspace 구조 (packages + services) — FE 모노레포 경험 활용
- learning/은 워크스페이스 밖 (npm 패키지 아님)
- agent-study는 git subtree --squash로 히스토리 포함 통합
- hq 원본 폴더는 완전 삭제 (포인터 README 불필요)
- GitHub push 시 개인 계정(KIMSEUNGGYU)으로 전환 후 회사 계정 복원
- 작업 문서(.ai/)는 hq가 아닌 agents 프로젝트 내에서 자체 관리

## 메모
- gh auth switch 필요 (회사: seunggyu-ishopcare, 개인: KIMSEUNGGYU)
- .serena가 .gitignore에 추가됨
- hq .ai에는 agents 무관 파일만 남음 (ai-native-pc.md, ai-native.md)

<!-- last-active: 2026-03-02 -->
