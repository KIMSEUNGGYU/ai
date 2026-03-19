# NestJS 기초 개념 - ishopcare-retool-server 기반

## 1. Module - 앱의 구성 단위

NestJS 앱은 **Module**의 트리 구조로 이루어진다. React의 컴포넌트 트리와 비슷한 개념인데, 관련된 Controller/Service/Repository를 하나로 묶는 역할을 한다.

### 가장 단순한 형태

```ts
// src/core/health/health.module.ts
@Module({
  imports: [],
  controllers: [HealthController],
})
export class HealthModule {}
```

`@Module()` 데코레이터 안에 3가지 핵심 속성이 있다:

| 속성 | 역할 | FE 비유 |
|------|------|---------|
| `imports` | 다른 모듈을 가져옴 | `import` 문으로 다른 패키지 가져오는 것 |
| `controllers` | HTTP 요청을 받는 클래스 등록 | Next.js의 API route handler |
| `providers` | 비즈니스 로직 클래스(Service 등) 등록 | Context에 주입할 값들 |
| `exports` | 다른 모듈에 제공할 provider | 패키지의 `export` |

### 실제 예시 - AddressModule

```ts
// src/api-admin/address/address.module.ts
@Global()
@Module({
  imports: [TossImModule, HttpTemplateModule],
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}
```

- `TossImModule`, `HttpTemplateModule`을 import해서 그 안의 exported provider를 사용
- `AddressController`가 HTTP 요청을 받고
- `AddressService`가 실제 로직을 처리
- `@Global()` : 이 모듈을 한 번 import하면 앱 전체에서 사용 가능 (React의 전역 Context와 유사)

### 모듈 트리 구조

이 프로젝트의 모듈 트리를 단순화하면:

```
main.ts
  └─ AppCombinedModule          ← 루트 모듈
       ├─ ApiAdminModule        ← admin API 모듈 묶음
       │    ├─ AddressModule
       │    ├─ OrderModule
       │    ├─ InquiryModule
       │    ├─ ...30+ 모듈들
       │    └─ ApiAdminV2Module ← v2 API (RouterModule로 경로 prefix)
       ├─ ApiPublicModule       ← public API 모듈 묶음
       ├─ ConsumerModule        ← 큐 컨슈머 모듈
       ├─ HealthModule          ← 헬스체크
       └─ (DB, 암호화 등 인프라 모듈들)
```

`ApiAdminModule`은 `DynamicModule` 패턴을 사용한다:

```ts
// src/api-admin/api-admin.module.ts
@Module({})
export class ApiAdminModule {
  static register(): DynamicModule {
    return {
      module: ApiAdminModule,
      imports: [
        InquiryModule,
        OrderModule,
        AddressModule,
        // ...30+ 모듈
      ],
    };
  }
}
```

`DynamicModule`은 런타임에 설정값을 받아 모듈을 구성할 때 쓴다. `AppCombinedModule`에서 phase/service 값에 따라 어떤 모듈을 로드할지 결정하는 부분이 대표적이다:

```ts
// src/app-combined.module.ts (핵심만 발췌)
const applicationModulesToImport = match({ phase, service })
  .with({ phase: P.union('dev', 'local', 'develop') }, () => [
    ApiAdminModule.register(),
    ApiPublicModule.register(),
    ConsumerModule,
  ])
  .with({ service: 'admin-api' }, () => [ApiAdminModule.register(), ConsumerModule])
  .with({ service: 'public-api' }, () => [ApiPublicModule.register(), ConsumerModule])
  .otherwise(() => []);
```

로컬/개발 환경에서는 모든 모듈을 한 서버에 띄우고, 운영에서는 service별로 분리한다.

---

## 2. Controller - HTTP 요청의 진입점

React에서 페이지 컴포넌트가 URL과 매핑되듯, Controller는 HTTP 엔드포인트와 매핑된다.

```ts
// src/api-admin/address/address.controller.ts
@Controller('address')                              // ← 기본 경로: /address
export class AddressController {
  constructor(private readonly addressService: AddressService) {}  // ← DI (뒤에서 설명)

  @Get('addresses')                                 // ← GET /address/addresses
  async getAddresses(@Query('address') address: string) {
    return await this.addressService.getAddresses(address);
  }
}
```

핵심 데코레이터들:

| 데코레이터 | 역할 | 예시 |
|-----------|------|------|
| `@Controller('path')` | 컨트롤러의 기본 경로 | `@Controller('address')` |
| `@Get()`, `@Post()`, `@Put()`, `@Delete()` | HTTP 메서드 + 하위 경로 | `@Get('addresses')` |
| `@Query()` | 쿼리스트링 파라미터 | `?address=서울` |
| `@Param()` | URL 경로 파라미터 | `/orders/:id` |
| `@Body()` | 요청 본문 | POST body |

### v2 RouterModule 패턴

이 프로젝트에서는 v2 API에 `RouterModule`을 사용해 경로 prefix를 일괄 적용한다:

```ts
// src/api-admin/v2/api-admin.v2.module.ts (발췌)
RouterModule.register([
  {
    path: 'v2',
    children: [
      { path: 'auth', module: AuthModule },        // → /v2/auth/*
      { path: 'orders', module: OrderModule },      // → /v2/orders/*
      { path: 'funnel/orders', module: FunnelOrderModule },  // → /v2/funnel/orders/*
    ],
  },
]),
```

각 모듈의 Controller에 정의된 경로 앞에 `v2/...`가 자동으로 붙는다. 모듈 안의 Controller는 자기 경로만 신경쓰면 된다.

### HealthController - 가장 단순한 예시

```ts
// src/core/health/health.controller.ts
@Controller('')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('health')
  async health() {
    return 'ok';
  }

  @Get('info')
  async info() {
    const service = this.configService.get<string>('SERVICE') ?? 'UNKNOWN';
    const phase = this.configService.get<string>('PHASE') ?? 'UNKNOWN';
    return { service, phase };
  }
}
```

`ConfigService`는 NestJS 내장 모듈로, `.env` 파일의 환경변수를 읽는다. 이것도 DI로 주입받는다.

---

## 3. Service - 비즈니스 로직 담당

Controller는 "요청을 받아 응답을 돌려주는 것"만 하고, 실제 로직은 Service에 위임한다.

```ts
// src/api-admin/address/address.service.ts
@Injectable()                                        // ← DI 컨테이너에 등록 가능하다는 표시
export class AddressService {
  constructor(
    @Inject(HTTP_TEMPLATE_FACTORY) private readonly httpTemplateFactory: HttpTemplateFactory,
    private readonly tossImClient: TossImClient
  ) {}

  async getAddresses(address: string) {
    const httpTemplate = this.httpTemplateFactory.create();
    const result = await this.tossImClient.getAddresses({ httpTemplate, keyword: address });
    return result;
  }
}
```

### 더 복잡한 Service 예시 - DocumentExpirationService

```ts
// src/domain/document-expiration/document-expiration.service.ts
@Injectable()
export class DocumentExpirationService {
  private static readonly EXPIRATION_DAYS = 90;

  constructor(
    private readonly documentExpirationTaskRepository: DocumentExpirationTaskRepository,
    private readonly documentAttachmentRepository: DocumentAttachmentRepository,
    private readonly domainFileStorageService: DomainFileStorageService
  ) {}

  async createDocumentExpirationTask({ documentId }: { documentId: number }) {
    const attachments = await this.documentAttachmentRepository
      .findByDocumentIdExceptContract(documentId);

    if (attachments.length === 0) return;

    const now = At.now();
    const today = new At(`${now.toYmdString('-')} 00:00:00`, { format: 'yyyy-MM-dd HH:mm:ss' });
    const toExpireTs = today.add.days(DocumentExpirationService.EXPIRATION_DAYS).toDate();

    await this.documentExpirationTaskRepository.createIfNotExisted({ documentId, toExpireTs });
  }
}
```

Service는 여러 Repository(DB 접근)나 다른 Service를 조합해서 도메인 로직을 수행한다.

---

## 4. DI (Dependency Injection) - 핵심 메커니즘

FE에서 React Context나 Zustand store를 사용해 의존성을 주입하는 것과 같은 개념이다. 다만 NestJS는 이걸 프레임워크 레벨에서 자동으로 해준다.

### DI가 동작하는 흐름

```
1. @Injectable() 붙은 클래스를 만든다
2. Module의 providers에 등록한다
3. 다른 클래스의 constructor에서 타입만 선언하면 자동 주입된다
```

실제 코드로 추적하면:

**Step 1**: Repository 클래스에 `@Injectable()` 선언

```ts
// src/modules/entities/document/document-expiration-task/document-expiration-task.repository.ts
@Injectable()
export class DocumentExpirationTaskRepository {
  constructor(
    @InjectRepository(DocumentExpirationTaskEntity, RW_CONNECTION_ISHOPCARE)
    private readonly writeRepository: EntityRepository<DocumentExpirationTaskEntity>,
    @InjectEntityManager(RW_CONNECTION_ISHOPCARE)
    private readonly writeEntityManager: EntityManager
  ) {}
  // ...메서드들
}
```

**Step 2**: Repository Module에서 providers + exports 등록

```ts
// document-expiration-task-repository.module.ts
@Global()
@Module({
  imports: [MikroOrmModule.forFeature([DocumentExpirationTaskEntity], RW_CONNECTION_ISHOPCARE)],
  providers: [DocumentExpirationTaskRepository],   // ← DI 컨테이너에 등록
  exports: [DocumentExpirationTaskRepository],     // ← 외부 모듈에서 사용 가능하도록 공개
})
export class DocumentExpirationTaskRepositoryModule {}
```

**Step 3**: Domain Module에서 import하고, Service에서 주입받아 사용

```ts
// src/domain/document-expiration/document-expiration.module.ts
@Module({
  imports: [
    DocumentExpirationTaskRepositoryModule,   // ← 이 모듈의 export를 가져옴
    DocumentAttachmentRepositoryModule,
    DomainFileStorageModule,
  ],
  providers: [DocumentExpirationService],
  exports: [DocumentExpirationService],
})
export class DocumentExpirationModule {}
```

```ts
// document-expiration.service.ts - constructor에 타입만 선언하면 자동 주입
constructor(
  private readonly documentExpirationTaskRepository: DocumentExpirationTaskRepository,  // ← 자동 주입!
  private readonly documentAttachmentRepository: DocumentAttachmentRepository,
  private readonly domainFileStorageService: DomainFileStorageService
) {}
```

### DI를 FE 관점에서 이해하기

```
NestJS                          React/FE
─────────────────────────────────────────
@Module({ providers })    ←→    <Context.Provider value={...}>
@Injectable()             ←→    Context에 넣을 수 있는 값
constructor(dep: Type)    ←→    useContext(SomeContext)
exports                   ←→    모듈에서 export하는 것
imports                   ←→    import해서 사용하는 것
```

차이점: React는 수동으로 Provider를 감싸고 useContext로 꺼내야 하지만, NestJS는 **타입만 맞으면 프레임워크가 알아서 연결**해준다.

### @Inject() 토큰 주입

일반적으로는 클래스 타입으로 자동 매칭되지만, 인터페이스나 팩토리 같은 경우 토큰을 명시해야 한다:

```ts
// AddressService에서
@Inject(HTTP_TEMPLATE_FACTORY) private readonly httpTemplateFactory: HttpTemplateFactory
```

`HTTP_TEMPLATE_FACTORY`는 문자열/심볼 토큰이고, 해당 모듈에서 이 토큰에 실제 구현체를 연결해둔 것이다.

---

## 5. 이 프로젝트의 레이어 구조

```
API Layer (Controller + 간단한 Service)
    ↓ import
Domain Layer (핵심 비즈니스 로직 Service)
    ↓ import
Entity Layer (Repository + Entity)
```

실제 의존성 체인 예시:

```
AddressController
  └─ AddressService
       └─ TossImClient (외부 API 호출)

DocumentExpirationService (Domain Layer)
  ├─ DocumentExpirationTaskRepository (Entity Layer)
  ├─ DocumentAttachmentRepository (Entity Layer)
  └─ DomainFileStorageService (Domain Layer)
```

### Entity 4종 세트 패턴

이 프로젝트에서 DB 엔티티를 추가할 때는 항상 4개 파일이 한 세트다:

```
document-expiration-task/
  ├─ document-expiration-task.ts              ← Interface (타입 정의)
  ├─ document-expiration-task.entity.ts       ← Entity (DB 테이블 매핑)
  ├─ document-expiration-task.repository.ts   ← Repository (DB 조회/저장 로직)
  └─ document-expiration-task-repository.module.ts  ← Module (DI 등록)
```

---

## 정리

| 개념 | 한 줄 요약 | 이 프로젝트 예시 파일 |
|------|-----------|---------------------|
| Module | 관련 코드를 묶는 컨테이너 | `address.module.ts` |
| Controller | HTTP 엔드포인트 정의 | `address.controller.ts` |
| Service | 비즈니스 로직 | `address.service.ts`, `document-expiration.service.ts` |
| DI | 의존성 자동 주입 | constructor에서 타입 선언 → 프레임워크가 연결 |
| Entity | DB 테이블 매핑 | `document-expiration-task.entity.ts` |
| Repository | DB 접근 로직 | `document-expiration-task.repository.ts` |
