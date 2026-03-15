# Phase 1: 패턴 전달 개선

## 목표
implement의 code-writer가 프로젝트 `.ai/patterns/`도 읽도록 개선.
→ 패턴 불일치(35%) 감소 기대.

## 배경
- code-writer는 현재 플러그인 conventions/ 5개만 읽음
- 프로젝트 `.ai/patterns/`(react-hook-form, api-tanstack-query 등)는 전달 안 됨
- 컨벤션 = "무엇을 해라" (원칙), 패턴 = "우리는 이렇게 한다" (구체적 예시)
- AI는 원칙보다 구체적 코드 예시를 더 잘 따름

## 작업
- [ ] implement.md 수정 — code-writer에게 `.ai/patterns/*.md` 경로 전달
- [ ] code-writer.md 수정 — Step 1에 패턴 로드 추가
- [ ] 패턴 동기화 — second의 7개 패턴을 main에도 반영
- [ ] 실전 검증 — 회사 프로젝트에서 패턴 읽힌 상태로 구현 테스트
- [ ] 결과 평가 — "이건 아닌데" 빈도 비교

## 패턴 문서 현황
| 프로젝트 | 패턴 수 | 내용 |
|---------|--------|------|
| ishopcare-frontend | 2개 | react-hook-form, file-picker |
| ishopcare-frontend-second | 7개 | api-tanstack-query, query-key, filter-infinite-scroll-table, funnel, attachment-compound, sortable-table, realtime-search-autocomplete |

## 성공 기준
- code-writer가 패턴 문서를 읽고 "이 패턴을 따랐습니다" 보고
- 패턴 불일치 관련 수정 요청 빈도 감소
