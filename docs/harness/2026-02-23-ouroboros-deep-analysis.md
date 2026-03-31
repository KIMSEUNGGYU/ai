---
tags:
  - ai-agent
  - ouroboros
  - architecture
  - deep-dive
date: 2026-02-23
status: active
source: https://github.com/Q00/ouroboros
---

# Ouroboros 아키텍처 딥다이브

> "프롬프팅을 멈추고, 사양을 작성하라" — 모호한 요구사항을 확정 사양으로 변환하는 진화적 AI 워크플로우 엔진

## 전체 아키텍처 (코드 기반)

```
                    ┌─── Evolutionary Loop ────┐
                    │                          │
  ┌─────────┐   ┌──▼──────┐   ┌───────────┐   │   ┌────────────┐
  │Interview│──▶│  Seed   │──▶│  Execute  │──▶│──▶│  Evaluate  │
  │ (BigBang)│   │Generator│   │(DoubleDia)│   │   │ (Pipeline) │
  └─────────┘   └─────────┘   └───────────┘   │   └─────┬──────┘
       ▲                                       │         │
       │         Wonder ◀──────────────────────┘         │
       │           │                                     │
       │         Reflect ◀───────────────────────────────┘
       │           │
       └───────────┘ (Gen 2+에서 자동 진화)
```

## Phase별 상세 분석

### Phase 0: Big Bang (Interview → Seed)

**파일**: `src/ouroboros/bigbang/`

#### InterviewEngine (`interview.py`)

소크라테스식 질문을 통해 숨겨진 가정을 노출시키는 엔진.

```python
# 핵심 플로우
engine = InterviewEngine(llm_adapter, state_dir)
state = await engine.start_interview("CLI 작업 관리 도구를 만들고 싶어")

while not state.is_complete:
    question = await engine.ask_next_question(state)    # LLM이 질문 생성
    user_response = input(question)                      # 사용자 응답
    await engine.record_response(state, user_response, question)
```

설계 포인트:
- **최소 3라운드** 필수 (`MIN_ROUNDS_BEFORE_EARLY_EXIT = 3`)
- **15라운드 후 경고** — 수확체감 경고 (`SOFT_LIMIT_WARNING_THRESHOLD = 15`)
- **파일 락** — `fcntl.flock`으로 동시 접근 방지
- **상태 영속화** — JSON으로 인터뷰 상태 저장/복원

#### AmbiguityScorer (`ambiguity.py`)

인터뷰 결과의 모호성을 정량 측정:

```
모호성 점수 = 1 - (가중 평균 명확도)

가중치:
  Goal Clarity:             40%  ← "목표가 구체적인가?"
  Constraint Clarity:       30%  ← "제약사항이 명시됐는가?"
  Success Criteria Clarity: 30%  ← "성공 기준이 측정 가능한가?"

임계값: ≤ 0.2 → Seed 생성 가능
```

- LLM이 JSON 형식으로 점수 반환
- **적응적 토큰 할당**: 응답이 잘리면 토큰 2배로 증가하며 재시도
- 온도 0.1 — 재현성을 위한 낮은 온도

#### SeedGenerator (`seed_generator.py`)

인터뷰 결과를 불변 사양(Seed)으로 결정화:

```python
# Seed = frozen Pydantic model (수정 불가)
class Seed(BaseModel, frozen=True):
    goal: str                          # 핵심 목표 (IMMUTABLE)
    task_type: str                     # "code" | "research" | "analysis"
    constraints: tuple[str, ...]       # 제약사항 (IMMUTABLE)
    acceptance_criteria: tuple[str, ...] # 수락 기준 (IMMUTABLE)
    ontology_schema: OntologySchema    # 출력 구조 스키마
    evaluation_principles: tuple[...]   # 평가 원칙
    exit_conditions: tuple[...]         # 종료 조건
    metadata: SeedMetadata             # 버전, 타임스탬프, 모호성 점수
```

**핵심 설계 결정**: `frozen=True` — Seed는 "헌법"과 같음. 생성 후 수정 불가. 이는 실행/평가 전체에서 **ground truth** 역할.

Gen 2+ 경로: `generate_from_reflect()` — ReflectEngine의 결과로 온톨로지 뮤테이션을 적용해 진화된 Seed 생성.

---

### Phase 1: PAL Router (비용 최적화)

**파일**: `src/ouroboros/routing/`

```
TaskContext(token_count, tool_dependencies, ac_depth)
        │
        ▼
   estimate_complexity()
        │
        ▼
  ┌─────────────────────────────────────┐
  │  score < 0.4  → Frugal (저비용 모델) │
  │  0.4 ≤ score < 0.7 → Standard       │
  │  score ≥ 0.7  → Frontier (고성능)    │
  └─────────────────────────────────────┘
```

설계 포인트:
- **완전 Stateless** — 입력이 같으면 항상 같은 출력 (순수 함수)
- 복잡도 요소: 토큰 수, 도구 의존성 개수, AC 깊이
- ~85% 비용 절감 목표

---

### Phase 2: Execution (Double Diamond)

**파일**: `src/ouroboros/execution/double_diamond.py`

```
  ◇ DISCOVER (발산)          ◇ DESIGN (발산)
  │ 문제 공간 탐색             │ 솔루션 옵션 생성
  │ 인사이트 수집              │ 트레이드오프 분석
  ▼                           ▼
  ◆ DEFINE (수렴)             ◆ DELIVER (수렴)
  │ 접근법 확정                │ 최종 구현
  │ 온톨로지 필터 적용          │ 온톨로지 필터 적용
```

각 Phase마다 전용 시스템 프롬프트가 정의되어 있음 (`PHASE_PROMPTS` dict):

```python
PHASE_PROMPTS = {
    "discover": { "system": "...", "user_template": "...", "output_key": "insights" },
    "define":   { "system": "...", "user_template": "...", "output_key": "approach" },
    "design":   { "system": "...", "user_template": "...", "output_key": "solution" },
    "deliver":  { "system": "...", "user_template": "...", "output_key": "result" },
}
```

#### AC 분해 (Hierarchical Decomposition)

`run_cycle_with_decomposition()` — 핵심 고급 기능:

```
AC: "사용자 인증 구현"
        │
   ┌────┴────┐ (Atomicity Check: 비원자적)
   │ Define 후│
   └────┬────┘
        │ decompose_ac()
        ▼
  ┌─────────────────────────────────────┐
  │ 자식 AC 1: "JWT 토큰 발급"          │ ─┐
  │ 자식 AC 2: "비밀번호 해싱"          │  ├─ 의존성 위상정렬
  │ 자식 AC 3: "로그인 엔드포인트"      │ ─┘    → 병렬 실행
  └─────────────────────────────────────┘
```

- **Kahn's Algorithm** — 위상정렬로 병렬 실행 레벨 계산
- **SubAgent 격리** — 각 자식 AC는 독립된 SubAgent에서 실행
- **최대 깊이 5** — 무한 분해 방지
- **실패 격리** — 자식 하나가 실패해도 나머지 계속 실행 (AC 5)

#### Retry with Backoff

```python
delay = base_delay * (2 ** attempt)  # 2, 4, 8, 16초...
```

#### Stagnation Detection

실행 히스토리를 슬라이딩 윈도우(10개)로 추적. 패턴 감지:
- **Spinning** — 같은 에러 반복
- **Oscillation** — 결과가 왔다갔다
- **No Drift** — 진전 없음
- **Diminishing Returns** — 개선폭 감소

---

### Phase 3: Resilience (측면적 사고)

**파일**: `src/ouroboros/resilience/lateral.py`

정체 감지 시 5가지 페르소나가 활성화:

| 페르소나 | 역할 | 친화 패턴 |
|----------|------|-----------|
| **Hacker** | 비관습적 우회법 발견 | Spinning |
| **Researcher** | 추가 정보 탐색 | No Drift, Diminishing Returns |
| **Simplifier** | 복잡성 제거, 가정 축소 | Diminishing Returns, Oscillation |
| **Architect** | 접근법 근본적 재구조화 | Oscillation, No Drift |
| **Contrarian** | 모든 가정에 도전 | 전체 패턴 |

```python
# 정체 패턴에 맞는 페르소나 자동 추천
persona = thinker.suggest_persona_for_pattern(
    pattern=StagnationPattern.SPINNING,
    exclude_personas=(ThinkingPersona.HACKER,)  # 이미 시도한 것 제외
)
```

**핵심 설계**: 페르소나는 직접 해결하지 않고 **프롬프트**만 생성. LLM이 다른 관점에서 사고하도록 유도.

---

### Phase 4: Evaluation (3단계 검증 파이프라인)

**파일**: `src/ouroboros/evaluation/pipeline.py`

```
Stage 1: Mechanical ($0)     ← 린트, 빌드, 테스트, 정적분석, 커버리지
    │ 실패 시 즉시 중단
    ▼
Stage 2: Semantic (Standard) ← LLM이 AC 준수 여부 + 점수(0.0~1.0) 판정
    │ ac_compliance=False 시 중단
    │ 트리거 조건 평가
    ▼
Stage 3: Consensus (Frontier) ← 다수 모델 합의 (트리거될 때만)
    │ approved = majority_ratio >= threshold
    ▼
Final: approved = True/False
```

**비용 최적화 전략**:
- Stage 1은 비용 $0 (규칙 기반)
- Stage 2는 Standard 모델
- Stage 3는 Frontier 모델이지만 **트리거 조건 충족 시에만** 실행

트리거 조건 (`TriggerConfig`):
- 시멘틱 점수가 경계선일 때
- 고위험 변경일 때
- 이전 세대에서 실패했을 때

---

### Phase 5: Evolutionary Loop (진화 사이클)

**파일**: `src/ouroboros/evolution/loop.py`

Ouroboros의 이름을 정당화하는 핵심 메커니즘:

```
Gen 1: Seed(O₁) → Execute → Evaluate → E₁
Gen 2: Wonder(O₁, E₁) → Reflect → Seed(O₂) → Execute → Evaluate → E₂
Gen 3: Wonder(O₂, E₂) → Reflect → Seed(O₃) → Execute → Evaluate → E₃
...
Gen N: 수렴 or 정체 or 최대 세대 도달
```

#### Wonder Engine (`wonder.py`)
- "현재 온톨로지와 평가 결과에서 **무엇을 더 배울 수 있는가?**"
- 질문을 생성하여 다음 세대의 방향 결정
- `should_continue=False` → 더 배울 게 없으면 종료

#### Reflect Engine (`reflect.py`)
- Wonder의 질문에 기반해 AC와 온톨로지를 **정제**
- `refined_goal`, `refined_constraints`, `refined_acs` 생성
- `ontology_mutations` — 온톨로지 필드 추가/수정/삭제

#### Convergence Criteria
```python
ConvergenceCriteria(
    convergence_threshold=0.95,   # 온톨로지 유사도 95% 이상이면 수렴
    stagnation_window=3,          # 3세대 연속 변화 없으면 정체
    min_generations=2,            # 최소 2세대는 실행
    max_generations=30,           # 최대 30세대
)
```

#### Lineage (계보) 추적
- **이벤트 소싱** — 모든 세대의 결과를 EventStore에 기록
- **LineageProjector** — 이벤트에서 상태 재구성 (CQRS 패턴)
- `evolve_step()` — 세션 간 상태 유지 (각 호출이 다른 세션에서 가능)
- `rewind_to()` — 특정 세대로 되감기 후 재진화

---

## 인프라 레이어

### Result[T, E] 타입 (`core/types.py`)
```python
# Rust의 Result 타입을 Python에 이식
result: Result[int, str] = Result.ok(42)
result: Result[int, str] = Result.err("failed")

# 체이닝
value = result.map(lambda x: x * 2).unwrap_or(0)
chained = result.and_then(lambda x: divide(x, 2))
```

예외는 **프로그래밍 에러(버그)**에만 사용. 예상된 실패(API 에러, 검증 실패)는 모두 Result로 처리.

### Event Sourcing (`persistence/`)
- SQLite 기반 이벤트 스토어
- 모든 상태 변경이 이벤트로 기록
- 이벤트 재생으로 임의 시점 상태 복원 가능

### Observability (`observability/`)
- **Drift Tracking** — 실행이 Seed에서 벗어나는 정도 측정
- **Retrospective** — 세대별 회고 분석
- **Structured Logging** — structlog 기반

### TUI (`tui/`)
- Textual 기반 터미널 대시보드
- 위젯: Phase Progress, Cost Tracker, Drift Meter, Agent Activity, AC Tree, Parallel Graph

---

## 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 언어 | Python 3.14+ |
| 타입 | Pydantic v2 (frozen models) |
| LLM | LiteLLM (100+ 모델), Anthropic SDK |
| CLI | Click + Rich |
| TUI | Textual |
| 이벤트 저장 | SQLite (Event Sourcing) |
| 로깅 | structlog |
| 패키지 | UV |
| 테스트 | 1,341개, 97%+ 커버리지 |

## 에이전트 목록

**Core**: socratic-interviewer, ontologist, seed-architect, evaluator, contrarian
**Support**: hacker, simplifier, researcher, architect

---

## 학습 포인트

### 1. "Garbage In, Garbage Out" 문제의 체계적 해결
- 대부분의 AI 코딩 실패는 **입력(요구사항)**에서 발생
- 인터뷰 → 모호성 점수 → 임계값 게이팅으로 품질 보장

### 2. Immutable Seed as Constitution
- `frozen=True`로 실행 전체의 ground truth 보장
- 온톨로지만 진화 가능 (direction은 불변)

### 3. Event Sourcing for AI Workflows
- AI 실행은 비결정적 → 이벤트 소싱으로 재현성 확보
- `evolve_step()`이 세션 간 상태를 이벤트에서 재구성

### 4. Cost-Aware Architecture
- PAL Router로 작업별 최적 모델 선택
- 평가 Stage 3은 트리거 시에만 (비싼 Frontier 모델)
- 기계적 검증 우선 ($0) → 시멘틱 → 합의

### 5. Resilience as First-Class Citizen
- 정체 패턴 감지가 실행 루프에 내장
- 5가지 사고 페르소나로 관점 전환
- 자식 AC 실패 격리 (한 실패가 전체를 멈추지 않음)

## References

- [GitHub](https://github.com/Q00/ouroboros)
- [[ai-agent-harness-claude-agent-sdk]] — Agent Harness 개념과의 연결
