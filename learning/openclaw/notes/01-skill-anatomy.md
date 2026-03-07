# OpenClaw 스킬 구조 해부

## 스킬이란?

스킬 = **SKILL.md 파일 하나**로 에이전트 행동을 정의하는 단위.
코드 없이 마크다운으로 에이전트에게 "이럴 때 이렇게 해" 라고 가르치는 것.

## 디렉토리 구조

```
skill-name/
├── SKILL.md              (필수) — 프론트매터 + 지시사항
├── scripts/              (선택) — 실행 가능한 코드 (Python/Bash)
├── references/           (선택) — 참조 문서 (필요 시 로드)
└── assets/               (선택) — 출력에 쓸 파일 (템플릿, 이미지 등)
```

## SKILL.md 구조

### 1. YAML 프론트매터 (필수)

```yaml
---
name: skill-name
description: "스킬 설명 + 트리거 조건. 이게 핵심!"
homepage: https://...          # 선택
user-invocable: true           # /명령어 로 직접 호출 가능 여부
metadata:
  openclaw:
    emoji: "🌤️"
    requires:
      bins: ["curl", "git"]    # 필요한 CLI 도구
    primaryEnv: "GH_TOKEN"     # 필요한 환경변수
    install:                    # 자동 설치 지원
      - id: brew
        kind: brew
        formula: "tap/package"
---
```

**핵심**: `description`이 스킬 트리거의 핵심.
- 에이전트는 description만 보고 스킬을 쓸지 결정
- "when to use" 정보를 여기에 넣어야 함 (본문 X)
- 본문은 트리거된 후에만 로드됨

### 2. 마크다운 본문 (필수)

트리거된 후 에이전트가 읽는 지시사항.

## 실전 패턴 분석 (3개 스킬)

### weather (단순 도구형)
- **복잡도**: 낮음
- **패턴**: When to Use / When NOT to Use / Commands / Quick Responses
- **도구**: curl만 사용 (wttr.in API)
- **특징**: 외부 바이너리(`curl`) 하나로 동작, API 키 불필요

### summarize (도구 연동형)
- **복잡도**: 중간
- **패턴**: 트리거 문구 / Quick start / 옵션 플래그 / 설정
- **도구**: `summarize` CLI (brew로 설치)
- **특징**: 외부 CLI 도구 의존, 여러 LLM 제공자 지원

### gh-issues (워크플로우 오케스트레이터형)
- **복잡도**: 높음
- **패턴**: Phase 1→2→3... 단계별 지시 / 인수 파싱 / 서브에이전트 생성
- **도구**: curl + git + gh (GitHub REST API)
- **특징**: 6단계 파이프라인, 병렬 서브에이전트 생성, PR까지 자동

## 스킬 분류

| 유형 | 설명 | 예시 |
|------|------|------|
| **단순 도구형** | curl 등으로 외부 API 호출 | weather |
| **도구 연동형** | 외부 CLI 도구 활용 | summarize, obsidian |
| **워크플로우형** | 멀티 스텝 오케스트레이션 | gh-issues, coding-agent |

## 3단계 로딩 (Progressive Disclosure)

1. **메타데이터** (name + description) — 항상 컨텍스트에 (~100 단어)
2. **SKILL.md 본문** — 트리거 시 로드 (<5k 단어 권장)
3. **번들 리소스** — 필요 시 에이전트가 로드 (무제한)

## 설계 원칙

1. **간결하게** — 컨텍스트 윈도우는 공공재, 에이전트는 이미 똑똑함
2. **자유도 조절** — 위험한 작업은 구체적으로, 유연한 작업은 느슨하게
3. **중복 금지** — SKILL.md와 references에 같은 내용 넣지 않기
4. **500줄 이하** — SKILL.md 본문은 500줄 넘지 않도록
