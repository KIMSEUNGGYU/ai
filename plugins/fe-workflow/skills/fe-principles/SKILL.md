---
name: fe-principles
description: >
  TRIGGER when: code imports React/Next.js, writing .tsx/.ts files in ~/work/ projects,
  creating components/hooks/pages, API integration (query/mutation/remote/dto),
  form handling (zod/react-hook-form), folder structure decisions, error handling,
  or any frontend implementation task.
  DO NOT TRIGGER when: backend-only code, ~/dev/ projects, documentation-only tasks,
  or non-TypeScript/non-React code.
---

# 프론트엔드 코드 원칙

## 워크플로우

| 시점 | 액션 |
|------|------|
| **설계 필요 시** | `/fe:architecture` 실행 — 컨벤션 기반 설계 산출물 생성 |
| **코드 작성 전** | 아래 references 테이블에서 해당 파일을 반드시 Read |
| **코드 작성 후** | `/fe:review` 실행 — 컨벤션 기반 코드 리뷰 (점수 + 피드백) |
| **API 연동 시** | `/fe:api-integrate` 실행 — API → FE 코드 자동 생성 |

## 코드 작성 전 필수

**코드를 작성하기 전에 반드시 작업에 해당하는 references 파일을 읽어야 한다.**
요약만으로는 구체적 코드 패턴(form, zod, query, mutation, 폴더 규칙 등)을 정확히 적용할 수 없다.

| 작업 유형 | 필수 읽기 |
|-----------|-----------|
| API/Remote/Query/Mutation 작성 | `references/api-layer.md` |
| 폼(react-hook-form, zod) 작성 | `references/coding-style.md` + `references/folder-structure.md` |
| 새 파일/폴더 생성 | `references/folder-structure.md` |
| 컴포넌트/훅 작성 | `references/coding-style.md` |
| 에러 처리 | `references/error-handling.md` |
| 리팩토링/코드 리뷰 | `references/code-principles.md` |

**여러 작업 유형이 겹치면 해당하는 모든 파일을 읽는다.**

## 코드 철학

| 우선순위 | 원칙 | 핵심 |
|----------|------|------|
| 1 | **변경 용이성** | 한 종류 변경 = 한 곳에서 끝 |
| 2 | **SSOT** | 정의 1곳, 사용 여러 곳. 분리 ≠ 추상화 |
| 3 | **SRP** | 변경 이유 하나 |
| 4 | **응집도↑ 결합도↓** | 함께 바뀌는 것끼리, Page First |
| 5 | **선언적** | What 선언, How는 하위로 |
| 6 | **가독성** | 위에서 아래로 읽히는 구조, 뻔한 인터페이스, 조기 반환 |
| 7 | **인지 부하** | 함수≤30줄, 파라미터≤3, 분기≤3 |

## 금지 패턴

- 이른 추상화 — 분리만 하고 복잡도는 그대로인 훅/유틸 금지
- 이른 파일 추출 — 재사용 전까지 같은 파일 유지
- 이른 상수 추출 — 여러 곳 사용 전까지 현재 위치 유지
- any 타입
- useEffect 익명 함수
- 명령형 로딩/에러 분기 (`if (isLoading)`)
- instanceof 에러 판별
- A-B-A-B 분산 — 관련 로직(상태+핸들러, 조회+가공)이 떨어져 있으면 즉시 모아두기
- 분리만 한 훅 — 사용처에서 return 값 5개 이상이면 추상화 실패 의심

## 핵심 패턴 요약

### 폴더 구조
- **지역성**: 파일은 사용되는 곳 가까이
- **Page First**: 로컬 → 재사용 시 상위로
- `models/` = 서버 타입(DTO), `types/` = 클라이언트 타입(schema 포함)
- `modules/` = UI + 로직 + 상태 묶음 (여러 페이지 재사용)
- `_common/` = 도메인 내 형제 페이지 간 공유

### API 패턴
- 네이밍: `fetch`/`post`/`update`/`delete` + 명사
- 파라미터: 항상 `*Params` 타입 객체
- DTO: 도메인별 단일 파일 (`[domain].dto.ts`)

### React Query
- queryOptions 팩토리 패턴
- useSuspenseQuery 기본
- mutateAsync + try-catch (mutate 금지)
- invalidateQueries는 mutationOptions.onSuccess에서

### Form (zod + react-hook-form)
- 스키마: `types/{domain}.schema.ts`에 정의
- 타입: `z.infer<typeof schema>`로 파생 (별도 정의 금지)
- 패턴: `useForm + zodResolver + handleSubmit + mutateAsync`
- `form.getValues()` 직접 사용 금지 → `handleSubmit(async (data) => {})` 사용

### 에러 처리
- Exception vs Error State 구분
- 구조적 타입 체크 (instanceof 금지)
- AsyncBoundary = ErrorBoundary + Suspense + QueryErrorResetBoundary

## References

상세 패턴, 코드 예시, 안티패턴은 아래 파일에 정의되어 있다:

- **`references/api-layer.md`** — Remote, Query, Mutation, DTO 상세 패턴
- **`references/code-principles.md`** — 코드 철학 상세 + 안티패턴 예시
- **`references/coding-style.md`** — Form, useEffect, 네이밍, 코딩 스타일 상세
- **`references/error-handling.md`** — 에러 처리 체계 상세
- **`references/folder-structure.md`** — 폴더 규칙, 파일 접미사, 배치 규칙 상세
