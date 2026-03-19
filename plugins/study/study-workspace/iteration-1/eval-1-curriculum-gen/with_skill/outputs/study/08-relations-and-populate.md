# 08. 관계 매핑과 populate

> @ManyToOne, @OneToMany로 관계를 정의하고, populate로 JOIN 없이 관련 데이터를 가져온다.

## 학습 목표
- [ ] @ManyToOne, @OneToMany, @OneToOne 관계의 차이를 안다
- [ ] populate 옵션이 SQL의 JOIN과 어떻게 다른지 안다
- [ ] N+1 문제가 뭔지, populate로 어떻게 해결하는지 안다
- [ ] 이 레포에서 Document <-> Order <-> Merchant 관계 구조를 따라갈 수 있다

## 핵심 질문
- Mongoose의 `populate()`와 MikroORM의 `populate`는 어떤 점이 같고 다른가?
- `findAndCount(whereOption, { populate: ['order', 'merchantDocument'] })`에서 내부적으로 몇 번 쿼리가 나가는가?
- 관계를 정의하지 않고 raw query로 JOIN하면 안 되는가? 이 레포의 컨벤션은?
- Lazy loading vs Eager loading — 이 레포는 어떤 전략을 쓰는가?

## 참고 (레포 파일)
- `src/modules/entities/document/document-v2/document-v2.entity.ts` — @ManyToOne 예시
- `src/modules/entities/order/` — Order 엔티티 관계
- `CODING.md` 5.2절 — 쿼리빌더 지양 원칙

## 메모
_(학습하면서 채워나갈 영역)_
