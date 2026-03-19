# 02. DI(의존성 주입)와 Provider

> Express에서는 require/import로 직접 가져오지만, NestJS는 프레임워크가 알아서 넣어준다.

## 학습 목표
- [ ] DI가 뭔지, 왜 쓰는지 Express 경험에 비추어 설명할 수 있다
- [ ] @Injectable(), constructor injection 패턴을 안다
- [ ] 이 레포에서 Service가 Repository를 주입받는 패턴을 읽을 수 있다
- [ ] @Inject()와 Symbol 토큰 방식을 이해한다 (외부 API 모듈에서 사용)

## 핵심 질문
- Express에서 `const userService = require('./userService')` 하던 것과 DI는 뭐가 다른가?
- constructor에 타입만 적으면 NestJS가 알아서 인스턴스를 넣어주는 원리는?
- `@InjectRepository()`와 `@InjectEntityManager()`는 무엇을 주입하는가?
- providers에 등록 안 하면 어떤 에러가 나는가?

## 참고 (레포 파일)
- `src/domain/document/document.service.ts` — Service에서 Repository 주입 예시
- `src/modules/entities/document/document-v2/document-v2.repository.ts` — Repository 주입 패턴
- `src/modules/google-ads-api/` — Symbol 토큰 기반 DI

## 메모
_(학습하면서 채워나갈 영역)_
