---
title: Claude Code 자가학습 개선 — profile.md 도입
status: active
created: 2026-03-08
last-active: 2026-03-08
tags: [plugin, session-manager, self-learning, profile]
---

# Claude Code 자가학습 개선 — profile.md 도입

## 배경
현재 자가학습은 "하지 마/해라" 규칙만 축적 (learnings-*.md).
"왜 이렇게 판단했는지" 의사결정 패턴은 안 남음.
→ AI가 나처럼 판단하려면 profile.md가 필요.

## 두 트랙 병행
- **learnings-*.md** (유지) → 틀리지 않게 (코드 규칙, 교정)
- **profile.md** (신규) → 나처럼 하게 (의사결정 패턴, 스타일)

## profile.md 형식 (안)

```markdown
## 의사결정 성향
- 심플 우선, 문제 생기면 개선 (archive→CHANGELOG, log.json→md)
- 편향 방지 원칙이 효율보다 중요 (멀티모델 유지)
- 한 곳에서 관리 선호 (docs/plans→.ai/specs 통합)

## 작업 스타일
- 브레인스토밍 후 바로 실행
- 선택지 주면 빠르게 결정
- 음성 입력 자주 사용
```

## 구현 범위
1. `~/.claude/rules/profile.md` 생성
2. `/done` Agent 프롬프트 개선
   - 기존: 교정/신규/위반/선호 분류
   - 추가: 의사결정 패턴 추출 ("상황→결정→이유→패턴")
   - "피상적 규칙 금지, 근본 원칙만" 가이드
   - 좋은 예시 vs 나쁜 예시 제공
3. `/done` 시 두 트랙 동시 수행
   - learnings-*.md → 코드/워크플로우 규칙
   - profile.md → 의사결정 패턴

## 미해결
- profile.md가 커지면 어떻게 관리? (카테고리 분리? 요약?)
- AI 응답도 transcript에 포함해야 맥락 파악이 나아지는지
- 세션 요약 단계를 추가할지 (토큰 비용 vs 품질)
