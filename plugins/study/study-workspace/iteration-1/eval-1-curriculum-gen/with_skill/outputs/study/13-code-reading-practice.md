# 13. 코드 리딩 실습: 하나의 API 흐름 추적

> 실제 API 하나를 골라서 요청 -> 응답까지 전체 코드를 따라가본다.

## 학습 목표
- [ ] 하나의 GET API 엔드포인트를 Controller -> Service -> Repository -> Entity까지 추적할 수 있다
- [ ] 각 레이어에서 어떤 변환이 일어나는지 설명할 수 있다
- [ ] Guard, DTO validation, populate 등이 실제로 어디서 동작하는지 확인할 수 있다
- [ ] 코드를 읽으면서 모르는 패턴을 스스로 찾아볼 수 있다

## 핵심 질문
- funnel 문서 목록 조회 API의 전체 흐름은?
- HTTP 요청이 들어와서 DB 쿼리가 나가기까지 거치는 레이어는?
- 응답 데이터가 Entity에서 DTO로 변환되는 과정은?
- 이 API에서 암호화된 필드는 어떻게 복호화되어 응답에 담기는가?

## 실습 대상 (제안)
- `GET /v2/funnel/documents` — funnel 문서 목록 조회
  - `src/api-admin/v2/funnel/document/document.controller.ts`
  - `src/api-admin/v2/funnel/document/document.service.ts`
  - `src/domain/document/` — 도메인 서비스
  - `src/modules/entities/document/document-v2/` — 엔티티

## 메모
_(학습하면서 채워나갈 영역)_
