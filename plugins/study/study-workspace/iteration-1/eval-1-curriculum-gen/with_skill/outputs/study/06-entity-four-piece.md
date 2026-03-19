# 06. 엔티티 4종 세트 패턴

> 모든 엔티티는 Interface, Entity, Repository, Subscriber 4개 파일로 구성된다.

## 학습 목표
- [ ] 4종 세트 각 파일의 역할과 책임을 설명할 수 있다
- [ ] Interface(.ts)와 Entity(.entity.ts)를 분리하는 이유를 안다
- [ ] Subscriber가 어떤 상황에서 필요한지 안다
- [ ] Repository Module에서 @Global()을 쓰는 이유를 안다

## 핵심 질문
- Express+Mongoose에서는 Schema 하나로 끝나는데, 왜 4개 파일이 필요한가?
- Interface를 Entity와 분리하면 어떤 이점이 있는가?
- Subscriber의 afterCreate, beforeUpdate는 실제로 어떤 용도에 쓰이는가?
- v1/v2 엔티티가 같은 도메인 디렉토리 안에 공존하는 구조는?

## 참고 (레포 파일)
- `src/modules/entities/document/document-v2/document-v2.ts` — Interface
- `src/modules/entities/document/document-v2/document-v2.entity.ts` — Entity
- `src/modules/entities/document/document-v2/document-v2.repository.ts` — Repository
- `src/modules/entities/document/document-v2/document-v2.subscriber.ts` — Subscriber

## 메모
_(학습하면서 채워나갈 영역)_
