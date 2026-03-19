# ishopcare-retool-server 학습 커리큘럼

> 목표: 코드를 읽고 간단한 기능 구현이 가능한 수준
> 대상: Express 1년 경험 FE 개발자
> 예상 기간: 2-3주 (하루 1-2시간 기준)

---

## Phase 1: NestJS 기초 (Express와 비교하며 이해) — 3-4일

### 학습 목표
Express의 `app.get()`, `middleware`, `router`가 NestJS에서 어떻게 대응되는지 이해한다.

### 1.1 Express vs NestJS 핵심 매핑

| Express | NestJS | 이 레포 예시 |
|---------|--------|-------------|
| `app.get('/path', handler)` | `@Get('path')` 데코레이터 | `funnel.controller.ts` |
| `router` | `@Controller()` + `@Module()` | `funnel.controller.ts`, `funnel.module.ts` |
| `middleware` | `@UseGuards()`, `Interceptor` | `JwtAuthGuard` |
| `req.body` | `@Body() dto` | `CreateTaskLogRequestDto` |
| `req.params.id` | `@Param('id') id` | `@Param('orderNo') orderNo: string` |
| `req.query` | `@Query('key') value` | `@Query('type') type: FunnelDetailType` |
| `app.use(cors())` | NestFactory 옵션 | `src/main.ts:52-71` |

### 1.2 읽어볼 파일 (순서대로)

1. **`src/main.ts`** — 앱 부트스트랩. Express의 `app.listen()`에 해당
2. **`src/api-admin/v2/funnel/funnel.controller.ts`** — 가장 깔끔한 컨트롤러 예시
3. **`src/api-admin/v2/funnel/funnel.module.ts`** — NestJS의 핵심: Module
4. **`src/api-admin/v2/funnel/funnel.service.ts`** — 비즈니스 로직 분리

### 1.3 핵심 개념 체크리스트

- [ ] `@Controller()`, `@Get()`, `@Post()`, `@Patch()` 역할
- [ ] `@Injectable()`과 DI(의존성 주입) — Express에서 `require`로 직접 가져오던 것의 대안
- [ ] `@Module({ imports, controllers, providers, exports })` 구조
- [ ] DTO란 무엇인가 (Request/Response 타입 정의)
- [ ] Guard란 무엇인가 (Express의 미들웨어로 인증 처리하던 것)

### 1.4 실습
`funnel.controller.ts`를 보고 각 엔드포인트가 어떤 HTTP 메서드/경로로 매핑되는지 정리해보기.

---

## Phase 2: 프로젝트 아키텍처 이해 — 3-4일

### 학습 목표
코드가 어디에 있는지 찾을 수 있고, 계층 간 의존 방향을 이해한다.

### 2.1 레이어 구조

```
src/
├── api-admin/          ← HTTP 요청 받는 곳 (Controller + Service + DTO)
├── api-public/         ← 외부 공개 API (같은 구조)
├── domain/             ← 비즈니스 로직 (여러 엔티티 조합)
├── modules/entities/   ← DB 테이블 1:1 매핑
├── core/               ← 공통 인프라 (인증, 암호화, DB, 로깅)
└── batch/              ← 배치/크론 작업
```

**의존 방향**: `api → domain → entities` (역방향 금지)

### 2.2 요청 흐름 추적 (이 레포에서 가장 중요)

HTTP 요청 하나가 어떻게 처리되는지 추적:

```
[클라이언트] GET /v2/funnel/count
    ↓
[RouterModule] api-admin.v2.module.ts에서 path: 'v2/funnel' → FunnelModule로 라우팅
    ↓
[Guard] JwtAuthGuard — 인증 확인
    ↓
[Controller] FunnelController.getAllCount()
    ↓
[Service] FunnelService.getAllCount() — 비즈니스 로직
    ↓
[Repository] orderV2Repository.countBy(), documentV2Repository.countBy() 등
    ↓
[Entity] MikroORM이 SQL 생성 → MySQL 쿼리
    ↓
[응답] GetFunnelAllCountResponseDto 형태로 반환
```

### 2.3 읽어볼 파일

1. **`src/api-admin/v2/api-admin.v2.module.ts`** — RouterModule로 URL 경로 매핑 방식 확인
2. **`src/modules/entities/order/order-v2/`** 전체 — 엔티티 4종 세트 패턴
3. **`src/domain/order/domain-order.service.ts`** — domain 레이어 역할
4. **`src/core/encryption/`** — 데코레이터 기반 자동 암호화

### 2.4 핵심 개념 체크리스트

- [ ] RouterModule이 URL 경로를 어떻게 조합하는지
- [ ] `@Global()` 모듈의 의미
- [ ] api-admin vs api-public 분리 기준
- [ ] v1과 v2 엔티티가 왜 병행되는지

---

## Phase 3: MikroORM 엔티티 패턴 — 4-5일

### 학습 목표
엔티티 코드를 읽고, 간단한 CRUD를 구현할 수 있다.

### 3.1 엔티티 4종 세트

이 레포의 모든 DB 테이블은 4개 파일로 구성된다:

| 파일 | 역할 | Express 비교 |
|------|------|-------------|
| `document-v2.ts` | 타입 정의 (Interface) | TypeScript interface |
| `document-v2.entity.ts` | DB 컬럼 매핑 | Sequelize/TypeORM 모델 |
| `document-v2.repository.ts` | CRUD 메서드 | DAO/데이터 접근 함수 |
| `document-v2.subscriber.ts` | 생명주기 훅 | Sequelize hooks |

### 3.2 읽어볼 파일 (복잡도 순)

1. **`src/modules/entities/user/`** — 가장 단순한 엔티티
2. **`src/modules/entities/order/order-v2/`** — 관계 포함
3. **`src/modules/entities/document/document-v2/`** — 암호화 필드 포함

### 3.3 핵심 데코레이터

```typescript
// DB 테이블 매핑
@Entity({ tableName: 'document_v2' })

// 컬럼
@Property({ name: 'business_name', type: 'varchar' })
businessName: string;  // JS는 camelCase, DB는 snake_case

// 관계
@ManyToOne(() => OrderV2Entity)
order?: OrderV2Entity;

// 자동 암호화 (이 레포 특수 패턴)
@EncryptedField()
@HashField('businessContactHash')
businessContact: string;
```

### 3.4 Repository 패턴

```typescript
// Express에서 이렇게 했다면:
const result = await db.query('SELECT * FROM orders WHERE order_no = ?', [orderNo]);

// MikroORM에서는:
const order = await this.writeRepository.findOne({ orderNo });

// 관계 자동 로드 (JOIN 대신)
const order = await this.writeRepository.findOne(
  { orderNo },
  { populate: ['merchant', 'documents'] }  // LEFT JOIN과 같은 효과
);
```

### 3.5 핵심 개념 체크리스트

- [ ] `@Entity`, `@Property`, `@PrimaryKey` 역할
- [ ] `name` 옵션으로 JS camelCase ↔ DB snake_case 매핑
- [ ] `populate`로 관계 데이터 로드 (N+1 방지)
- [ ] `flush()`가 필요한 이유 (Unit of Work 패턴)
- [ ] `@EncryptedField`, `@HashField` 동작 원리

### 3.6 실습
`src/modules/entities/` 아래 아무 엔티티 하나를 골라서 4종 세트의 각 파일이 어떤 역할인지 주석으로 정리해보기.

---

## Phase 4: 이 레포의 코딩 컨벤션 — 2-3일

### 학습 목표
기존 코드와 일관된 스타일로 코드를 작성할 수 있다.

### 4.1 필수 라이브러리 패턴

#### `@tossteam/is` (boolean 체크)

```typescript
// 금지: Express에서 하던 방식
if (!value) { ... }
if (!!value) { ... }

// 필수: 이 레포 방식
import { is } from '@tossteam/is';
if (is.falsy(value)) { ... }
if (is.truthy(value)) { ... }
if (is.nonEmptyArray(items)) { ... }
```

#### `ts-pattern` (분기 처리)

```typescript
// 금지: if-else 체인
if (type === 'order') { ... }
else if (type === 'document') { ... }
else { ... }

// 필수: match 패턴
import { match } from 'ts-pattern';
return match(type)
  .with('order', () => this.getOrderDetail({ orderNo }))
  .with('document', () => this.getDocumentDetail({ orderNo }))
  .exhaustive();  // 모든 케이스 처리 강제
```

### 4.2 함수 설계 규칙

```typescript
// 파라미터 3개 초과 시 옵션 객체
async createTaskLog({
  userId,
  orderNo,
  type,
  dto,
}: {
  userId: number;
  orderNo: string;
  type: FunnelDetailType;
  dto: CreateTaskLogRequestDto;
}) { ... }

// 함수 30줄 이하
// 조기 반환 패턴 사용
// any 사용 금지 → unknown 또는 제네릭
```

### 4.3 읽어볼 파일

1. **`CODING.md`** — 전체 코딩 컨벤션 (필수 정독)
2. **`src/modules/utils/deepDiff.ts`** + `__test__/deepDiff.test.ts` — 순수 함수 + 테스트 예시
3. **`src/core/mikro/utils/insertBulk.ts`** — 청크 처리 패턴

### 4.4 핵심 개념 체크리스트

- [ ] `is.falsy()`, `is.truthy()`, `is.nonEmptyArray()` 사용법
- [ ] `match().with().exhaustive()` 패턴
- [ ] 옵션 객체 패턴
- [ ] 조기 반환 패턴
- [ ] 상수는 UPPER_SNAKE_CASE

---

## Phase 5: 간단한 기능 구현 연습 — 3-4일

### 학습 목표
기존 패턴을 따라 새로운 API 엔드포인트를 추가할 수 있다.

### 5.1 연습 과제 1: 읽기 전용 API 추가

기존 `funnel` 모듈에 새 GET 엔드포인트를 추가한다고 가정.

필요한 작업:
1. `dtos/`에 Response DTO 추가
2. `funnel.service.ts`에 메서드 추가
3. `funnel.controller.ts`에 엔드포인트 추가
4. `funnel.docs.ts`에 Swagger 문서 추가

### 5.2 연습 과제 2: 새 서브모듈 추가

`src/api-admin/v2/funnel/` 아래에 새 서브모듈을 추가한다고 가정.

필요한 작업:
1. 디렉토리 생성 (`src/api-admin/v2/funnel/new-feature/`)
2. Controller, Service, Module 파일 생성
3. DTO 파일 생성
4. `funnel.module.ts`의 imports에 등록
5. `api-admin.v2.module.ts`의 RouterModule에 경로 등록

### 5.3 새 기능 추가 체크리스트 (STRUCTURE.md 발췌)

새 API 추가 시 빠뜨리기 쉬운 것들:
- [ ] RouterModule에 경로 등록했는가
- [ ] 부모 모듈 imports에 서브모듈 추가했는가
- [ ] DTO에 `@ApiProperty()` 데코레이터 붙였는가
- [ ] `@UseGuards(JwtAuthGuard)` 빠뜨리지 않았는가
- [ ] Response DTO 타입이 실제 반환값과 일치하는가

---

## 추천 학습 순서 요약

```
1일차: main.ts → funnel.controller.ts (NestJS 감잡기)
2일차: funnel.module.ts → funnel.service.ts (Module + DI 이해)
3일차: api-admin.v2.module.ts → RouterModule 패턴
4일차: entities/user/ → 가장 단순한 엔티티 4종 세트
5일차: entities/order/order-v2/ → 관계 있는 엔티티
6일차: entities/document/document-v2/ → 암호화 필드
7일차: CODING.md 정독 + deepDiff.ts 분석
8일차: @tossteam/is + ts-pattern 패턴 익히기
9일차: funnel.service.ts 전체 정독 (실제 비즈니스 로직)
10일차: 연습 과제 시작
```

## 참고 문서 (레포 내)

| 문서 | 내용 | 우선순위 |
|------|------|---------|
| `CLAUDE.md` | 프로젝트 개요, 명령어, 아키텍처 | 1순위 (첫날 읽기) |
| `CODING.md` | 코딩 컨벤션 상세 | 2순위 (Phase 4 전 필독) |
| `STRUCTURE.md` | 폴더 구조, 엔티티 패턴, 새 기능 체크리스트 | 2순위 (Phase 2-3과 함께) |
| `example.env` | 환경 변수 목록 | 로컬 실행 시 참고 |
