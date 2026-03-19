# 07. MikroORM 기본: Entity, Repository, flush

> Mongoose와 달리 MikroORM은 Unit of Work 패턴 — 변경을 모았다가 flush()로 한 번에 DB에 반영한다.

## 학습 목표
- [ ] MikroORM의 Unit of Work 패턴이 뭔지, Mongoose의 save()와 뭐가 다른지 안다
- [ ] Entity 데코레이터(@Entity, @Property, @PrimaryKey)의 역할을 안다
- [ ] flush()가 언제 호출되는지, 왜 명시적으로 호출해야 하는지 안다
- [ ] EntityManager와 EntityRepository의 차이를 안다

## 핵심 질문
- `em.create()` 후 `em.flush()`를 해야 DB에 반영되는 이유는?
- `writeRepository`와 `readonlyRepository`를 분리하는 이유는? (Read Replica 패턴)
- `@Property({ name: 'business_name' })`에서 name은 왜 필요한가? (camelCase vs snake_case)
- `RW_CONNECTION_ISHOPCARE` 상수는 뭘 의미하는가?

## 참고 (레포 파일)
- `src/modules/entities/document/document-v2/document-v2.entity.ts` — Entity 예시
- `src/modules/entities/document/document-v2/document-v2.repository.ts` — Repository 예시
- `src/core/mikro/` — MikroORM 유틸리티
- `src/core/mikro/utils/insertBulk.ts` — 벌크 처리 패턴

## 참고 (웹 리소스)
- https://mikro-orm.io/docs/unit-of-work — Unit of Work 공식 문서

## 메모
_(학습하면서 채워나갈 영역)_
