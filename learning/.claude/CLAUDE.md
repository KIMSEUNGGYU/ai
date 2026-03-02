# Claude Agent SDK 학습 프로그램

## 프로젝트 개요

Claude Agent SDK의 핵심 기능을 12개 모듈로 나눠 인터랙티브하게 학습하는 프로그램.
각 모듈은 `.claude/skills/m0N-*/SKILL.md` 형태의 교안으로, `/m01-hello-agent` 같은 커맨드로 실행.

## 구조

```
src/m0N-*/       ← 모듈별 실행 코드
notes/           ← 학습 노트 (실행 후 정리)
.claude/skills/  ← 인터랙티브 교안
```

## 실행 방법

```bash
# Claude Code 세션 안에서 실행 시 CLAUDECODE unset 필요
unset CLAUDECODE && npx tsx src/m01-hello/hello.ts
```

## 학습 방식

1. `/m01-hello-agent` 호출 → Phase A: 개념 + 코드 작성
2. 코드 실행 → 관찰
3. Phase B: 퀴즈 + 피드백 → 다음 블록

## 비용 참고

- SDK는 Claude Code CLI를 서브프로세스로 실행 (기존 구독 사용)
- `model: "haiku"` 설정으로 비용 절약 가능
