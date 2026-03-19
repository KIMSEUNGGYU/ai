# 01. NestJS Fundamentals

> Express 경험을 기반으로 NestJS의 핵심 구조(Module, DI, Controller)를 이해한다

## 학습 목표
- [x] Module 시스템이 Express의 app.use()와 어떻게 다른지 이해
- [x] DI(Dependency Injection)가 왜 필요하고 new Service()를 직접 하지 않는 이유 파악
- [x] Controller 데코레이터(@Get, @Post)와 Express router.get()의 차이 이해

## 핵심 질문
- NestJS Module은 Express의 미들웨어 등록과 뭐가 다른가?
- DI 컨테이너가 해결하는 문제는 무엇인가?
- 데코레이터 기반 라우팅이 Express 라우터보다 나은 점은?

## 참고 (레포 파일 / 웹 리소스)
- `src/app-combined.module.ts` — 루트 모듈, DynamicModule 패턴
- `src/api-admin/api-admin.module.ts` — 서비스별 모듈 분리
- https://docs.nestjs.com/modules
- https://docs.nestjs.com/providers

## 메모

### 2026-03-19 세션

**핵심 발견:**
- NestJS Module은 Express의 `app.use()`와 근본적으로 다름. Express는 미들웨어를 순서대로 등록하는 flat한 구조인 반면, NestJS Module은 의존성 그래프를 선언적으로 정의하는 트리 구조. `imports`, `providers`, `exports`로 모듈 간 경계와 공유 범위를 명시적으로 제어한다.
- DI를 쓰는 이유: `new Service()`를 직접 호출하면 의존성 체인을 호출자가 관리해야 함. 예를 들어 ServiceA가 ServiceB, ServiceC에 의존하면 `new ServiceA(new ServiceB(), new ServiceC())`처럼 수동 조립이 필요. DI 컨테이너가 이를 자동으로 해결하고, 테스트 시 mock 주입도 쉬워진다.
- `AppCombinedModule.register()`에서 `ts-pattern`의 `match()`로 환경(phase/service)에 따라 import할 모듈을 분기하는 DynamicModule 패턴을 확인. local/dev에서는 admin-api + public-api + consumer를 한 인스턴스에 띄우고, prod에서는 서비스별로 분리.
- Controller 데코레이터(`@Get`, `@Post`)는 Express의 `router.get()`과 달리 메서드 위에 선언적으로 붙음. Express는 라우트 정의와 핸들러가 분리될 수 있지만, NestJS는 메서드 자체가 라우트 정의를 포함하므로 응집도가 높다. 또한 `@Body()`, `@Param()` 등 파라미터 데코레이터로 요청 파싱도 선언적으로 처리.

**코드 참조:**
- `src/app-combined.module.ts:158-171` — `AppCombinedModule.register()` DynamicModule 패턴. phase/service 조합으로 모듈 분기
- `src/app-combined.module.ts:345-364` — `APP_PIPE`, `APP_FILTER`, `APP_INTERCEPTOR` 등 글로벌 프로바이더를 providers 배열에 등록. Express의 `app.use(middleware)`에 대응되지만 DI 컨텍스트 안에서 동작

**아직 궁금한 것:**
- DynamicModule의 `register()` vs `forRoot()` vs `forRootAsync()` 차이와 사용 기준
- Module의 `exports`가 정확히 어떤 스코프까지 공유되는지 (re-export 패턴)
- Custom Provider (`useFactory`, `useClass`, `useValue`)의 실전 사용 패턴
