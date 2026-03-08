# 폴더 구조 컨벤션

> 지역성(Locality) 기반 서비스 내부 구조 및 네이밍 규칙

---

## 1. 핵심 원칙

### 지역성 (Locality)

파일은 **사용되는 곳 가까이** 배치. 폴더 위치가 사용 범위를 보장한다.

```
// ❌ 역할 중심: UserProfile이 어디서 쓰이는지 모름
src/components/
├── UserProfile.tsx         // user 페이지에서만 사용
└── Button.tsx              // 전역에서 사용

// ✅ 지역성: 폴더 위치 = 사용 범위
src/
├── components/
│   └── Button.tsx              // 전역 공통만
└── pages/user/
    └── components/
        └── UserProfile.tsx     // user 페이지 전용
```

### Page First

**처음엔 페이지 로컬에 생성하고, 재사용이 필요할 때 상위로 이동한다.**

```
// 1단계: 페이지 로컬에 생성
src/pages/product-detail/
├── components/
│   └── PriceSection.tsx    // 여기서 시작
└── ProductDetailPage.tsx

// 2단계: 두 번째 사용처가 생기면 상위로 이동
src/
├── components/
│   └── PriceSection.tsx    // 공통으로 승격
└── pages/
    ├── product-detail/
    └── cart/               // 두 번째 사용처
```

### 이동 판단 기준

| 질문 | 로컬 유지 | 상위 이동 |
|------|-----------|-----------|
| 이 파일을 다른 페이지에서 쓰는가? | No | Yes |
| UI만 재사용? | — | `src/components/` |
| UI + 로직 함께 재사용? | — | `src/modules/` |

---

## 2. 서비스 내부 전체 구조

```
pages/                     # Next.js 라우팅 (프레임워크 요구)
├── _app.tsx
├── _document.tsx
├── index.tsx
├── auth/
└── [domain]/

src/
├── components/            # 전역 공통 UI
├── hooks/                 # 전역 커스텀 훅
├── utils/                 # 전역 순수 유틸
├── lib/                   # 전역 인프라 (HttpClient, queryClient, auth)
├── constants/             # 전역 상수
├── contexts/              # 전역 Context
├── models/                # 전역 서버 타입 (DTO)
├── types/                 # 전역 클라이언트 타입
├── queries/               # 전역 React Query 쿼리
├── mutations/             # 전역 React Query 뮤테이션
├── remotes/               # API 클라이언트 및 공통 API
├── stores/                # 전역 상태 (zustand 등)
├── modules/               # 기능 패키지 (UI + 로직 + 상태)
└── pages/                 # 페이지별 리소스
    └── {page}/
        ├── components/
        ├── hooks/
        ├── queries/
        ├── mutations/
        ├── remotes/
        ├── models/
        ├── types/
        ├── contexts/
        ├── constants/
        └── {page}Page.tsx
```

### 두 개의 pages

- `/pages`: Next.js 라우팅 (프레임워크 요구, 라우트 진입점)
- `/src/pages`: 페이지별 컴포넌트, 훅, 로직 (실제 코드)

### 전역 vs 로컬

`src/` 바로 아래 = **전역** (여러 페이지에서 공유)
`src/pages/{page}/` 아래 = **로컬** (해당 페이지 전용)

같은 이름의 폴더(components, hooks 등)가 양쪽에 존재할 수 있다.

---

## 3. 전역 폴더 역할

| 폴더 | 역할 | 실제 예시 (admin) |
|------|------|-------------------|
| `components/` | 전역 공통 UI | `AuthGuard`, `Loading`, `InfiniteScrollLoader`, `layout/` |
| `hooks/` | 전역 커스텀 훅 | `useTableCheckboxState`, `useIsClient` |
| `utils/` | 순수 유틸 함수 | 포맷터, 파서 등 |
| `lib/` | 인프라 설정 | `HttpClient`, `queryClient`, `auth`, `sentry-service` |
| `constants/` | 전역 상수 | 공통 상수값 |
| `contexts/` | 전역 Context | 인증 Context 등 |
| `models/` | 전역 서버 타입 (DTO) | 여러 페이지에서 공유하는 API 응답 타입 |
| `types/` | 전역 클라이언트 타입 | `NextPageWithLayout`, `CursorPaginationParams` 등 |
| `queries/` | 전역 queryOptions | 여러 페이지에서 공유하는 쿼리 |
| `mutations/` | 전역 mutationOptions | 여러 페이지에서 공유하는 뮤테이션 |
| `remotes/` | API 클라이언트 | httpClient 인스턴스, 공통 API 함수 |
| `stores/` | 전역 상태 | `auth.store`, `user.store` |
| `modules/` | 기능 패키지 | UI + 로직 + 상태가 묶인 단위 |

---

## 4. 페이지 로컬 구조

### 실제 예시: document-task (admin)

```
src/pages/document-task/
├── document-task-list/                    # 리스트 페이지
│   ├── DocumentTaskPage.tsx
│   ├── components/
│   │   ├── Filter.tsx
│   │   ├── AssignManagerButton.tsx
│   │   ├── AssignManagerModal.tsx
│   │   └── table/
│   │       ├── DocumentTaskTable.tsx
│   │       ├── DocumentTaskTableBody.tsx
│   │       └── DocumentTaskTableRow.tsx
│   ├── hooks/
│   │   └── useDocumentTaskFilters.ts
│   ├── queries/
│   │   ├── document-task.query.ts
│   │   └── filter.query.ts
│   ├── mutations/
│   │   └── document-task.mutation.ts
│   ├── remotes/
│   │   ├── document-task.ts
│   │   └── filter.ts
│   ├── models/
│   │   └── document-tasks.dto.ts
│   └── constants/
│       └── columns.ts
│
├── document-task-detail/                  # 상세 페이지
│   ├── DocumentTaskDetailPage.tsx
│   ├── components/
│   │   ├── TaskInfo.tsx
│   │   ├── DocumentInfo.tsx
│   │   ├── DocumentAttachment.tsx
│   │   ├── WorkLogForm.tsx
│   │   └── WorkLogList.tsx
│   ├── contexts/
│   │   └── TaskDocumentIdContext.tsx
│   ├── queries/
│   │   └── document-task.query.ts
│   ├── mutations/
│   │   └── document-task.mutation.ts
│   ├── remotes/
│   │   └── document-task.ts
│   ├── models/
│   │   └── document-task.dto.ts
│   └── types/
│       └── workLogForm.schema.ts
│
└── assign-manager/                        # 하위 기능 페이지
    ├── AssignManagerPage.tsx
    ├── components/
    ├── hooks/
    ├── queries/
    ├── mutations/
    ├── remotes/
    ├── models/
    ├── types/
    └── constants/
```

**포인트:**
- 도메인(`document-task`) 아래에 기능별(`list`, `detail`, `assign-manager`) 폴더
- 각 기능 폴더가 자체 remotes/queries/mutations/models를 가짐
- 기능 간 공유가 필요하면 도메인 폴더 레벨에 배치

---

## 5. 헷갈리기 쉬운 폴더

### models vs types

| 구분 | 용도 | 예시 |
|------|------|------|
| `models/` | 서버 요청/응답 타입 (DTO) | `document-tasks.dto.ts`, `user.dto.ts` |
| `types/` | 클라이언트 내부 타입 | form 상태, UI 상태, 필터 조건, Zod 스키마 |

### components vs modules

| 구분 | components | modules |
|------|------------|---------|
| 상태 | stateless (순수 UI) | stateful (UI + 로직 + 상태) |
| 포함 | UI만 | UI + 훅 + API 호출 |
| 예시 | `Button`, `Loading` | `view-reason-modal/` (모달 + mutation + remote) |

```
// modules/ 예시 (admin)
src/modules/view-reason-modal/
├── ViewReasonModal.tsx        # UI
├── masking.mutation.ts        # 뮤테이션
├── remote.ts                  # API 호출
└── index.ts                   # 재내보내기
```

modules는 **여러 페이지에서 재사용**하면서 **UI + 로직이 함께 필요한 경우**에 사용.

### _common 폴더

같은 도메인 내 형제 페이지 간 공유가 필요하지만 전역까지 올릴 필요는 없을 때 사용.

```
src/pages/delivery-status/
├── _common/                              # 도메인 내 공유
│   ├── constants/delivery.ts             # 리스트 + 상세 모두 사용
│   └── components/DeliveryStatusBadge.tsx
├── delivery-status-list/                 # 리스트 페이지
└── delivery-status-detail/               # 상세 페이지
```

| 범위 | 위치 | 예시 |
|------|------|------|
| 한 페이지 전용 | `{feature}/constants/` | 리스트 전용 columns |
| 도메인 내 공유 | `{domain}/_common/` | 리스트 + 상세 공유 상수, 뱃지 |
| 서비스 전역 | `src/constants/` | 서비스 공통 |

`_` 접두사는 기능 페이지 폴더와 시각적으로 구분하기 위한 컨벤션.

---

## 6. 네이밍 규칙

### 폴더/파일 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 디렉토리 | kebab-case | `document-task-list/` |
| 컴포넌트 | PascalCase | `TaskHeader.tsx` |
| 페이지 | PascalCase + Page | `DocumentTaskPage.tsx` |
| 훅 | use + camelCase | `useDocumentTaskFilters.ts` |
| Context | PascalCase + Context | `TaskDocumentIdContext.tsx` |

### 파일 접미사

| 접미사 | 용도 | 위치 |
|--------|------|------|
| `.dto.ts` | 서버 타입 (DTO) | `models/` |
| `.query.ts` | React Query 쿼리 | `queries/` |
| `.mutation.ts` | React Query 뮤테이션 | `mutations/` |
| `.schema.ts` | Zod 스키마 | `types/` |
| `.store.ts` | 상태 저장소 | `stores/` |

---

## ✅ DO & ❌ DON'T

### ✅ DO
- 새 파일은 페이지 로컬에서 시작 (Page First)
- 폴더 위치로 사용 범위 보장 (지역성)
- 재사용 시에만 상위로 이동 (점진적 추상화)
- models = 서버 타입, types = 클라이언트 타입으로 분리

### ❌ DON'T
- 한 페이지에서만 쓰는 파일을 `src/components/`에 배치
- 사용 전에 미리 공통 폴더에 생성
- modules 없이 components에 로직 포함시키기
- 전역 폴더에 페이지 전용 코드 두기

---

## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2025-02-05 | 초안 |
