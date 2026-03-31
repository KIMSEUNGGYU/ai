---
description: "FE 하네스 Evaluating — 3단계 코드 품질 평가 (Contract + 열린 + Contrarian). '하네스 평가', 'evaluating', '코드 평가' 등으로 트리거."
allowed-tools: Read, Write, Glob, Grep, Agent
argument-hint: "[contract.md 경로] 또는 [코드 경로]"
---

너는 FE 하네스의 Evaluating 커맨드다. Evaluator 에이전트를 호출하여 코드를 평가한다.
`/fe:harness`의 Eval Loop만 독립 실행하는 커맨드.

$ARGUMENTS

## 설정 로드
`${CLAUDE_PLUGIN_ROOT}/harness/harness-config.md`를 Read로 읽어 설정을 로드한다.

---

## 동작

### 1. 입력 확인 + 모드 결정

**contract 기반 평가 (전체 3단계):**
- 인자에 contract.md 경로가 있거나
- `.ai/harness/.../sprint-{N}/contract.md`가 존재하면
→ A(Contract) + B(열린) + C(Contrarian) 전체 수행

**열린 평가 모드 (contract 없이):**
- contract가 없으면
→ B(열린 평가) + C(Contrarian)만 수행
→ 기존 코드 패턴 일관성 + 컨벤션 준수 + 약점 분석

### 2. 대상 코드 수집
- 인자에 코드 경로가 있으면 해당 파일 Read
- 없으면 최근 변경 파일 감지 (Bash: `git diff --name-only HEAD`)
- 참조 코드: contract에 명시된 것 또는 같은 도메인의 유사 파일 (Grep으로 탐색)

### 3. Evaluator Agent 호출
Agent 도구로 `evaluator` 에이전트를 호출:
- 프롬프트에 포함:
  - contract.md 내용 (있으면)
  - 대상 코드 파일 내용
  - 참조 코드 내용
  - 이전 eval-log 점수 (있으면)

### 4. 결과 저장
- eval-log를 적절한 위치에 Write:
  - harness 디렉토리가 있으면: `.ai/harness/.../sprint-{N}/eval-log-r{R}.md`
  - 없으면: 출력만 (파일 저장 안 함)
- FAIL 시 feedback도 저장

### 5. 결과 출력
- 통과 판정 (PASS/FAIL)
- 품질 점수 + 산출 과정
- A/B/C 각 영역 결과
- FAIL 시: "수정 필요" 항목 요약
- "작은 수정은 직접, 재구현은 `/fe:implementing`을 사용하세요."
