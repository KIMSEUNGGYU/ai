---
description: 페이지/기능 단위 FE 스펙 문서 작성 — "스펙 작성", "spec", "페이지 스펙", "기능 정의", "UI 스펙" 요청에 사용
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
argument-hint: <페이지명 또는 기능명>
---

# FE 스펙 작성 스킬

페이지/기능 단위로 AI가 자율 실행할 수 있는 수준의 스펙 문서를 생성한다.
스펙 품질이 높으면 중간 검수 없이 한번에 구현 가능하다.

## 목적

- 매번 단계별 검수/명령하는 병목 제거
- AI에게 "이 스펙대로 만들어라"로 위임 가능한 문서 생성
- 페이지 내 모달/드로어 등 하위 UI도 구조적으로 포함

## 입력

- `$ARGUMENTS`: 페이지명 또는 기능명 (예: `주문 상세`, `서류 등록 모달`)
- 디자인 참조: 사용자가 별도 제공 (스크린샷, 텍스트 설명 등)

## 진행 단계

### Phase 1: 정보 수집

**AskUserQuestion으로 순차 질문:**

1. "어떤 페이지/기능의 스펙을 작성할까요?" (ARGUMENTS 없을 때)
2. "이 페이지의 URL 경로는 무엇인가요?" (예: `/orders/:orderId`)
3. "이 페이지에서 사용하는 API가 있나요? 있다면 어떻게 참조할까요?"
   - 선택지:
     - "백엔드 코드 경로 제공" (예: `.ai/ref/order-module`)
     - "swagger URL 제공"
     - "API 스펙 문서 이미 있음" (`.ai/specs/api/`)
     - "아직 API 없음 (UI만 먼저)"
4. "이 페이지의 주요 기능을 나열해주세요"
   - 예: 리스트 조회, 필터, 상세 보기, 등록 모달, 삭제
5. "디자인 참조가 있나요?" (스크린샷 경로, 텍스트 설명, 또는 없음)
6. "기존에 참고할 유사 페이지가 있나요?" (있으면 경로)

### Phase 2: 기존 코드/스펙 확인

1. `.ai/specs/` 폴더 확인 — 관련 스펙 이미 있는지
2. `src/pages/` 에서 유사 페이지 구조 샘플링 (참고할 페이지가 있으면 해당 페이지)
3. API 참조 방식에 따라:
   - 백엔드 코드 → controller/DTO 분석
   - swagger → 엔드포인트 파악
   - `.ai/specs/api/` → 기존 스펙 읽기

### Phase 3: 스펙 문서 생성

**위치**: `.ai/specs/{page-name}.md`

**템플릿:**

```markdown
# {페이지명} 스펙

> 작성일: {date}
> 상태: draft | review | approved
> URL: {route path}
> 담당: {작성자}

## 개요

{이 페이지가 무엇을 하는지 1-2문장}

## 페이지 구조

```
{PageName}Page
├── {SectionA}        ← 설명
│   ├── {Component1}  ← 설명
│   └── {Component2}  ← 설명
├── {SectionB}        ← 설명
└── [Modal] {ModalName} ← 트리거: {버튼/조건}
    ├── {ModalContent}
    └── {ModalActions}
```

## 섹션별 상세

### {SectionA}

**UI 요소:**
| 요소 | 타입 | 설명 | 비고 |
|------|------|------|------|
| {필드명} | Input/Select/Table/... | {역할} | {필수여부, 기본값 등} |

**동작:**
- {인터랙션 설명}
- {상태 변화 설명}

**API 매핑:**
- 조회: `GET /api/...` → `fetch{Resource}` → `{resource}Query.list()`
- 저장: `POST /api/...` → `post{Resource}` → `{resource}Mutation.create()`

### [Modal] {ModalName}

> 트리거: {어떤 버튼/조건으로 열리는지}
> 닫기: {저장 후 자동닫기 / X 버튼 / 외부 클릭}

**UI 요소:**
| 요소 | 타입 | 설명 | 비고 |
|------|------|------|------|

**폼 스키마:** (폼이 있을 때)
```typescript
const {modalName}Schema = z.object({
  field1: z.string().min(1, '필수'),
  field2: z.number().optional(),
});
```

**동작:**
- 제출 시: {API 호출} → {성공 시 동작} → {모달 닫기}
- 에러 시: {에러 토스트}

**API 매핑:**
- `POST /api/...` → `post{Resource}` → `{resource}Mutation.create()`

## API 요약

| Method | Endpoint | Remote 함수 | 용도 |
|--------|----------|-------------|------|
| GET | /api/... | fetch{Resource} | 리스트 조회 |
| POST | /api/... | post{Resource} | 등록 |
| PATCH | /api/... | update{Resource} | 수정 |
| DELETE | /api/... | delete{Resource} | 삭제 |

> API 상세는 `.ai/specs/api/{domain}.md` 참조

## 파일 구조 (생성 예정)

```
src/pages/{domain}/{page}/
├── {Page}Page.tsx
├── models/{resource}.dto.ts
├── remotes/{resource}.ts
├── queries/{resource}.query.ts
├── mutations/{resource}.mutation.ts
├── types/{resource}.schema.ts      ← 폼 있을 때
└── components/
    ├── {Section}.tsx
    └── {ModalName}Modal.tsx         ← 모달 있을 때
```

## 엣지 케이스

- {빈 상태 처리}
- {권한 없을 때}
- {로딩 상태}
- {에러 상태}

## 구현 순서

1. DTO + Remote + Query/Mutation (fe:api-integrate 사용)
2. 페이지 레이아웃 + 섹션 컴포넌트
3. 모달/드로어
4. 폼 + Validation
5. 인터랙션 연결 (버튼 → API 호출)
6. 엣지 케이스 처리
7. 타입체크 + 동작 확인
```

### Phase 4: 검토 요청

1. 생성된 스펙 문서를 사용자에게 보여줌
2. AskUserQuestion: "스펙을 검토해주세요. 수정할 부분이 있나요?"
   - 수정 요청 → 반영 후 다시 검토
   - 승인 → 상태를 `approved`로 변경

## 출력 형식

```
스펙 문서 생성 완료

- .ai/specs/{page-name}.md

포함된 내용:
- 페이지 구조: {섹션 수}개 섹션, {모달 수}개 모달
- API: {엔드포인트 수}개 엔드포인트
- 생성 예정 파일: {파일 수}개

다음 단계: 스펙 승인 후 구현 시작
- API 정의: `fe:api-integrate` 사용
- 또는 스펙 기반 일괄 구현 요청
```

## 모달/드로어 처리 규칙

- 페이지 스펙 안에 `### [Modal] 모달명` 또는 `### [Drawer] 드로어명` 섹션으로 포함
- 각 모달/드로어는 독립 섹션: 트리거 조건, UI 요소, 동작, API 매핑을 모두 기술
- 컴포넌트 파일은 `components/{Name}Modal.tsx` 또는 `components/{Name}Drawer.tsx`로 분리
- 복잡한 모달(3개+ 섹션)은 별도 스펙 파일로 분리 가능: `.ai/specs/{page-name}-{modal-name}.md`

## 스펙 품질 체크리스트

스펙이 아래 기준을 만족하면 AI가 검수 없이 구현 가능:

- [ ] 모든 UI 요소가 타입(Input/Select/Table 등)과 함께 나열됨
- [ ] 모든 인터랙션에 "트리거 → 동작 → 결과"가 명시됨
- [ ] 모든 API 호출이 엔드포인트 + Remote 함수명으로 매핑됨
- [ ] 폼이 있으면 Zod 스키마가 포함됨
- [ ] 모달/드로어의 열기/닫기 조건이 명시됨
- [ ] 파일 구조(생성 예정 파일 목록)가 포함됨
- [ ] 엣지 케이스(빈 상태, 에러, 권한)가 포함됨
