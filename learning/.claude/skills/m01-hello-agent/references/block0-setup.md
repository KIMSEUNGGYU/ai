# Block 0: 환경 설정

## Phase A — 개념 + 실행 안내

### 핵심 개념

**Claude Agent SDK**는 Claude Code의 핵심 기능을 프로그래밍 가능한 TypeScript API로 제공한다.

```
Claude Code (CLI)         Claude Agent SDK (API)
┌──────────────┐         ┌──────────────────────┐
│ 터미널에서    │         │ TypeScript 코드에서   │
│ 대화형 사용   │   →     │ 프로그래밍적 제어     │
│ 수동 조작     │         │ 자동화, CI/CD 통합    │
└──────────────┘         └──────────────────────┘
```

핵심 차이: SDK는 Claude Code CLI를 **서브프로세스**로 실행한다. API 키가 아니라 CLI 인증을 사용한다.

### 프로젝트 구조 확인

학습자에게 다음을 확인하도록 안내:

```bash
cd ~/hq/20_Learn/claude-code
ls -la
cat package.json
```

확인 사항:
- `package.json`에 `@anthropic-ai/claude-agent-sdk` 의존성이 있는가?
- `tsx` (TypeScript 실행기)가 있는가?

### 의존성 설치

```bash
npm install
```

### 확인 실험

설치가 완료되면, SDK 패키지가 정상적으로 로드되는지 확인:

```bash
node -e "const sdk = require('@anthropic-ai/claude-agent-sdk'); console.log('SDK loaded:', Object.keys(sdk))"
```

### 관찰 포인트

- `npm install` 후 `node_modules/@anthropic-ai/claude-agent-sdk/` 폴더가 생겼는가?
- SDK가 export하는 함수는 무엇인가? (`query`가 보이는가?)

> ⛔ **STOP** — 설치 결과를 확인하고 알려주세요.

---

## Phase B — 피드백 + 퀴즈

### 피드백 포인트

- SDK가 `query` 함수를 export한다는 것을 확인
- `vendor/` 폴더 안에 ripgrep 등 Claude Code의 도구들이 포함되어 있음
- 이것은 SDK가 **Claude Code CLI 자체를 내장**하고 있다는 증거

### 퀴즈

**Q1**: Claude Agent SDK는 Anthropic API를 직접 호출하는가, 아니면 Claude Code CLI를 서브프로세스로 실행하는가?

**Q2**: SDK가 `vendor/ripgrep`을 포함하는 이유는 무엇일까?

### 정답 가이드

- Q1: CLI를 서브프로세스로 실행한다. 따라서 API 키가 아닌 CLI 인증(OAuth)을 사용한다.
- Q2: ripgrep은 Claude Code의 `Grep` 도구의 내부 구현. SDK가 CLI의 전체 도구 체인을 포함하기 때문.

### 다음 Block 안내

> 환경 설정이 완료되었습니다. Block 1에서 `query()`로 첫 에이전트를 실행합니다. "Block 1 시작"이라고 말해주세요.
