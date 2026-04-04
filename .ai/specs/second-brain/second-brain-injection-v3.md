
---
title: 세컨드 브레인 — 컨텍스트 자동 주입 v3
date: 2026-04-03
status: approved
depends: second-brain-v2.md
---

# 세컨드 브레인 — 컨텍스트 자동 주입 v3

> 핵심: "작업 시작 → 관련 지식 자동 로드" 파이프 구축

## 배경

v2에서 구축한 3레이어(rules/지시 + .ai/작업 + hq/지식)와 SessionStart 주입은 동작 중.
하지만 프로젝트 매핑이 하드코딩(PROJECT_MAP)이고, 중첩 구조(ishopcare/admin/)가 복잡하며, 토픽 단위 컨텍스트 로드가 불가능.

## 변경 요약

| 항목 | v2 (현재) | v3 (변경) |
|------|-----------|-----------|
| 프로젝트 구조 | 중첩 (ishopcare/admin/) | 플랫 (admin/, ishopcare/) |
| 매핑 방식 | JS 하드코딩 (PROJECT_MAP) | hq/map.json 설정 파일 |
| 추가 컨텍스트 | 없음 | active frontmatter `context:` |
| 파일 로드 | 4파일만 (context, decisions, policies, log) | 폴더 내 전체 .md |
| project/sub 분기 | 있음 | 제거 (1뎁스) |

---

## Phase 1: 파이프 구축 (이번 스코프)

### 1. 저장소 — hq/10_projects/ 플랫 구조

#### AS-IS

```
hq/10_projects/
  ishopcare/
    context.md, decisions.md, policies.md, log.md
    admin/       ← 하위
    partners/    ← 하위
    mixpanel/    ← 하위
  ishopcare-server/
  ai/
```

#### TO-BE

```
hq/10_projects/
  ishopcare/           ← 홈페이지 서비스 + 공통 도메인
  admin/               ← 백오피스 (독립)
  partners/            ← 파트너스 (독립)
  mixpanel/            ← Mixpanel (독립, 정리 후 프로젝트 컨텍스트만 유지)
  ishopcare-server/    ← 백엔드
  ai/                  ← AI 모노레포
```

#### 규칙

- 프로젝트 = 독립된 컨텍스트가 필요한 단위 (서비스든 큰 태스크든)
- 1뎁스만. 하위 폴더 없음 (이력/ 등 특수 케이스 제외)
- 프로젝트 폴더 내 .md 파일은 전부 자동 로드 대상
- 완료된 프로젝트 → hq/90_archive/로 이동

#### 마이그레이션

```bash
mv hq/10_projects/ishopcare/admin     hq/10_projects/admin
mv hq/10_projects/ishopcare/partners  hq/10_projects/partners
mv hq/10_projects/ishopcare/mixpanel  hq/10_projects/mixpanel
# ishopcare/는 공통 도메인 + 이력 유지
```

### 2. 매핑 — hq/map.json

cwd → 프로젝트 매핑 설정 파일. hq 루트에 배치 (전역 관리).

```json
[
  { "cwd": "ishopcare-frontend/services/admin", "project": "admin" },
  { "cwd": "ishopcare-frontend/services/partners", "project": "partners" },
  { "cwd": "ishopcare-frontend/services/visit-admin", "project": "visit-admin" },
  { "cwd": "ishopcare-frontend/services/agency", "project": "agency" },
  { "cwd": "ishopcare-frontend/services/dx", "project": "dx" },
  { "cwd": "ishopcare-frontend", "project": "ishopcare" },
  { "cwd": "ishopcare-retool-server", "project": "ishopcare-server" },
  { "cwd": "dev/ai", "project": "ai" }
]
```

- 배열 순서 = 우선순위 (구체적인 것이 먼저)
- cwd에 `mapping.cwd` 문자열이 포함되면 매칭
- 매칭 없으면 프로젝트 지식 로드 안 함 (손해 없음)
- 새 프로젝트 추가 = 한 줄 추가 + hq에 폴더 생성

### 3. 주입 — session-start.mjs 동작 흐름

```
SessionStart 실행
  │
  ├─ 1. .ai/INDEX.md 로드 (기존 유지)
  ├─ 2. .ai/active/ 파일 로드 (기존 유지)
  │     └─ frontmatter에 context: 있으면 파싱
  ├─ 3. hq/20_me/* 전문 로드 (기존 유지)
  ├─ 4. hq/map.json 읽기
  │     └─ cwd 매칭 → 프로젝트명 결정
  ├─ 5. 매칭된 프로젝트 폴더 내 *.md 전부 로드
  └─ 6. active의 context: 프로젝트들 추가 로드
        └─ 5에서 이미 로드된 건 스킵
```

#### 변경점 (v2 대비)

- `PROJECT_MAP` 하드코딩 → `hq/map.json` 파일 읽기
- `project/sub` 2단계 분기 → 1단계 (플랫)
- 4파일 지정 로드 → 폴더 내 전체 .md 로드
- active frontmatter `context:` 파싱 추가

#### active frontmatter 예시

```markdown
<!-- .ai/active/mixpanel-개선.md -->
---
context: [mixpanel]
---
## 목표
Mixpanel 이벤트 구조 개선
```

cwd가 dev/ai → "ai" 프로젝트 로드 + context: [mixpanel] → "mixpanel" 프로젝트 추가 로드.

#### 파일 로드 규칙

- 프로젝트 폴더 내 1뎁스 .md 파일만 (하위 디렉토리 탐색 안 함)
- 전체 내용 로드 (log.md 포함). 성능 이슈 시 Phase 2에서 최적화
- 빈 파일(50자 미만) 스킵
- .map.json 등 비-md 파일 제외

#### active frontmatter context: 동작

- active 파일 1개 (자동 복원) → 해당 파일 frontmatter `context:` 파싱
- active 파일 2개+ → /resume으로 선택된 파일의 `context:` 파싱
- `context:` 없으면 cwd 매핑만 사용 (기존 동작)

#### .map.json fallback

- 파일 미존재 또는 파싱 실패 → 프로젝트 지식 로드 안 함 (에러 무시)
- 필요할 때 사용자가 생성하면 됨

### 4. 전체 흐름 예시

#### admin 작업

```
$ cd ~/work/ishopcare-frontend/services/admin
$ claude

→ .map.json 매칭: "admin"
→ hq/10_projects/admin/*.md 전부 로드
→ admin 도메인 + 기술 결정 + 정책이 컨텍스트에 있는 상태로 시작
```

#### dev/ai에서 mixpanel 작업

```
$ cd ~/dev/ai
$ claude
(.ai/active/mixpanel-개선.md에 context: [mixpanel])

→ .map.json 매칭: "ai"
→ hq/10_projects/ai/*.md 로드
→ active frontmatter: context: [mixpanel]
→ hq/10_projects/mixpanel/*.md 추가 로드
→ ai + mixpanel 두 프로젝트 컨텍스트로 시작
```

---

## Phase 2 (백로그)

- [ ] /done 자동 템플릿 생성 — 프로젝트 폴더 없으면 context.md 기본 템플릿 자동 생성
- [ ] FE/BE 도메인 컨벤션 조건부 로드 — .map.json에 domain 필드, 작업 유형별 컨벤션 분리
- [ ] /brain 관리 스킬 — health(진단) + cleanup(정리), 토큰 비용 관리
- [ ] 축적 품질 개선 — /done 판단 기록 추출 정확도 향상
- [ ] AI 코드 분석 → 프로젝트 context 자동 생성 — 코드베이스 분석해서 context.md 초안 작성

---

## 구현 순서

1. hq/map.json 생성
2. hq 마이그레이션 (admin, partners, mixpanel 독립 이동)
3. session-start.mjs 개편 (.map.json 로드 + 플랫 구조 + 전체 .md + active frontmatter)
4. 검증 — plugin update 후 실제 세션에서 주입 확인
