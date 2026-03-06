# agent-fundamentals src/ 리팩토링 + 문서 오류 수정

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** learning/agent-fundamentals/ 소스코드를 src/로 정리하고, evals/→specs/ 이름 변경, 문서의 잘못된 정보(evals를 하네스라고 설명) 수정

**Architecture:** 소스코드(.ts)는 src/로, 테스트 스펙 데이터(.md)는 specs/로 분리. evaluators/만 하네스이고 evals(→specs)는 단순 입력 데이터임을 문서에 반영

**Tech Stack:** TypeScript (ESM), git mv

---

### Task 1: src/ 디렉토리 생성 및 소스 파일 이동

**Files:**
- Move: `learning/agent-fundamentals/main.ts` → `learning/agent-fundamentals/src/main.ts`
- Move: `learning/agent-fundamentals/types.ts` → `learning/agent-fundamentals/src/types.ts`
- Move: `learning/agent-fundamentals/conventions.ts` → `learning/agent-fundamentals/src/conventions.ts`
- Move: `learning/agent-fundamentals/test-plugin.ts` → `learning/agent-fundamentals/src/test-plugin.ts`
- Move: `learning/agent-fundamentals/agents/` → `learning/agent-fundamentals/src/agents/`
- Move: `learning/agent-fundamentals/evaluators/` → `learning/agent-fundamentals/src/evaluators/`

**Step 1: git mv로 파일 이동**

```bash
cd ~/dev/agents/learning/agent-fundamentals
mkdir -p src
git mv main.ts src/
git mv types.ts src/
git mv conventions.ts src/
git mv test-plugin.ts src/
git mv agents src/
git mv evaluators src/
```

**Step 2: import 경로 수정**

`src/main.ts`의 import는 상대경로(`./agents/...`)를 사용하므로 src/ 내부 이동 시 변경 불필요.
단, `test/review-eval.test.ts`에서 evaluators를 import하는 경로 수정 필요:

```typescript
// test/review-eval.test.ts
// before: "../evaluators/review-eval.js"
// after:  "../src/evaluators/review-eval.js"
```

**Step 3: package.json 실행 스크립트 확인 및 수정**

```bash
# package.json의 main이나 scripts에서 main.ts 참조하는 부분 수정
# "npx tsx main.ts" → "npx tsx src/main.ts"
```

**Step 4: tsconfig.json 수정**

```json
{
  "compilerOptions": {
    "rootDir": "src"
  }
}
```

---

### Task 2: evals/ → specs/ 이름 변경

**Files:**
- Move: `learning/agent-fundamentals/evals/` → `learning/agent-fundamentals/specs/`

**Step 1: git mv로 폴더 이름 변경**

```bash
cd ~/dev/agents/learning/agent-fundamentals
git mv evals specs
```

**Step 2: 코드 내 evals 참조 수정**

- `.gitignore`: `evals/output/*` → `specs/output/*`
- README.md: 모든 `evals/` → `specs/` 경로 변경
- NOTES.md: 모든 `evals/` → `specs/` 경로 변경

---

### Task 3: NOTES.md 잘못된 정보 수정 — evals는 하네스가 아님

**핵심 오류**: evals/ 폴더를 "하네스의 일부 (시험 문제)"라고 설명했지만, 실제로는 **테스트용 스펙 문서 (입력 데이터)**일 뿐 하네스가 아님.

**수정할 위치와 내용:**

1. **라인 34 (파일 구조)**
   - Before: `├── evaluators/                ← 하네스: 채점표 (어떻게 평가?)`
   - After: `├── evaluators/                ← 하네스 (에이전트 출력 자동 검증)`
   - Before: `├── evals/                     ← 하네스: 시험 문제 (뭘로 평가?)`
   - After: `├── specs/                     ← 테스트용 스펙 문서 (에이전트 입력 데이터)`

2. **라인 517-541 (섹션 4 제목 및 본문)**
   - "evaluators vs evals — 헷갈리기 쉬운 두 폴더" 섹션 재작성:
     - 하네스 = evaluators/ 폴더의 채점 코드만
     - specs/(구 evals/) = 에이전트를 테스트할 때 쓰는 입력 스펙 문서
     - evals를 하네스의 일부로 포함시킨 것은 잘못됨

3. **라인 525-533 (ASCII 트리)**
   ```
   Before:
   하네스 (Harness) = 에이전트 품질 자동 검증 시스템 전체
   ├── evaluators/  ← 채점표
   └── evals/       ← 시험 문제

   After:
   하네스 (Harness) = evaluators/ 폴더의 채점 코드
   ├── spec-eval.ts    ← 스펙 품질 검증
   ├── code-eval.ts    ← 코드 품질 검증
   └── review-eval.ts  ← 리뷰 결과 검증 + 점수 산출

   specs/ = 테스트용 스펙 문서 (하네스가 아님, 에이전트 입력 데이터)
   ```

4. **라인 536-538 (비유)**
   - Before: 하네스 = 시험 시스템 전체, evaluators = 채점표, evals = 시험지
   - After: 하네스 = 채점 시스템 (evaluators/), specs/ = 테스트 입력 데이터 (시험지는 맞지만 하네스의 일부가 아님)

5. **라인 913 (팀 프로젝트 비유)**
   - `하네스 (evaluators/)` — 이미 정확. 유지.

6. **라인 927 (시험 비유)**
   - Before: `하네스 = 시험 끝나고 채점`
   - 이건 맞음. 유지.

7. **라인 964 (부록 타입 정의 주석)**
   - Before: `/** 평가 결과 — 모든 하네스의 반환 타입 */`
   - After: `/** 평가 결과 — evaluator 함수의 반환 타입 */`

---

### Task 4: README.md 경로 및 구조 업데이트

**수정 내용:**

1. 파일 구조 ASCII 트리를 src/ 구조로 갱신
2. `evals/` → `specs/` 경로 변경
3. 실행 명령어 경로 수정: `npx tsx main.ts` → `npx tsx src/main.ts`
4. 테스트 명령어의 specs 경로 수정

---

### Task 5: 커밋

**Step 1: 변경 확인**

```bash
git status
git diff --cached
```

**Step 2: 커밋**

```bash
git add -A
git commit -m "refactor(agent-fundamentals): src/ 구조 도입 + evals→specs 이름 변경 + 문서 오류 수정"
```
