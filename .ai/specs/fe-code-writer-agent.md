# FE Code-Writer Agent 설계

## 배경

### 문제
- AI 초안이 FE 컨벤션(특히 코드 철학: 추상화, 컴포넌트 분리, 변경 용이성)을 따르지 않음
- 현재 컨벤션은 리뷰 시점(사후)에만 적용 — 생성 시점에는 6줄 요약 또는 키워드 매칭 최대 2개만 주입
- code-reviewer가 Sonnet 모델이라 철학적 판단(추상화 수준, 분리 vs 추상화) 부족
- 사용자가 일일이 검증/수정해야 해서 시간 소모 큼

### 진단
| 원인 | 영향 |
|------|------|
| 생성 시 컨벤션 미반영 | 초안 품질 낮음 |
| 코드베이스 참조 없음 | 프로젝트 패턴 무시 |
| Sonnet 판단 한계 | 철학적 리뷰 부족 |
| 사후 교정 구조 | 근본적 품질 개선 안 됨 |

## 해결 방향

**컨벤션을 내재화한 Code-Writer Agent 도입** — 코드 생성 전에 컨벤션 5개를 전부 읽고, 자기검증까지 포함.

## 변경 파일

| 파일 | 변경 | 설명 |
|------|------|------|
| `agents/code-writer.md` | NEW | Opus 모델, 컨벤션 내재화 코드 작성 Agent |
| `commands/implement.md` | NEW | 오케스트레이터 커맨드 (수동 호출 / superpowers plan에서 명시) |
| `skills/fe-principles/SKILL.md` | 수정 | code-writer Agent 라우팅 추가 |
| `agents/code-reviewer.md` | 수정 | Sonnet → Opus 모델 변경 |
| `plugin.json` | 수정 | 0.22.6 → 0.23.0 |

## 상세 설계

### 1. agents/code-writer.md

**모델**: Opus (철학적 판단 필요)
**권한**: Read, Write, Edit, Glob, Grep (코드 읽기 + 쓰기)

**프로토콜:**

#### Step 1. 컨벤션 로드
오케스트레이터가 전달한 conventions 경로의 **5개 파일을 반드시 Read**:
- `code-principles.md`
- `folder-structure.md`
- `api-layer.md`
- `error-handling.md`
- `coding-style.md`

1회만 읽고, 이후 작업에서 재사용 (중복 로드 없음).

#### Step 2. 요구사항 분석
오케스트레이터가 전달한 요구사항/설계 문서를 분석:
- 구현할 기능 파악
- 필요한 파일 목록 정리 (DTO, remote, query, mutation, 컴포넌트 등)
- 기존 코드 패턴 참조 (같은 도메인/유사 기능의 기존 파일 샘플링)

#### Step 3. 코드 작성
컨벤션이 컨텍스트에 있는 상태에서 코드 작성:
- API 패턴: `*Params` 타입, queryOptions 팩토리, mutateAsync + try-catch
- 폴더 구조: 지역성, Page First
- 코드 철학: SSOT, SRP, 분리 ≠ 추상화
- 코딩 스타일: useEffect 기명함수, handler 네이밍, overlay.open

#### Step 4. 자기검증
작성한 코드를 컨벤션 기준으로 자기검증:
- DO & DON'T 체크리스트 대조
- 금지 패턴 (이른 추상화, any, A-B-A-B) 확인
- 추상화 체크: 분리만 한 건 아닌지, 사용처와 내부 모두 깔끔한지
- 인지 부하: 함수≤30줄, 파라미터≤3, 분기≤3

#### Step 5. 위반 수정
자기검증에서 발견된 위반 사항 자체 수정 후 최종 코드 반환.

**원칙:**
- 컨벤션 파일을 반드시 Read (암기 의존 금지)
- 기존 코드베이스의 유사 파일을 참조하여 프로젝트 패턴 일치
- 확신 없는 판단은 질문으로 반환 (오케스트레이터가 사용자에게 전달)

### 2. commands/implement.md

**역할**: 오케스트레이터 (review.md와 동일한 패턴)
**allowed-tools**: Read, Grep, Glob, Bash, Task

#### Phase 1. 요구사항 수집 (직접 수행)

입력 유형별 처리:
| 입력 | 처리 |
|------|------|
| 설계 문서 경로 | 해당 문서 Read |
| 텍스트 요구사항 | 그대로 전달 |
| .ai/specs/ 경로 | spec 문서 Read |
| 입력 없음 | 사용자에게 질문 |

기존 코드 패턴 참조를 위해 프로젝트 구조 파악 (관련 디렉토리 ls, 유사 파일 확인).

#### Phase 2. Agent 위임 (Task 호출)

```
Task(
  subagent_type = "plugin:fe-workflow:code-writer",
  prompt = "
    아래 요구사항을 구현해줘.

    conventions 경로 (반드시 Read로 읽고 기준 적용):
    - {플러그인 루트}/conventions/code-principles.md
    - {플러그인 루트}/conventions/folder-structure.md
    - {플러그인 루트}/conventions/api-layer.md
    - {플러그인 루트}/conventions/error-handling.md
    - {플러그인 루트}/conventions/coding-style.md

    요구사항:
    - {수집된 요구사항}

    설계 문서:
    - {있으면 포함}

    프로젝트 구조 참조:
    - {관련 디렉토리 구조}
  "
)
```

#### Phase 3. 결과 전달 (직접 수행)

Agent가 반환한 구현 결과를 그대로 사용자에게 전달.
Agent가 질문을 반환하면 사용자에게 그대로 전달.

### 3. skills/fe-principles/SKILL.md 수정

워크플로우 테이블 변경:

```
| 시점 | 액션 |
|------|------|
| 설계 필요 시 | /fe:architecture 실행 |
| 코드 작성 시 | code-writer Agent에게 위임 (Task 호출) |  ← 변경
| 코드 작성 후 | /fe:review 실행 |
| API 연동 시 | /fe:api-integrate 실행 |
```

"코드 작성 전 필수" 섹션은 유지 (code-writer Agent가 호출 안 될 때의 fallback).

code-writer Agent 위임 로직 추가:
- conventions 경로를 절대 경로로 resolve
- 요구사항 + 설계 컨텍스트를 Agent에 전달
- Agent 결과를 그대로 반환

### 4. agents/code-reviewer.md 수정

```diff
- model: sonnet
+ model: opus
```

이유: 추상화 수준, 컴포넌트 분리, 변경 용이성 같은 판단은 Opus급 추론 필요.

## 호출 경로

### 경로 1: 스킬 자동 트리거 (일반 대화)
```
사용자: "가맹점 상세 페이지 만들어줘"
→ AI가 FE 코드 작성으로 판단
→ fe-principles 스킬 자동 로드
→ 스킬 지시에 따라 code-writer Agent Task 위임
→ Agent: 컨벤션 5개 Read → 코드 작성 → 자기검증 → 반환
```

### 경로 2: 커맨드 수동 호출 (superpowers plan / 직접)
```
사용자: /fe:implement {요구사항 또는 설계 문서}
→ 오케스트레이터: 요구사항 수집 + 프로젝트 구조 파악
→ code-writer Agent Task 위임
→ Agent: 컨벤션 5개 Read → 코드 작성 → 자기검증 → 반환
```

### 전체 워크플로우
```
1. brainstorm → design → plan              (superpowers)
2. /fe:implement 또는 스킬 자동 트리거      (code-writer Agent)
3. /fe:review                               (code-reviewer Agent, Opus)
4. Must Fix → refactorer Agent              (기존)
```

## 비용 영향

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 코드 생성 | 메인 AI (요약 6줄) | Opus Agent (컨벤션 ~20K 1회) |
| 코드 리뷰 | Sonnet Agent | Opus Agent |
| 수동 검증 시간 | 많음 | 감소 예상 |
| 토큰 비용 | 낮음 | 높음 (Opus 2회: 생성+리뷰) |

## 리스크

- code-writer Agent가 컨벤션을 읽어도 철학적 판단을 제대로 못할 수 있음 → 실제 사용 후 Agent 프롬프트 튜닝 필요
- Opus 비용 증가 → 효과 대비 비용 모니터링 필요
- 스킬 자동 트리거가 plan 실행 중에 동작 안 할 수 있음 → 커맨드로 fallback
