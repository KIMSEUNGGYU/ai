# 회사 API 인프라 컨벤션 (ishopcare)

> httpClient, 에러 핸들링, 인증 등 회사 인프라 관련 규칙. 전역 API 패턴은 `../conventions/api-layer.md` 참조.


## 공통 API 에러 메시지 핸들러

HTTP 상태 코드별 커스텀 메시지를 선언적으로 매핑하는 유틸:

```typescript
// lib/api-error-handler.ts
export function getApiErrorMessage(
  error: unknown,
  customMessages?: Partial<Record<number, string>>,
  defaultMessage = '요청을 처리하는 중 오류가 발생했습니다.'
): string {
  if (isApiError(error)) {
    return customMessages?.[error.statusCode] ?? defaultMessage;
  }
  return defaultMessage;
}

// 사용: 인라인으로 상태 코드별 메시지 매핑
const message = getApiErrorMessage(error, {
  404: '존재하지 않는 단말기예요',
  409: '이미 등록된 단말기예요',
}, '시리얼 번호 조회에 실패했습니다.');
```


## 토큰 갱신 Race Condition 방지

동시 401 응답 시 `refreshTokenPromise`를 공유하여 중복 갱신 요청을 방지한다. refresh 전용 클라이언트로 순환 참조도 방지:

```typescript
// 순환 참조 방지: refresh 전용 인스턴스 (인터셉터 없음)
export const refreshApiClient = ky.create({ prefixUrl: getApiPrefixUrl() });

// Race Condition 방지: Promise 공유
let refreshTokenPromise: Promise<void> | null = null;

async function afterResponseInterceptor(request, options, response) {
  if (response.status === 401) {
    if (refreshTokenPromise === null) {
      refreshTokenPromise = (async () => {
        try {
          const token = await postRefreshToken({ refreshToken });
          saveTokens({ accessToken: token.accessToken, refreshToken });
        } catch (e) { logout(); throw e; }
        finally { refreshTokenPromise = null; }
      })();
    }
    await refreshTokenPromise;
  }
}
```


## Mutation onError: Sentry 리포트 + 401 제외

mutations의 `defaultOptions.onError`에서 Sentry 리포팅하되, 401은 정상적인 인증 플로우이므로 제외:

```typescript
mutations: {
  onError: async error => {
    if (isApiError(error) && error.statusCode === 401) return;
    const message = await getErrorMessage(error);
    Sentry.captureException(error, {
      extra: { message, network: error instanceof TimeoutError ? getConnectionInfo() : undefined },
    });
  },
}
```


## Presigned URL 업로드 패턴

presigned URL 발급 → S3 PUT → downloadUrl 저장 흐름. mutation에서 발급과 업로드를 한번에 처리:

```typescript
const uploadMutations = {
  files: () =>
    mutationOptions({
      mutationFn: async ({ files }: { files: File[] }) => {
        const presignedUrls = await fetchPresignedUrl({ fileNames: files.map(f => f.name) });
        await Promise.all(
          files.map((file, i) => uploadFileToPresignedUrl(file, presignedUrls[i].uploadUrl))
        );
        return presignedUrls.map(({ fileName, downloadUrl }) => ({ fileName, downloadUrl }));
      },
    }),
};
```


## nuqs + URL 필터 동기화

필터를 URL 쿼리 파라미터와 자동 동기화. `parseAsArrayOf(parseAsStringLiteral(LIST))`로 타입 안전한 열거형 배열 파싱:

```typescript
import { parseAsArrayOf, parseAsStringLiteral, useQueryStates } from 'nuqs';

const STATUS_LIST = ['pending', 'completed'] as const;

function useDocumentTaskFilters() {
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    taskStatus: parseAsArrayOf(parseAsStringLiteral(STATUS_LIST)).withDefault([]),
  });
  const resetFilters = () => setFilters({ search: '', taskStatus: [] });
  return { filters, setFilters, resetFilters };
}
```


---

## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2026-04-04 | api-layer.md에서 회사 전용 섹션 분리 + Presigned URL, nuqs 추가 |
