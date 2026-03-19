# 05. RouterModule과 v2 API 구조

> v1은 플랫한 구조, v2는 RouterModule로 중첩 라우팅을 구현한다.

## 학습 목표
- [ ] v1과 v2 API 구조의 차이를 설명할 수 있다
- [ ] RouterModule.register()로 경로가 어떻게 조합되는지 안다
- [ ] 새 v2 API 서브모듈을 추가하려면 어디를 수정해야 하는지 안다
- [ ] Express의 중첩 라우터와 NestJS RouterModule의 차이를 안다

## 핵심 질문
- `RouterModule.register([{ path: 'v2', children: [...] }])`에서 경로는 어떻게 합쳐지나?
- FunnelModule 안에 document/, order/ 서브모듈이 있는데, 각각의 URL 경로는?
- v1 API는 왜 아직 남아있고, v2와 어떻게 공존하는가?
- 새 엔드포인트를 추가하려면 어떤 파일들을 만들어야 하는가?

## 참고 (레포 파일)
- `src/api-admin/v2/api-admin.v2.module.ts` — RouterModule 등록
- `src/api-admin/v2/funnel/` — v2 구조 예시
- `src/api-admin/document/` — v1 구조 예시

## 메모
_(학습하면서 채워나갈 영역)_
