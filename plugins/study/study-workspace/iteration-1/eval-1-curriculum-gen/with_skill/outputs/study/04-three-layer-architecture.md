# 04. 3-Layer 아키텍처: api -> domain -> entities

> 이 레포의 핵심 설계. 계층 간 의존 방향이 정해져 있다.

## 학습 목표
- [ ] api-admin, domain, modules/entities 각 레이어의 책임을 설명할 수 있다
- [ ] "상위 -> 하위 의존 가능, 역방향 금지" 규칙을 이해한다
- [ ] api-admin vs api-public의 차이를 안다
- [ ] core/의 위치와 역할을 안다 (모든 레이어에서 사용 가능)

## 핵심 질문
- Express 프로젝트에서 routes/services/models로 나누는 것과 이 레포의 3-Layer는 뭐가 다른가?
- domain 레이어가 api와 entities 사이에 있는 이유는?
- api-admin에서 api-public의 서비스를 가져다 쓸 수 있는가? 그 반대는?
- 같은 domain 서비스를 admin과 public에서 동시에 쓰는 경우는 어떻게 되어 있는가?

## 참고 (레포 파일)
- `src/api-admin/` — Admin API 레이어
- `src/api-public/` — Public API 레이어
- `src/domain/` — 도메인 비즈니스 로직
- `src/modules/entities/` — 엔티티 레이어
- `src/core/` — 공통 인프라

## 메모
_(학습하면서 채워나갈 영역)_
