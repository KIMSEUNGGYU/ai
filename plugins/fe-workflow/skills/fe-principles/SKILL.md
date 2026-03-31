---
name: fe-principles
description: >
  FE 코드 작성 시 컨벤션을 로드한다. React/Next.js 컴포넌트, hooks, 페이지,
  API 연동(query/mutation/remote/dto), 폼(zod/react-hook-form), 폴더 구조 결정 시 사용.
  "컴포넌트 만들어줘", "API 연동", "폴더 구조", "폼 구현", "쿼리 작성",
  "리팩토링 해줘", "코드 작성해줘", "구현해줘", "페이지 만들어줘" 등.
---

# 프론트엔드 코드 원칙

## 워크플로우

| 시점 | 액션 |
|------|------|
| **전체 자동화** | `/fe:harness` 실행 — Planning → Build Loop → Summary |
| **스펙 생성** | `/fe:planning` 실행 — 소크라테스식 질문 + 모호성 체크 |
| **코드 구현** | `/fe:implementing` 실행 — Contract 기반 구현 + Static Gate |
| **코드 평가** | `/fe:evaluating` 실행 — Contract + 열린 평가 + Contrarian |

## 직접 코드 작성 시

`/fe:implementing` 없이 직접 코드를 작성할 때는, **작업에 해당하는 references 파일을 먼저 읽어라.**

| 작업 유형 | 필수 읽기 |
|-----------|-----------|
| API/Remote/Query/Mutation | `references/api-layer.md` |
| 폼(react-hook-form, zod) | `references/coding-style.md` + `references/folder-structure.md` |
| 새 파일/폴더 생성 | `references/folder-structure.md` |
| 컴포넌트/훅 작성 | `references/coding-style.md` |
| 리팩토링 | `references/code-principles.md` |

**여러 작업 유형이 겹치면 해당하는 모든 파일을 읽는다.**

## References

- **`references/api-layer.md`** — Remote, Query, Mutation, DTO 상세 패턴
- **`references/code-principles.md`** — 코드 철학 상세 + 안티패턴 예시
- **`references/coding-style.md`** — Form, useEffect, 네이밍, 코딩 스타일 상세
- **`references/folder-structure.md`** — 폴더 규칙, 파일 접미사, 배치 규칙 상세
