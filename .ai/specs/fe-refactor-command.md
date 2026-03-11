# /fe:refactor 커맨드 설계

> fe-workflow 플러그인에 컨벤션 기반 자동 리팩토링 커맨드 추가

## 결정 사항

| 항목 | 결정 |
|------|------|
| 자동화 범위 | 카테고리 단위 일괄 수정 + 중간 확인 |
| 트리거 | 커맨드 `/fe:refactor` (명시적 호출) |
| 범위 감지 | 브랜치 전체 기본, --diff/--staged/경로 지원 |
| 에이전트 | 새 `refactorer` 에이전트 (분석+수정 통합) |
| 기존 정리 | `refactor-analyzer` 제거 (역할 겹침) |
| 카테고리 | 영향도 기반 3단계 (구조→로직→스타일) |

## 범위 감지

| 사용법 | 대상 | 시나리오 |
|--------|------|----------|
| `/fe:refactor` | `git diff main...HEAD` | 브랜치 전체 (기본값) |
| `/fe:refactor --diff` | `git diff` | unstaged 변경사항만 |
| `/fe:refactor --staged` | `git diff --staged` | staged 변경사항만 |
| `/fe:refactor src/pages/order/` | 해당 경로 파일들 | 특정 폴더/파일 지정 |

## 전체 흐름

```
/fe:refactor [경로|--diff|--staged]
    ↓
Phase 1: 변경 범위 수집 (커맨드)
    - 인자 파싱 → git diff 실행 → 변경 파일 목록
    - 변경 파일 없으면 조기 종료
    ↓
Phase 2: 컨벤션 기반 분석 (refactorer 에이전트)
    - 5개 컨벤션 문서 전부 읽기
    - 변경된 파일 전체 읽기
    - 위반사항 식별 + 영향도 3단계 분류
    ↓
Phase 3: 분석 결과 리포트
    - 카테고리별 위반 항목
    - 각 항목: 근거(어떤 컨벤션 위반) + before/after 코드
    ┌─────────────────────────────────────┐
    │ 🏗️ 구조 변경 (N건)                  │
    │  항목 / 근거 / before→after          │
    │ 🔧 로직 변경 (N건)                   │
    │  항목 / 근거 / before→after          │
    │ 🎨 스타일 변경 (N건)                 │
    │  항목 / 근거 / before→after          │
    └─────────────────────────────────────┘
    ↓
Phase 4: 단계별 수정 (구조 → 로직 → 스타일)
    - 카테고리 시작 전: 항목 보여주고 AskUserQuestion 확인
    - 수정 실행
    - 카테고리 완료 후 결과 요약
    - 다음 카테고리 진행 여부 확인
```

## 에이전트: refactorer

| 항목 | 값 |
|------|---|
| 모델 | sonnet |
| 도구 | Read, Write, Edit, Glob, Grep, Bash |
| 역할 | 컨벤션 기반 분석 + 코드 수정 실행 |

### 분석 카테고리 (영향도 순)

**1. 구조 변경** — 파일 이동/생성/삭제
- folder-structure.md: 지역성 원칙, Page First 위반
- code-principles.md: 컴포넌트/훅 추출 (추상화 원칙)

**2. 로직 변경** — 코드 패턴 수정
- api-layer.md: Remote/Query/Mutation 패턴 위반
- code-principles.md: SSOT, SRP, 응집도/결합도 위반
- error-handling.md: Exception vs Error State 혼용

**3. 스타일 변경** — 네이밍/포맷
- coding-style.md: 핸들러 네이밍, useEffect 기명함수, enum→as const 등
- code-principles.md: 가독성, 인지 부하 제한

### 리포트 항목 형식

```
### [카테고리] 항목명

**위반 컨벤션**: code-principles.md > SSOT
**근거**: Props 타입을 DTO에서 파생하지 않고 직접 정의

**Before:**
```tsx
interface Props {
  id: number;
  name: string;
}
```

**After:**
```tsx
interface Props {
  merchant: Pick<Merchant, 'id' | 'name'>;
}
```
```

## 변경 사항

### 추가
- `agents/refactorer.md` — 새 에이전트
- `commands/refactor.md` — 새 커맨드

### 삭제
- `agents/refactor-analyzer.md` — refactorer로 대체

### 수정
- `.claude-plugin/plugin.json` — version bump (minor)

## 커맨드 구조 (commands/refactor.md)

```yaml
---
name: refactor
description: 컨벤션 기반 자동 리팩토링 — 변경 코드를 분석하고 카테고리별로 수정
allowed-tools: Bash, Read, Glob, Grep, Agent
---
```

워크플로우:
1. 인자 파싱 (--diff, --staged, 경로, 기본=브랜치)
2. git diff 실행 → 변경 파일 목록 수집
3. 변경 파일 없으면 "변경사항 없음" 출력 후 종료
4. refactorer 에이전트에 위임 (변경 파일 목록 + diff 내용 전달)
5. 에이전트 결과 전달
