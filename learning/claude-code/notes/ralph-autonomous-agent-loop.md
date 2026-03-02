---
tags:
  - ralph
  - agent-pattern
  - autonomous-loop
date: 2026-03-02
status: active
source: https://github.com/snarktank/ralph
project: claude-agent-sdk-learn
---

# Ralph — 자율 AI 에이전트 루프 패턴

> PRD 항목이 모두 완료될 때까지 AI 에이전트를 반복 실행하는 자동화 패턴.
> Geoffrey Huntley의 Ralph 패턴에서 영감.

## 핵심 개념

**세션을 이어서 하는 게 아니라, 매번 새 에이전트가 떠서 공유 파일을 읽고 다음 작업을 수행한다.**

```
❌ 세션 이어받기: A → A → A → A  (같은 뇌가 계속, 컨텍스트 누적)
✅ Ralph:        A₁ → A₂ → A₃ → A₄  (매번 새 뇌 + 공유 파일로 기억)
```

컨텍스트 윈도우 한계를 **세션 연장**이 아니라 **파일 기반 기억**으로 우회하는 패턴.

## 동작 흐름

```
PRD 작성 → prd.json 변환 → ralph.sh 실행 → 완료될 때까지 반복
```

매 반복(iteration)마다:

1. **새 AI 인스턴스**가 깨끗한 컨텍스트로 시작
2. 공유 파일(prd.json, progress.txt, AGENTS.md) 읽기
3. 미완료 스토리 중 **최우선 항목 선택**
4. 구현 → 타입체크/테스트 → 통과하면 **커밋**
5. `prd.json` 상태 업데이트, `progress.txt`에 학습 기록
6. 모든 스토리 완료 시 종료

## 공유 기억 저장소

```
반복 1          반복 2          반복 3          반복 4
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 새 AI   │    │ 새 AI   │    │ 새 AI   │    │ 새 AI   │
│ (빈 뇌) │    │ (빈 뇌) │    │ (빈 뇌) │    │ (빈 뇌) │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
 ┌────────────────────────────────────────────────────┐
 │  공유 기억 저장소 (Git에 커밋됨)                      │
 │  - prd.json      → "뭐 해야 하지?"                  │
 │  - progress.txt  → "지금까지 뭘 했지?"               │
 │  - AGENTS.md     → "이 프로젝트 패턴이 뭐지?"        │
 │  - git log       → 실제 코드 변경 이력               │
 └────────────────────────────────────────────────────┘
```

| 파일 | 역할 |
|------|------|
| `prd.json` | 스토리 목록 + 완료 상태 추적 |
| `progress.txt` | 반복별 학습 내용 (append-only) |
| `AGENTS.md` | 프로젝트 패턴, 주의사항 기록 |
| `ralph.sh` | bash 루프 (Amp/Claude Code 지원) |

## 일반 에이전트 vs Ralph

| 일반 에이전트 | Ralph |
|-------------|-------|
| 하나의 긴 세션 | 매번 새 세션 |
| 컨텍스트가 점점 쌓여서 느려짐 | 항상 깨끗한 컨텍스트 |
| 128K 넘으면 잘림/망가짐 | 무한 반복 가능 |
| 한 번 삐끗하면 연쇄 실패 | 반복마다 리셋, 자기 치유 |

## PRD 작성 원칙

각 스토리는 **한 번의 컨텍스트 윈도우에서 완료 가능한 크기**여야 한다.

```
✅ 좋은 예: "DB 칼럼 추가", "버튼 컴포넌트 생성", "서버 액션 업데이트"
❌ 나쁜 예: "전체 대시보드 구축", "인증 시스템 추가"
```

## 실행 예시

```bash
# 설정 (3가지 옵션 중 택1)
# 1) 프로젝트에 직접 복사
mkdir -p scripts/ralph && cp ralph.sh scripts/ralph/

# 2) Amp 전역 설치
cp -r skills/prd ~/.config/amp/skills/

# 3) Claude Code 마켓플레이스
/plugin marketplace add snarktank/ralph

# 실행
./scripts/ralph/ralph.sh 10   # 최대 10회 반복
```

## 시나리오 워크스루 (agent-harness 예시)

### PRD

```json
{
  "stories": [
    { "id": "S1", "title": "스트리밍 진행률 표시", "passes": false },
    { "id": "S2", "title": "에러 핸들링 패턴", "passes": false },
    { "id": "S3", "title": "대화 메모리 구현", "passes": false },
    { "id": "S4", "title": "README 문서화", "passes": false }
  ]
}
```

### 반복 1

- prd.json 읽기 → S1이 첫 미완료 스토리
- 기존 코드 패턴 파악 → `step7-streaming.ts` 작성
- 타입체크/실행 성공 → 커밋
- progress.txt: "기존 step들이 query() 패턴을 따름"
- AGENTS.md: "step{N}-{name}.ts 네이밍 규칙"

### 반복 2

- **완전히 새 AI** → progress.txt/AGENTS.md 읽어서 맥락 복구
- S2 구현 → 실행 실패 → mock으로 수정 → 성공 → 커밋
- progress.txt: "API key 없이는 실제 에러 테스트 불가"

### 반복 3~4

- 같은 패턴으로 S3, S4 완료
- 모든 passes === true → `<promise>COMPLETE</promise>` → 종료

## 실습: 플러그인 일괄 업그레이드 (2026-03-02)

대상: `~/work/claude-plugins-node-main/` (ishopcare 플러그인 모노레포)

### 작업 내용

6개 플러그인의 plugin.json에 `author`, `repository` 필드 추가 + marketplace.json 누락 등록.

| 스토리 | 대상 | 버전 변화 |
|--------|------|-----------|
| S1 | dev-workflow | 0.4.0 → 0.4.1 |
| S2 | fe-workflow | 0.8.1 → 0.8.2 |
| S3 | be-workflow | 0.1.0 → 0.1.1 |
| S4 | assignment-grading, interview-prep | 1.0.0→1.0.1, 0.1.0→0.1.1 |
| S5 | isc-sync | 0.2.0 → 0.2.1 |
| S6 | marketplace.json | isc-sync 등록 |

### ralph.sh 실제 실행 핵심 코드

```bash
# 프롬프트를 stdin → claude -p (비대화형 1회성)
echo "$PROMPT" | claude -p \
  --allowedTools "Read,Write,Edit,Bash(git add:*),Bash(git commit:*),Bash(jq:*)"
```

- `claude -p`: print 모드. 실행 후 즉시 종료 = 새 인스턴스
- `--allowedTools`: 허용 도구만 지정 → 권한 프롬프트 없이 무인 실행
- `unset CLAUDECODE`: Claude Code 내부에서 실행 시 중첩 세션 제한 우회 필요

### 실습에서 배운 것

1. **PRD와 AGENTS.md는 사람이 정의** — AI한테 초안은 시킬 수 있지만 "뭘 할지"와 "어떤 규칙으로"는 사람 결정
2. **progress.txt는 AI가 누적** — 인스턴스 간 기억 전달의 핵심 메커니즘
3. **무인 실행의 가치** — 10분 걸려도 사람 시간 0분. 60개 스토리도 동일
4. **스토리 하나에 여러 파일 수정 가능** — S4에서 2개 플러그인 동시 처리
5. **현실 적응** — S5에서 work-recap 디렉토리 미존재 시 자동 스킵

## FE 실무 적용 가이드

### 기존 도구 vs Ralph — 언제 뭘 쓰나

`fe:api-integrate`는 **도메인 1개를 깊게 처리하는 장인**, Ralph는 **같은 작업을 N개 반복하는 공장**.

```
fe:api-integrate = 서버 코드 분석 → AskUserQuestion(위치 결정) → 코드 생성
                   사람 판단이 필요한 1회성 작업

Ralph            = 패턴 확정 → prd.json에 N개 등록 → 무인 반복 실행
                   판단 끝난 반복 작업
```

| 상황 | 도구 | 이유 |
|------|------|------|
| 새 API 1개 추가 | `fe:api-integrate` | 위치/분리 결정 필요 (사람 판단) |
| 기존 API N개 컨벤션 통일 | Ralph | 패턴 확정됨, 반복만 남음 |
| 컴포넌트 패턴 일괄 전환 | Ralph | useEffect 기명함수, Suspense 등 |
| 테스트 일괄 작성 | Ralph | 동일 패턴 반복 |
| 새 기능 설계 + 구현 | `fe:api-integrate` + 수동 | 창의적 판단 필요 |

### Ralph 적합 판단 기준

```
1. 패턴이 명확한가? (AGENTS.md에 규칙으로 적을 수 있나?)
2. 반복 대상이 3개 이상인가?
3. 사람 판단 없이 기계적으로 처리 가능한가?

3개 다 Yes → Ralph. 하나라도 No → 수동 또는 기존 커맨드.
```

### FE에서 Ralph가 빛나는 시나리오

**1. API 레이어 마이그레이션** — 컨벤션 변경 후 기존 코드 일괄 전환
```json
{ "stories": [
  { "id": "S1", "title": "products remote → httpClient+객체params 전환" },
  { "id": "S2", "title": "orders remote → httpClient+객체params 전환" }
]}
```

**2. 컴포넌트 패턴 통일** — useEffect 기명함수, 로딩 분기 제거 등
```json
{ "stories": [
  { "id": "S1", "title": "ProductList useEffect 기명함수 전환" },
  { "id": "S2", "title": "OrderDetail useSuspenseQuery 전환" }
]}
```

**3. 테스트 일괄 작성** — remotes/mutations/hooks 단위
```json
{ "stories": [
  { "id": "S1", "title": "remotes/products.ts 테스트 작성" },
  { "id": "S2", "title": "mutations/useCreateOrder.ts 테스트 작성" }
]}
```

### 실무 플로우

```
1. "이거 N개 파일 다 바꿔야 하네..." → Ralph 후보
2. AGENTS.md에 fe-workflow 컨벤션 규칙 복사 (api-layer.md 등)
3. prd.json에 도메인/파일 단위로 스토리 분할
4. bash scripts/ralph/ralph.sh → 자리 비움
5. 돌아와서 git log + 코드 리뷰
```

## 참고

- [GitHub: snarktank/ralph](https://github.com/snarktank/ralph)
- Amp, Claude Code 모두 지원
- `CLAUDE.md`에 프롬프트 템플릿을 넣어서 Claude Code와 연동
