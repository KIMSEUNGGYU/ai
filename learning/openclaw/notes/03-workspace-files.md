# 워크스페이스 파일 구조 (SOUL.md, AGENTS.md 등)

## 워크스페이스란?

에이전트의 "집" — 모든 부트스트랩 파일, 스킬, 메모리가 여기 있음.
기본 경로: `~/.openclaw/workspace/`

## 파일별 역할

```
~/.openclaw/workspace/
├── AGENTS.md       ← 운영 지침 + 메모리 사용법 (매 세션 로드)
├── SOUL.md         ← 페르소나, 톤, 경계선 (매 세션 로드)
├── USER.md         ← 사용자 프로필 + 호칭 (매 세션 로드)
├── IDENTITY.md     ← 에이전트 이름, 분위기, 이모지
├── TOOLS.md        ← 로컬 도구 사용 노트 (가이드용, 도구 제어 아님)
├── HEARTBEAT.md    ← 하트비트 실행 시 체크리스트 (짧게)
├── BOOT.md         ← Gateway 재시작 시 실행할 체크리스트
├── BOOTSTRAP.md    ← 최초 1회 실행 리추얼 (완료 후 삭제)
├── MEMORY.md       ← 장기 기억 (큐레이션, 메인 세션에서만 로드)
├── memory/         ← 일일 로그
│   └── YYYY-MM-DD.md
├── skills/         ← 에이전트별 스킬
└── canvas/         ← Canvas UI 파일
```

## 핵심 파일 상세

### SOUL.md — 에이전트의 "영혼"
**역할**: 페르소나, 말투, 행동 경계 정의
**언제 로드**: 매 세션 시작 시 (시스템 프롬프트에 주입)

예시:
```markdown
# Soul

나는 승규의 개인 비서다.
- 한국어로 응답
- 간결하고 직접적으로
- 불확실하면 물어보기
- 민감한 정보는 다루지 않기
```

### AGENTS.md — 운영 지침서
**역할**: 에이전트가 어떻게 행동하고, 어떤 규칙을 따르고, 메모리를 어떻게 쓸지
**언제 로드**: 매 세션 시작 시

예시:
```markdown
# Agent Instructions

## 규칙
- 할 일 요청 시 Linear API로 이슈 조회
- 날씨 물어보면 wttr.in 사용
- 중요한 결정은 MEMORY.md에 기록

## 메모리 사용
- 일일 노트: memory/YYYY-MM-DD.md
- 장기 기억: MEMORY.md
```

### USER.md — 사용자 프로필
**역할**: 에이전트가 나를 어떻게 부르고, 내 선호를 알지
```markdown
# User

이름: 승규
호칭: 승규님
직업: FE 개발자
위치: 한국
선호: TypeScript, Claude, 간결한 답변
```

### IDENTITY.md — 에이전트 이름표
```markdown
# Identity

이름: 클로
이모지: 🦞
분위기: 친근하고 효율적인 업무 파트너
```

### TOOLS.md — 도구 사용 가이드
**주의**: 도구 자체를 제어하지 않음, 가이드일 뿐
```markdown
# Tools Notes

## exec
- git 명령은 workspace 안에서만
- npm install 은 확인 후 실행

## read/write
- memory/ 디렉토리에 일일 로그 자동 작성
```

## 프롬프트 조립 순서

시스템 프롬프트에 자동 주입되는 순서:
1. 도구 목록 (Tooling)
2. 안전 가드레일 (Safety)
3. 스킬 목록 (Skills)
4. 워크스페이스 파일들 (Project Context):
   - AGENTS.md, SOUL.md, TOOLS.md, IDENTITY.md, USER.md, HEARTBEAT.md
   - MEMORY.md (있으면)
5. 날짜/시간, 런타임 정보

## 크기 제한
- 파일당 최대: 20,000자 (기본값)
- 전체 부트스트랩 합계: 150,000자
- 초과하면 자동 잘림 + 경고

## 핵심 인사이트

1. **SOUL.md = 성격, AGENTS.md = 행동 규칙** — 분리해서 관리
2. **매 턴마다 주입됨** → 짧게 유지해야 토큰 절약
3. **MEMORY.md도 주입됨** → 커지면 컴팩션 빈번해짐, 핵심만 유지
4. **memory/*.md는 주입 안 됨** → memory_search로 필요 시 로드
5. **Git으로 백업 권장** (private repo)
6. **서브에이전트는 AGENTS.md + TOOLS.md만 주입** (경량화)
