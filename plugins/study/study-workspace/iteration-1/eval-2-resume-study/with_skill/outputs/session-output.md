# /study 이어하기 세션 — 01. NestJS 핵심 개념

## 현재 진행 상태

INDEX.md 확인 결과, 14개 주제 전부 ⬜(미시작). Phase 1의 첫 번째 주제 **"NestJS 핵심 개념 (Module, Controller, Service, DI)"** 부터 시작한다.

---

## 세션 시작

Express 경험이 있으니까 비교하면서 가보자. 첫 번째 핵심 질문부터.

### Q1. Express에서는 `app.use(router)`로 라우트를 등록하는데, NestJS는 왜 Module로 감싸야 하나?

이 레포의 실제 코드를 보면서 얘기하자.

**`src/api-admin/document/document.module.ts`를 보면:**

```typescript
@Module({
  imports: [
    DocumentRepositoryModule,
    DocumentAttachmentRepositoryModule,
    DomainFileStorageModule,
    UserRepositoryModule,
    DomainDocumentModule,
    // ...
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
```

Express였다면 이렇게 했을 거다:

```typescript
// express 스타일
import { documentRouter } from './document.router';
import { DocumentService } from './document.service';

const documentService = new DocumentService(/* 의존성 직접 넣기... */);
app.use('/document', documentRouter);
```

Module이 하는 일은 크게 3가지다:
1. **의존성 범위 정의** — 이 모듈 안에서 뭘 쓸 수 있는지 (`imports`)
2. **라우트 등록** — 어떤 컨트롤러를 쓸지 (`controllers`)
3. **서비스 등록** — 어떤 서비스를 DI 컨테이너에 넣을지 (`providers`)

Express에서는 이 3가지를 개발자가 직접 관리했다. 파일 import하고, 인스턴스 만들고, 라우터에 등록하고. NestJS는 이걸 선언적으로 만든 거다.

> 여기서 질문 하나. `document.module.ts`의 `imports`에 `DocumentRepositoryModule`, `DomainDocumentModule` 같은 게 들어있는데, 이게 왜 필요할까? Express였으면 그냥 `require`해서 쓰면 되는 거 아닌가?

---

### Q2 준비: DI(의존성 주입)가 Express의 require/import와 어떻게 다른가

답변을 기다리기 전에, 코드로 차이를 보여줄게.

**`src/api-admin/document/document.controller.ts:31-32`:**

```typescript
@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}
```

**`src/api-admin/document/document.service.ts:59-77`:**

```typescript
@Injectable()
export class DocumentService {
  constructor(
    private readonly modusignDocumentRepository: ModusignDocumentRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly documentAttachmentRepository: DocumentAttachmentRepository,
    private readonly domainFileStorageService: DomainFileStorageService,
    private readonly orderEventLogRepository: OrderEventLogRepository,
    private readonly userRepository: UserRepository,
    // ... 총 13개의 의존성
  ) {}
```

DocumentService는 13개의 의존성이 필요하다. Express였다면:

```typescript
// express 스타일 — 직접 생성
const documentService = new DocumentService(
  new ModusignDocumentRepository(connection),
  new DocumentRepository(connection),
  new DocumentAttachmentRepository(connection),
  new DomainFileStorageService(config),
  // ... 13개 전부 수동으로
);
```

NestJS에서는 Module에 `providers`와 `imports`만 선언하면, 프레임워크가 알아서 생성자에 넣어준다.

> 여기서 질문. DocumentService의 생성자에 `DocumentRepository`가 있는데, 이건 `document.module.ts`의 `providers`가 아니라 `imports`의 `DocumentRepositoryModule`에서 온다. `providers`에 직접 넣는 것과 `imports`로 다른 모듈에서 가져오는 것의 차이가 뭘까?

---

### 전체 모듈 조립 구조

이 레포의 모듈 트리를 위에서 아래로 보면:

```
AppCombinedModule (src/app-combined.module.ts)
  ├── ApiAdminModule (src/api-admin/api-admin.module.ts)
  │     ├── DocumentModule
  │     ├── OrderModule
  │     ├── InquiryModule
  │     └── ... (약 30개 모듈)
  ├── ApiPublicModule
  └── ConsumerModule
```

**`src/app-combined.module.ts:161-171`** 에서 `ts-pattern`의 `match`로 환경별 모듈을 분기한다:

```typescript
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

local/dev에서는 admin + public + consumer 모두 하나의 인스턴스에 띄우고, prod에서는 service별로 나눈다.

> 이 구조를 보면 Module이 단순히 "파일 정리용"이 아니라, **배포 단위를 나누는 경계**로도 쓰인다는 걸 알 수 있다. Express에서 이걸 하려면 어떻게 해야 할까?

---

## 다음 단계

위 3개 질문에 대한 답변/토론 후:
- Module의 `exports`가 하는 역할 (다른 모듈에 서비스를 공개하는 메커니즘)
- `@Injectable()` 데코레이터의 의미
- 이 레포에서 Domain 모듈과 API 모듈의 관계

이 순서로 진행할 예정.
