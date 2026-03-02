# Block 1: 에러 핸들링

## Phase A — 패턴 학습

### 프로덕션 에러 핸들링 패턴

**패턴 1: 재시도 with 백오프**

```typescript
async function queryWithRetry(
  prompt: string,
  options: any,
  maxRetries = 3,
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let result = "";
      for await (const msg of query({ prompt, options })) {
        if ((msg as any).type === "result") {
          if ((msg as any).subtype === "error") {
            throw new Error((msg as any).result);
          }
          result = (msg as any).result;
        }
      }
      return result;
    } catch (error) {
      console.log(`시도 ${attempt}/${maxRetries} 실패: ${error}`);
      if (attempt === maxRetries) throw error;
      // 지수 백오프
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Unreachable");
}
```

**패턴 2: 타임아웃**

```typescript
async function queryWithTimeout(prompt: string, options: any, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for await (const msg of query({
      prompt,
      options: { ...options, signal: controller.signal },
    })) {
      // 처리
    }
  } finally {
    clearTimeout(timeout);
  }
}
```

**패턴 3: 폴백 모델**

```typescript
async function queryWithFallback(prompt: string, options: any) {
  try {
    // 먼저 Haiku로 시도 (저렴)
    return await queryWithTimeout(prompt, { ...options, model: "haiku" }, 30000);
  } catch {
    // 실패하면 Sonnet으로 폴백
    return await queryWithTimeout(prompt, { ...options, model: "sonnet" }, 60000);
  }
}
```

### 실습

`src/m11-hosting/hosting.ts`에 재시도 패턴을 구현해보자.

```bash
unset CLAUDECODE && npx tsx src/m11-hosting/hosting.ts
```

### 관찰 포인트

1. `result` 메시지의 `subtype`이 `"error"`인 경우를 어떻게 감지하는가?
2. 재시도 시 세션을 유지하는 것이 좋은가, 새로 시작하는 것이 좋은가?

> ⛔ **STOP** — 위 관찰 포인트에 대한 답변과, 실행 결과를 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 핵심 인사이트

> 프로덕션에서는 **모든 에이전트 호출이 실패할 수 있다**고 가정해야 한다.
> - 네트워크 오류, API 타임아웃, 모델 과부하
> - 에이전트가 무한 루프에 빠지거나 예상치 못한 도구 사용
>
> 재시도 + 타임아웃 + 폴백의 조합이 프로덕션 안정성의 핵심.

### 퀴즈

**Q1**: 재시도 시 세션을 유지하면 장단점은?

### 정답 가이드

- Q1: 유지 — 이전 맥락이 있어서 더 효율적이지만, 오류 상태도 함께 유지될 수 있음. 새 세션 — 깨끗한 시작이지만 이전 작업 반복 필요. 에러 유형에 따라 판단

> Block 2에서 실제 배포 패턴을 다룹니다. "Block 2 시작"이라고 말해주세요.
