# 14. 간단한 기능 구현 실습

> 학습한 패턴들을 조합해서 간단한 API를 직접 만들어본다.

## 학습 목표
- [ ] v2 API 엔드포인트를 처음부터 만들 수 있다 (Controller + Service + Module + DTO)
- [ ] RouterModule에 새 경로를 등록할 수 있다
- [ ] 기존 Repository를 활용해서 데이터를 조회/수정할 수 있다
- [ ] .docs.ts를 만들어 Swagger 문서를 추가할 수 있다

## 핵심 질문
- 새 기능 추가 시 체크리스트(STRUCTURE.md 8절)를 따라 빠뜨리는 것 없이 만들 수 있는가?
- 기존 코드를 참고해서 컨벤션에 맞는 코드를 쓸 수 있는가?
- typecheck와 lint를 통과하는 코드를 쓸 수 있는가?

## 실습 과제 (제안)
1. **GET API 추가**: 기존 엔티티를 활용한 간단한 조회 API
   - 새 Controller, Service, Module, DTO 파일 생성
   - RouterModule에 경로 등록
   - Swagger 문서 추가
2. **기존 API에 필드 추가**: Response DTO에 새 필드를 추가하고, Service에서 데이터를 채우는 작업

## 참고
- `STRUCTURE.md` 8절 — 새 기능 추가 시 체크리스트
- `CODING.md` — 코딩 컨벤션

## 메모
_(학습하면서 채워나갈 영역)_
