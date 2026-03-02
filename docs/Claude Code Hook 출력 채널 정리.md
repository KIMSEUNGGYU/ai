---
tags: [claude-code, hook, TIL]
date: 2026-02-21
status: active
---

# Claude Code Hook 출력 채널 정리

## 핵심

Hook에서 사용자 터미널에 메시지를 표시하려면 `result.systemMessage`를 사용한다.

## 출력 채널별 동작 (exit code 0)

| 채널 | 방법 | 결과 |
|------|------|------|
| stdout (`console.log`) | JSON 데이터 채널 | Claude에게 전달 (파싱용) |
| stderr (`console.error`) | — | **무시됨** |
| `result.systemMessage` | JSON 필드 | **사용자 터미널에 표시** |
| `result.hookSpecificOutput.additionalContext` | JSON 필드 | Claude 컨텍스트에 주입 |

## 예시 (Node.js)

```javascript
const result = {};

if (content) {
  // Claude에게 컨텍스트 주입
  result.hookSpecificOutput = {
    hookEventName: 'SessionStart',
    additionalContext: `컨텍스트 내용: ${content}`,
  };
  // 사용자 터미널에 표시
  result.systemMessage = '[session-manager] current.md 로드됨';
} else {
  result.systemMessage = '[session-manager] current.md 없음 — 새 세션';
}

console.log(JSON.stringify(result));
```

## 주의

- `console.log`에 JSON 외 텍스트를 섞으면 파싱 깨짐
- `console.error`는 exit 0이면 무시, exit 2(차단)일 때만 Claude에 피드백 전달
- `systemMessage`는 모든 이벤트에서 사용 가능
