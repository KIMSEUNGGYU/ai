# Block 2: 도구 차단 — PreToolUse

## Phase A — 실습

### 핵심 개념

`PreToolUse` 훅에서 `{blocked: true, reason: "..."}` 를 반환하면 도구 실행이 차단된다.

```typescript
async function blockDangerousTools(input: any) {
  if (input.tool_name === "Bash") {
    return { blocked: true, reason: "Bash 실행은 금지됩니다" };
  }
  return {};  // 허용
}
```

M04에서 `disallowedTools`로 차단했다면, M05에서는 **조건부 차단**이 가능하다:

```typescript
async function conditionalBlock(input: any) {
  // Bash 도구 중 rm 명령이 포함된 경우만 차단
  if (input.tool_name === "Bash") {
    const command = input.tool_input?.command ?? "";
    if (command.includes("rm ") || command.includes("delete")) {
      return { blocked: true, reason: "삭제 명령은 금지됩니다" };
    }
  }
  return {};
}
```

### 실습

`src/m05-hooks/hooks.ts`에 PreToolUse 훅을 추가해보자:

```typescript
hooks: {
  PreToolUse: [
    {
      matcher: ".*",
      hooks: [async (input: any) => {
        console.log(`  🔍 [PreToolUse] ${input.tool_name} 허용 확인 중...`);
        // 특정 경로의 파일 읽기를 차단하는 예제
        if (input.tool_name === "Read") {
          const filePath = input.tool_input?.file_path ?? "";
          if (filePath.includes(".env")) {
            console.log(`  ❌ [차단] .env 파일 읽기 금지!`);
            return { blocked: true, reason: ".env 파일은 보안상 읽을 수 없습니다" };
          }
        }
        console.log(`  ✅ [허용]`);
        return {};
      }]
    }
  ],
  PostToolUse: [
    { matcher: ".*", hooks: [auditLogger] }
  ],
}
```

프롬프트도 변경:
```typescript
prompt: "이 프로젝트의 .env 파일과 package.json을 읽어줘."
```

### 실행

```bash
unset CLAUDECODE && npx tsx src/m05-hooks/hooks.ts
```

### 관찰 포인트

1. .env 파일 읽기가 차단되는가?
2. 차단된 후 에이전트가 어떻게 대응하는가?
3. package.json 읽기는 정상 진행되는가?
4. PreToolUse와 PostToolUse가 동시에 동작하는가?

> ⛔ **STOP** — .env 차단 결과와 에이전트의 반응을 알려주세요.

---

## Phase B — 피드백 + 종합

### 핵심 인사이트

> `disallowedTools`는 **도구 전체**를 차단하고, `PreToolUse` 훅은 **조건부**로 차단한다.
> - "Bash 자체를 금지" → `disallowedTools: ["Bash"]`
> - "rm 명령이 포함된 Bash만 금지" → PreToolUse 훅
>
> 훅은 `disallowedTools`보다 유연하지만, 구현 책임이 개발자에게 있다.

### M05 종합 퀴즈

**Q1**: PreToolUse에서 도구 입력(input)을 **수정**해서 반환할 수 있는가?

**Q2**: Stop 훅은 어떤 용도로 사용할 수 있는가?

**Q3**: 플러그인의 `hooks/preToolUse.json`과 SDK의 `PreToolUse` 훅의 가장 큰 차이는?

### 정답 가이드

- Q1: 현재 SDK에서는 차단/허용만 가능. 입력 수정은 지원되지 않음
- Q2: 에이전트 종료 시 결과 검증 (예: 코드 리뷰 결과에 필수 항목이 있는지), 정리 작업 (임시 파일 삭제), 보고 (Slack 알림 등)
- Q3: 플러그인 훅은 셸 명령어 기반(stdout 파싱), SDK 훅은 TypeScript 함수(타입 안전, async, DB/API 접근 가능)

### 학습 노트

```
notes/m05-hooks.md에 정리:
- 3가지 훅 시점 (PreToolUse, PostToolUse, Stop)
- matcher 정규식으로 도구 필터링
- 감사 로그 패턴 (PostToolUse)
- 조건부 차단 패턴 (PreToolUse)
- disallowedTools vs PreToolUse 훅의 차이
```

> M05 완료! 다음 **M06: Sessions**에서 에이전트의 기억과 맥락 유지를 다룹니다. `/m06-sessions`를 호출하세요.
