---
title: Harness Report 분석 결과 (2026-03-28)
date: 2026-03-28
status: backlog
---

# Harness Report (최근 30일)

## 요약
- **컨벤션 주입에 유령 데이터가 섞여 있다** — 빈 이름("")이 311회, "tsx"/"ts"/"api-layer" 같은 키워드가 컨벤션명으로 잡히고 있음. 수집 로직 버그.
- **code-principles.md가 140회 주입에 100KB** — 회당 718B, 가장 무거운 컨벤션. 컨텍스트 비용 최대 소비원.
- **deprecated 스킬이 여전히 호출되고 있다** — `brainstorming`(6회), `writing-plans`(2회), `superpowers:brainstorm`(3회)는 deprecated 버전.

## 스킬 사용

### Top 5
1. `fe:fe-principles` (25회) — FE 작업 시 컨벤션 로드. 가장 핵심 스킬.
2. `session-manager:save` (16회) — 세션 저장. 습관화됨.
3. `superpowers:brainstorming` (14회) — 설계 전 브레인스토밍. 잘 쓰이고 있음.
4. `dev:git-commit-messages` (9회) — 커밋 메시지 생성.
5. `superpowers:writing-plans` (9회) — 구현 계획 작성.

### 문제점
- **deprecated 중복 호출**: `brainstorming`(6) + `superpowers:brainstorm`(3) = 9회가 deprecated 버전으로 호출됨. `superpowers:brainstorming`(14)과 합치면 총 23회인데 39%가 구버전 경유.
- 마찬가지로 `writing-plans`(2) + `subagent-driven-development`(2)도 deprecated.
- `session-manager:done`이 3회뿐 — `/save`(16)에 비해 완료 처리가 적음. 작업을 저장만 하고 마무리를 안 하는 패턴.

### 안 쓰이는 스킬
- `fe:review`(0회), `fe:refactor`(0회) — FE 코드 리뷰/리팩토링 스킬이 전혀 안 쓰임. `/simplify`(4회)로 대체하고 있는 것으로 보임.
- `recap`(0회) — 일일 리캡 미사용.

## 컨벤션 주입

### 정상 데이터

| 컨벤션 | 횟수 | 총 바이트 | 회당 바이트 |
|--------|------|----------|-----------|
| coding-style.md | 437 | 7,199B | 16B |
| code-principles.md | 140 | 100,595B | **718B** |
| api-layer.md | 126 | 14,473B | 115B |
| folder-structure.md | 78 | 10,010B | 128B |
| error-handling.md | 31 | 0B | 0B |

### 이상 데이터 (수집 버그)
- `""` (빈 이름): 311회 — raw_data에서 `injected_conventions` 파싱 시 빈 문자열이 들어가고 있음
- `tsx`(41), `ts`(23), `api-layer`(5) — 키워드가 컨벤션명으로 잘못 기록됨
- `error-handling.md` 31회인데 0B — 주입은 감지됐지만 바이트 기록 실패

### 컨텍스트 비용 분석
- `code-principles.md`가 전체 바이트의 **76%** 차지 (100KB / 132KB). 140회 주입이면 세션당 상당한 컨텍스트 소비.

## Config 변화
- 3/23에 rules 3개(nextjs, react, typescript) 추가 → 3/24에 전부 제거. **1일 만에 롤백**.
- 3/23에 ishopcare CLAUDE.md 추가 → 3/24 제거. 같은 맥락의 롤백.
- 3/25에 `~/dev/ai/CLAUDE.md` 추가.
- **현재 하네스 규모**: rules 8, hooks 5, mcp 1, claude_md 2 — 최근 순증감 거의 없음. 안정기.

## 개선 제안

### 1. fe-workflow 수집 로직 버그 수정
`injected_conventions`에 빈 문자열과 키워드가 섞이고 있음. `fe-convention-prompt.sh`에서 컨벤션 파일명과 키워드를 분리하는 파싱 로직을 확인해야 한다. 전체 데이터의 **29%**(375/1192)가 노이즈.

### 2. code-principles.md 컨텍스트 비용 절감
140회 주입에 100KB. 이 파일이 통째로 주입되고 있다면, 키워드별로 관련 섹션만 선택 주입하도록 변경하면 회당 718B → 100~200B로 줄일 수 있음.

### 3. deprecated 스킬 리다이렉트 강화
deprecated 스킬이 전체 호출의 17%(23/138)를 차지. deprecated 스킬의 description에 "이 스킬 대신 X를 사용하세요"만 넣으면 superpowers 플러그인에서 자동 리다이렉트됨. 현재 리다이렉트가 작동하지 않는 이유를 확인.

### 4. `/done` 사용률 개선
`/save` 16회 vs `/done` 3회. 작업 완료 시 자가학습이 실행되지 않고 있음. `/save` 후 자연스럽게 `/done`을 안내하는 흐름을 추가하거나, Stop 훅에서 "완료 처리 안 한 active 파일" 감지 → 알림.

### 5. `fe:review`, `fe:refactor` 미사용 원인 파악
0회 사용인데, 코드 리뷰가 필요 없어서인지 아니면 트리거가 안 되는 건지 확인. `/simplify`가 대체하고 있다면 역할 정리가 필요.
