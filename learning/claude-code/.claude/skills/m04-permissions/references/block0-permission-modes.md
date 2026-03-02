# Block 0: Permission Mode 종류

## Phase A — 개념

### 핵심 개념

지금까지 `permissionMode: "bypassPermissions"`를 써왔다. 이것은 "모든 도구를 무조건 허용"하는 모드다. 학습에는 편리하지만 프로덕션에서는 위험하다.

### 3가지 Permission Mode

| Mode | 동작 | 용도 |
|------|------|------|
| `default` | 위험한 도구 사용 시 사용자 확인 요청 | 대화형 에이전트 |
| `plan` | 읽기 도구만 자동, 쓰기/실행은 차단 | 안전한 분석 에이전트 |
| `bypassPermissions` | 모든 도구 무조건 허용 | 학습/테스트 (위험!) |

```
안전도:  plan  >  default  >  bypassPermissions
자유도:  bypassPermissions  >  default  >  plan
```

### bypassPermissions의 위험성

```typescript
// ⚠️ 이 코드는 에이전트가 rm -rf / 를 실행해도 막지 않는다
options: {
  permissionMode: "bypassPermissions",
  allowDangerouslySkipPermissions: true,  // "위험한 것을 알고 있다" 선언
  tools: ["Bash"],  // Bash 도구까지 주면...
}
```

`allowDangerouslySkipPermissions: true`를 요구하는 이유가 바로 이것. 개발자에게 "이 설정이 위험하다"는 것을 명시적으로 인지시키기 위한 안전장치.

### 사전 질문

- CI/CD에서 무인 실행하는 에이전트에 `bypassPermissions`를 쓰면 어떤 위험이 있을까?
- `plan` 모드에서 에이전트가 "파일을 수정해줘"라고 요청받으면 어떻게 동작할까?

> ⛔ **STOP** — 위 질문에 대한 생각을 공유해주세요.

---

## Phase B — 피드백 + 퀴즈

### 피드백 포인트

- CI/CD에서 `bypassPermissions` + `Bash` 도구 = 서버에서 임의 명령 실행 가능. 최소 권한 원칙 적용 필수
- `plan` 모드에서 쓰기 요청 → 에이전트가 "이 작업은 권한이 없어 수행할 수 없습니다"라고 응답하거나, 사용자 승인을 요청

### 퀴즈

**Q1**: `permissionMode: "plan"`과 `tools: ["Read", "Glob"]`은 같은 효과인가?

### 정답 가이드

- Q1: 비슷하지만 다르다. `plan`은 모든 도구가 로드되지만 쓰기/실행만 차단. `tools: ["Read", "Glob"]`은 아예 Read와 Glob만 존재. `plan`은 에이전트가 "Edit 도구가 있지만 사용할 수 없다"를 인지, `tools` 제한은 "Edit 도구 자체가 없다"

> Block 1에서 `allowedTools`와 `disallowedTools`로 세밀한 제어를 합니다. "Block 1 시작"이라고 말해주세요.
