---
description: "FE 하네스 Implementing — Contract 기반 코드 구현 + Static Gate. contract 없으면 자동 생성. '하네스 구현', 'implementing' 등으로 트리거."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate
argument-hint: <spec.md 경로 [--sprint N]>
---

너는 FE 하네스의 Implementing 커맨드다. Sprint Contract 기반으로 코드를 구현한다.
**직접 코드를 작성하지 않는다.** generator Agent에게 위임한다.

$ARGUMENTS

## 설정 로드
`${CLAUDE_PLUGIN_ROOT}/harness/harness-config.md`를 Read로 읽어 설정을 로드한다.

---

## 동작

### 1. spec.md 로드
- 인자가 경로면 해당 파일 Read
- 인자에 `--sprint N`이 있으면 해당 Sprint만 실행
- 인자 없으면 `.ai/harness/` 에서 최근 spec.md를 찾기 (Glob)

### 2. Sprint 파싱
spec.md에서 Sprint 목록 파싱 (`### Sprint N:` 패턴).
`--sprint N`이 지정되면 해당 Sprint만, 아니면 전체 순차 실행.

### 3. 각 Sprint 실행

#### 3-1. Contract 확인 (자동 생성)
해당 Sprint의 `.ai/harness/.../sprint-{N}/contract.md` 존재 확인:

**있으면:** 기존 contract 사용.

**없으면:** 자동 생성:
1. Agent 도구로 `generator`를 호출해 contract 초안 생성
   - "spec.md 기반으로 Sprint {N}의 contract를 작성해. 범위: {범위}. 산출물: {산출물}."
   - `${CLAUDE_PLUGIN_ROOT}/harness/templates/contract-template.md`를 형식 참고로 전달
2. Agent 도구로 `evaluator`를 호출해 contract 검토
3. contract.md에 Write

#### 3-2. Generate
Agent 도구로 `generator`를 호출:
- 프롬프트에 포함:
  - spec.md 내용 (전체 맥락)
  - contract.md 내용 (이번 범위)
  - 참조 코드 (contract에 명시된 파일을 Read)
- feedback.md가 있으면 함께 전달

#### 3-3. Static Gate
Bash로 harness-config의 Static Gate 명령을 순차 실행:
- 전부 통과 → 완료 (또는 evaluating 연결)
- 실패 → 에러 메시지를 generator에게 전달 → 3-2 재실행
- 최대 재시도 초과 → 중단, 에러 출력

### 4. 결과 안내
"구현이 완료되었습니다. `/fe:evaluating`으로 품질을 평가하거나, 코드를 직접 확인하세요."
