# 에러 핸들링 컨벤션

> Exception과 Error State 구분, AppError 체계, ErrorBoundary 패턴

---

## 1. Exception vs Error State

| 구분 | Exception | Error State |
|------|-----------|-------------|
| 성격 | 예상 불가능한 런타임 에러 | 예상 가능한 비즈니스 에러 |
| 처리 | `try-catch`, ErrorBoundary | 타입으로 표현 |
| 예시 | 네트워크 장애, 서버 다운 | 입력값 검증 실패, 권한 없음 |

```typescript
// ❌ 예상 가능한 상황에 Exception 사용
function login() {
  if (!isValid) throw new Error('invalid');
}

// ✅ Error State로 표현
type LoginResult =
  | { status: 'success'; token: string }
  | { status: 'error'; reason: 'invalid' | 'expired' };
```

---

## 2. 에러 클래스 정의

### AppError (범용)

```typescript
// lib/error/AppError.ts
export type AppErrorKind =
  | 'Auth'
  | 'NotFound'
  | 'Network'
  | 'Server'
  | 'Unknown';

export class AppError extends Error {
  kind: AppErrorKind;

  constructor(kind: AppErrorKind, message: string) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error != null &&
    typeof error === 'object' &&
    (error as any)?.name === 'AppError';
}
```

### RedirectError (특수 동작)

```typescript
// lib/error/RedirectError.ts
export class RedirectError extends Error {
  readonly name = 'RedirectError';
  constructor(public readonly url: string) {
    super(`Redirecting to ${url}`);
  }
}

export function isRedirectError(error: unknown): error is RedirectError {
  return error != null &&
    typeof error === 'object' &&
    (error as any)?.name === 'RedirectError';
}
```

### 확장: 전용 에러 분리

특정 에러에 추가 정보나 특수 UI/동작이 필요할 때:

```typescript
// lib/error/NotFoundError.ts
export class NotFoundError extends Error {
  readonly name = 'NotFoundError';
  constructor(
    public readonly resource: string,
    public readonly redirectTo?: string
  ) {
    super(`${resource} not found`);
  }
}
```

**분리 기준:**
- 특정 에러에 **추가 정보**(resource, redirectTo 등)가 필요할 때
- 특정 에러에 **특수한 UI/동작**이 필요할 때
- AppError의 단순 kind 분기로 부족할 때

---

## 3. 타입 가드: instanceof 금지

### 문제

```typescript
// ❌ instanceof 사용 시 문제 발생
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
```

**실패 케이스:**
- 패키지 버전 중복 — 모노레포/node_modules에서 같은 클래스가 다른 인스턴스로 존재
- 프레임워크 경계 — Server/Client Component 간 직렬화 시 프로토타입 체인 소실
- 실행 컨텍스트 차이 — iframe, Web Worker 등 별도 realm에서 클래스 참조가 다름

### 구조적 타입 체크 (Duck Typing)

```typescript
// ✅ 객체의 구조로 판별
export function isAppError(error: unknown): error is AppError {
  return error != null &&
    typeof error === 'object' &&
    (error as any)?.name === 'AppError';
}
```

**장점:** 실행 컨텍스트 독립적, 직렬화 안전, 번들 분할 안전

**더 엄격한 체크가 필요한 경우:**

```typescript
export function isAppError(error: unknown): error is AppError {
  return (
    error != null &&
    typeof error === 'object' &&
    (error as any)?.name === 'AppError' &&
    'kind' in error &&
    'message' in error
  );
}
```

---

## 4. React ErrorBoundary 패턴

### 래핑 순서 (_app.tsx)

```
GlobalErrorBoundary → QueryClientProvider → RedirectErrorBoundary → {page}
```

### GlobalErrorBoundary

모든 에러를 포착하고 Sentry에 로깅 + 에러 UI 표시.

```typescript
// components/GlobalErrorBoundary.tsx
export function GlobalErrorBoundary({ children }: Props) {
  const handleError = useCallback((error: Error, info: ErrorInfo) => {
    Sentry.withScope(scope => {
      for (const key of Object.keys(info)) {
        scope.setExtra(key, (info as any)[key]);
      }
      Sentry.captureException(error);
    });
  }, []);

  return (
    <ErrorBoundary onError={handleError} renderFallback={() => <FullScreenError />}>
      {children}
    </ErrorBoundary>
  );
}
```

### RedirectErrorBoundary

```typescript
// lib/error/RedirectErrorBoundary.tsx
function RedirectFallback({ error }: ErrorBoundaryFallbackProps) {
  const router = useRouter();

  useEffect(function redirectOnError() {
    if (isRedirectError(error)) {
      router.replace(error.url);
    }
  }, [error, router]);

  return null;
}

export function RedirectErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary shouldCatch={isRedirectError} fallback={RedirectFallback}>
      {children}
    </ErrorBoundary>
  );
}
```

### AsyncBoundary (Suspense + ErrorBoundary + QueryErrorResetBoundary)

```typescript
// lib/AsyncBoundary.tsx
interface AsyncBoundaryProps {
  pendingFallback: React.ReactNode;
  rejectedFallback: ComponentProps<typeof ErrorBoundary>['fallback'];
}

export const AsyncBoundary: FC<PropsWithChildren<AsyncBoundaryProps>> = ({
  pendingFallback,
  rejectedFallback,
  children,
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={rejectedFallback} onReset={reset}>
          <Suspense fallback={pendingFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
```

**사용:**

```typescript
<AsyncBoundary
  pendingFallback={<Loading />}
  rejectedFallback={({ error, reset }) => <ErrorFallback error={error} onReset={reset} />}
>
  <Content />
</AsyncBoundary>
```

---

## 5. React Query 에러 처리

### 재시도 정책

```typescript
// lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if (isAppError(error) && (error.kind === 'Auth' || error.kind === 'NotFound')) {
          return false;
        }
        return failureCount < 2;
      },
      throwOnError: true, // ErrorBoundary로 전파
    },
    mutations: {
      retry: false,
    },
  },
});
```

| 에러 종류 | 재시도 | 이유 |
|---------|--------|------|
| Auth | ❌ | 토큰 갱신 실패 시 재시도 무의미 |
| NotFound | ❌ | 리소스 부재는 재시도해도 동일 |
| Server | ✅ (2회) | 일시적 서버 오류 가능성 |
| Network | ✅ (2회) | 네트워크 불안정 가능성 |

---

## ✅ DO & ❌ DON'T

### ✅ DO
- Exception과 Error State 구분
- 에러 타입별 전용 클래스 (AppError, RedirectError)
- 구조적 타입 체크 (name 속성 판별)
- ErrorBoundary로 에러별 처리 분리
- AsyncBoundary로 로딩/에러 통합

### ❌ DON'T
- 예상 가능한 상황에 throw 사용
- instanceof로 에러 판별
- 컴포넌트 내부에서 명령형 에러 분기 (`if (error)`)
- Auth/NotFound 에러 재시도

---

---

## 6. 에러 메시지 중앙 관리

AppErrorKind별 사용자 노출 메시지를 한 곳에서 관리한다:

```typescript
// lib/error/errorMessages.ts
export const errorCopy: Record<AppErrorKind, { title: string; desc?: string }> = {
  Auth:     { title: '로그인이 필요합니다', desc: '세션이 만료되었어요.' },
  NotFound: { title: '찾을 수 없어요', desc: '요청한 리소스가 없어요.' },
  Network:  { title: '네트워크 오류', desc: '인터넷 연결을 확인해주세요.' },
  Server:   { title: '서버에 문제가 있어요', desc: '잠시 후 다시 시도해주세요.' },
  Unknown:  { title: '문제가 발생했어요', desc: '잠시 후 다시 시도해주세요.' },
};
```

---

## 7. Sentry afterResponse 인터셉터

401은 제외하고 나머지 HTTP 에러를 Sentry에 자동 리포트한다:

```typescript
async function afterResponseErrorReporter(
  request: Request,
  options: NormalizedOptions,
  response: Response,
) {
  if (is.falsy(response.ok) && response.status !== 401) {
    const error = new HTTPError(response, request, options);
    sentryService.captureApiError(error);
  }
  return response;
}
```

---

## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2026-02-08 | 초판 (error-handling 소스 기반) |
| 2026-04-04 | §6 에러 메시지 중앙 관리, §7 Sentry 인터셉터 추가 |
