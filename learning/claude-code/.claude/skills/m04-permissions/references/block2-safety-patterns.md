# Block 2: 안전장치 패턴

## Phase A — 설계

### 시나리오별 권한 설계

실제 프로덕션에서 에이전트를 배포할 때의 권한 패턴을 설계해보자.

**시나리오 1: CI/CD 코드 리뷰 봇**
```typescript
options: {
  tools: ["Read", "Glob", "Grep"],       // 읽기만
  disallowedTools: ["Edit", "Write", "Bash"], // 수정/실행 완전 차단
  permissionMode: "plan",                 // 추가 안전장치
}
```

**시나리오 2: 코드 수정 에이전트 (감독 하에)**
```typescript
options: {
  tools: ["Read", "Glob", "Grep", "Edit", "Write"],
  disallowedTools: ["Bash"],              // 셸 실행만 차단
  permissionMode: "default",             // 쓰기 시 확인 요청
  allowedTools: ["Read", "Glob", "Grep"], // 읽기는 자동 승인
}
```

**시나리오 3: 자동화 파이프라인 (무인 실행)**
```typescript
options: {
  tools: ["Read", "Glob", "Grep", "Bash"],
  allowedTools: ["Read", "Glob", "Grep", "Bash"],
  permissionMode: "bypassPermissions",
  allowDangerouslySkipPermissions: true,
  // ⚠️ 위험! 반드시 hooks로 감사 로그 추가 (M05에서 학습)
}
```

### 설계 과제

다음 시나리오의 권한을 설계해보자:

**"학생 과제 자동 채점 에이전트"**
- 학생 코드를 읽어야 함
- 테스트를 실행해야 함 (Bash)
- 학생 코드를 수정하면 안 됨
- 채점 결과를 파일로 저장해야 함

어떤 `tools`, `allowedTools`, `disallowedTools`, `permissionMode` 조합을 사용할지 설계해보자.

> ⛔ **STOP** — 학생 과제 채점 에이전트의 권한 설계를 공유해주세요.

---

## Phase B — 피드백 + 종합

### 채점 에이전트 권한 설계 예시

```typescript
options: {
  tools: ["Read", "Glob", "Grep", "Bash", "Write"],
  allowedTools: ["Read", "Glob", "Grep"],  // 읽기 자동 승인
  disallowedTools: ["Edit"],               // 기존 파일 수정 차단
  // Write는 채점 결과 저장용으로 허용 (승인 필요)
  // Bash는 테스트 실행용으로 허용 (승인 필요)
  permissionMode: "default",
}
```

핵심: **최소 권한 원칙** — 필요한 능력만 부여하고, 위험한 능력은 감독 하에.

### M04 종합 퀴즈

**Q1**: `permissionMode: "default"`에서 `allowedTools`를 설정하지 않으면 모든 도구가 사용자 확인 필요한가?

**Q2**: 에이전트가 `disallowedTools`에 있는 도구를 우회할 수 있는 방법이 있는가?

### 정답 가이드

- Q1: 아니다. `default` 모드에서는 Read, Glob 같은 읽기 도구는 기본 자동 승인. Edit, Bash 같은 쓰기/실행 도구만 확인 요청
- Q2: SDK 레벨에서 차단하므로 에이전트가 우회할 수 없다. 단, 에이전트가 다른 도구를 활용해 간접적으로 비슷한 결과를 내는 것은 가능 (예: Bash 차단 시 MCP 도구로 우회)

### 학습 노트

```
notes/m04-permissions.md에 정리:
- 3가지 permissionMode (default, plan, bypassPermissions)
- tools vs allowedTools vs disallowedTools 우선순위
- 최소 권한 원칙
- 시나리오별 권한 설계 패턴
```

> M04 완료! 다음 **M05: Hooks**에서 에이전트 라이프사이클에 개입합니다. `/m05-hooks`를 호출하세요.
