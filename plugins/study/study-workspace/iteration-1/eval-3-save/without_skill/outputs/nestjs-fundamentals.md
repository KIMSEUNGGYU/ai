---
tags: [nestjs, backend, learning]
date: 2026-03-19
status: done
---

# NestJS 기초 학습 노트

프로젝트: ishopcare-retool-server (NestJS + Fastify + MikroORM)

## 1. Module 시스템 vs Express의 app.use()

**Express**: `app.use()`로 미들웨어를 순서대로 쌓는 플랫 구조. 모든 것이 하나의 app에 등록됨.

**NestJS**: `@Module()` 데코레이터로 관련 기능을 캡슐화. 각 모듈이 자신의 controllers, providers, imports를 선언.

실제 예시 — `app-combined.module.ts`:
- `AppCombinedModule.register()`가 phase/service에 따라 다른 모듈 조합을 동적으로 구성
- `DynamicModule` 패턴으로 런타임에 imports/providers 결정
- local/dev에서는 `ApiAdminModule + ApiPublicModule + ConsumerModule` 전부 로드
- prod에서는 service별로 분리 (`admin-api` → AdminModule만, `public-api` → PublicModule만)

핵심 차이: Express는 "이 미들웨어를 전역에 붙인다", NestJS는 "이 기능 묶음을 이 모듈에 격리한다".

## 2. DI (Dependency Injection) — 왜 new Service()를 직접 하지 않는가

**직접 생성의 문제**:
```typescript
// 이렇게 하면 Controller가 Service의 생성 방법을 알아야 함
class OrderController {
  private service = new OrderService(new OrderRepository(), new ConfigService());
}
```

**NestJS DI**:
```typescript
// NestJS가 의존성 트리를 자동으로 해결
@Controller()
class OrderController {
  constructor(private readonly orderService: OrderService) {}
}
```

이점:
- **테스트 용이**: mock 주입이 간단 (`useValue`, `useFactory`)
- **생성 책임 분리**: 컨트롤러는 서비스를 "사용"만 함
- **스코프 제어**: Singleton(기본), Request, Transient 스코프 지원

실제 프로젝트에서의 DI 활용:
- `APP_PIPE`, `APP_FILTER`, `APP_INTERCEPTOR` 토큰으로 글로벌 providers 등록
- `ConfigService`를 `inject`로 주입받아 팩토리에서 사용 (DB 설정 등)
- `EncryptModule.forRootAsync()`처럼 비동기 팩토리로 설정값 기반 모듈 초기화

## 3. Controller 데코레이터 vs Express router

**Express**:
```typescript
router.get('/orders/:id', (req, res) => {
  const id = req.params.id;
  const result = orderService.findById(id);
  res.json(result);
});
```

**NestJS**:
```typescript
@Controller('orders')
class OrderController {
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }
}
```

차이점:
- 라우트 정의가 선언적 (데코레이터 기반)
- `req`, `res` 객체 직접 접근 대신 `@Param()`, `@Body()`, `@Query()` 등으로 필요한 값만 추출
- 반환값이 자동으로 JSON 직렬화 (res.json() 불필요)
- `@Controller()` prefix + 메서드 데코레이터로 라우트 경로 조합

## 4. 프로젝트 구조에서 배운 점

`app-combined.module.ts`에서 관찰한 패턴들:

- **ts-pattern의 match()**: if-else 대신 패턴 매칭으로 모듈 조합 결정
- **글로벌 인터셉터 체인**: Logging → AdminLog → AdminLogV2 → ScrapingResponseConvert 순서로 등록
- **엔티티 명시 등록**: MikroORM에 300개+ 엔티티를 명시적으로 나열 (자동 스캔 대신 명시적 제어)
- **DynamicModule 패턴**: `forRoot()`, `forRootAsync()`, `register()` 등 설정 기반 모듈 초기화
