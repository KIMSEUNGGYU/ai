---
tags:
  - agent-harness
  - step2
date: 2026-03-01
---

# Step 2: Tools — 에이전트에게 능력 부여

## 핵심 개념

- **tools 옵션**: 에이전트가 사용할 수 있는 빌트인 도구를 제한
- 도구를 주면 에이전트가 **스스로 판단**해서 어떤 도구를 쓸지 결정
- 도구가 있으면 에이전트 루프가 **여러 턴으로 확장**됨

## SDK 도구 관련 옵션 3가지

| 옵션 | 역할 | 비유 |
|------|------|------|
| `tools` | 사용 가능한 도구 제한 | "이 도구만 쓸 수 있어" |
| `allowedTools` | 자동 승인 목록 | "물어보지 않고 써도 돼" |
| `disallowedTools` | 명시적 금지 | "절대 쓰지 마" |

## 실행 결과

```
📦 [1] system/init — tools 71개 (빌트인 2 + MCP 69)
🤖 [3] "찾아 읽어드리겠습니다"
🔧 [4] tool_use: Glob("**/package.json")   ← 파일 위치 찾기
⬜ [6] user (= tool_result를 Claude에 전달)
🔧 [8] tool_use: Read(절대경로)             ← 파일 읽기
⬜ [9] user (= tool_result를 Claude에 전달)
🤖 [11] 의존성 목록 정리 (최종 답변)
✅ [12] result — 3턴, $0.08
```

## 배운 것

1. **도구의 자율적 선택**: Claude가 Glob → Read 순서를 스스로 결정. 매 실행마다 전략이 다를 수 있음 (비결정성)
2. **에이전트 루프 확장**: Step 1은 1턴, Step 2는 3턴. 도구가 루프를 다중 턴으로 만듦
3. **메시지 스트림 구조**:
   - 빈 assistant 메시지가 중간에 존재 (SDK 내부 구조, 로그에 안 찍힘)
   - `user` 타입 = tool_result의 포장지. Claude API 스펙상 도구 결과는 user role로 전송
   - `rate_limit_event` = API 속도 제한 내부 이벤트 (무시 가능)
4. **mcpServers: {} 는 MCP 비활성화가 아님**:
   - SDK의 `mcpServers`는 **추가만** 가능, 기존 설정을 **빼는 기능 없음**
   - `~/.claude/.mcp.json`, 플러그인 MCP, Claude AI 기본 MCP는 CLI 레벨에서 로드
   - SDK 문서 명시: "Servers configured via settings files are not affected"
5. **MCP 도구의 비용 영향**: MCP 69개의 도구 설명이 입력 토큰을 소비 → Haiku여도 $0.08

## 에이전트 루프와 턴의 원리

**턴의 기준 = Claude 응답에 `tool_use`가 있는가**

```
Claude 응답에 tool_use 있음 → 다음 턴 실행 (항상)
Claude 응답에 tool_use 없음 → 루프 종료 (항상)
```

매 턴마다 Claude가 하는 판단:
```
"목표 달성에 필요한 정보가 충분한가?"
  ├── 부족함 → tool_use (도구로 정보 획득) → 다음 턴
  └── 충분함 → text (최종 답변) → 루프 종료
```

이것이 **"에이전트"와 "함수 호출"의 근본 차이**:
- 함수 호출: 개발자가 "Glob → Read" 순서를 코딩
- 에이전트: Claude가 매 턴마다 스스로 다음 행동을 결정

참고: `maxTurns` 옵션으로 턴 수를 제한하면 강제 종료 가능.

## 핵심 인사이트

> 도구를 부여하면 에이전트는 **자율적으로 전략을 세운다.**
> 같은 프롬프트 + 같은 도구여도 Glob→Read 또는 Read→실패→Read 등
> 매번 다른 접근이 가능하다. 이것이 "에이전트"와 "함수 호출"의 차이.

> SDK의 `tools`는 빌트인만 제어하고, MCP는 별도 레이어.
> 하네스 설계 시 "어떤 도구를 줄 것인가"와 "어떤 외부 서비스를 연결할 것인가"는
> 독립적인 결정이다.

## SDK 옵션

```typescript
query({
  prompt: string,
  options: {
    model: "haiku",
    tools: ["Read", "Glob"],              // 빌트인 도구 제한
    // allowedTools: ["Read"],            // 자동 승인 (별도)
    // disallowedTools: ["Bash"],         // 명시적 금지 (별도)
    // mcpServers: {},                    // 동적 MCP 추가만 가능, 기존 제거 불가
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
  }
})
```

## 다음: Step 3

같은 도구를 주되 `systemPrompt`로 역할을 다르게 정의하면 행동이 어떻게 달라지는지 관찰.
도구는 "능력", 프롬프트는 "성격" — 같은 능력이라도 성격에 따라 결과가 완전히 다름.
