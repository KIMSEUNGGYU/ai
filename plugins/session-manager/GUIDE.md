# session-manager 사용 가이드

> v0.4.0 | 세션 간 맥락 유지 + 지식 영속 저장 + 병렬 작업 지원

## 기능 요약

| 기능 | 설명 |
|------|------|
| `/setup` | `.ai/` 폴더 구조 초기화 + INDEX.md 자동 생성 |
| `/save` | 작업 진행 상태를 `.ai/active/{task}.md`에 저장 |
| `/resume` | active 파일 선택 후 로드 + 다음 작업 안내 |
| `/note` | 세션 지식을 영속 저장소에 보존 (AI가 저장 위치 자동 판단) |
| `/done` | 작업 완료 처리 — archive + 패턴 질문 + active 삭제 |
| `note` 스킬 | "정리해줘", "남겨둬" 등 자연어로 `/note` 트리거 |
| SessionStart Hook | 세션 시작 시 INDEX.md + active 목록 자동 주입 |
| SessionEnd Hook | 세션 종료 시 active 파일 타임스탬프 자동 갱신 |

## 빠른 시작

```
최초 설정 → /setup 으로 .ai/ 구조 + INDEX.md 생성
세션 시작 → (자동) INDEX.md + active 목록 로드
작업 선택 → /resume 으로 작업 파일 선택
작업 중   → /save로 진행 상태 저장
          → /note로 지식 영구 보존
세션 종료 → 그냥 나가면 됨
작업 완료 → /done 으로 정리
```

---

## 커맨드

### `/setup` — .ai/ 초기화 + INDEX.md 생성

프로젝트의 `.ai/` 폴더 구조를 초기화하고, 프로젝트를 분석하여 INDEX.md를 자동 생성한다.

**언제 쓰나:**
- 프로젝트에서 session-manager를 처음 사용할 때
- INDEX.md를 새로 만들고 싶을 때

**사용법:**
```
/setup    ← .ai/ 폴더 생성 + 프로젝트 분석 → INDEX.md 생성
```

**동작:**
1. `.ai/INDEX.md` 이미 있으면 → 다시 생성할지 질문
2. 프로젝트 정보 수집 (CLAUDE.md, package.json, 디렉토리 구조 등)
3. `.ai/` 하위 폴더 생성 (active, archive, notes, patterns)
4. INDEX.md 자동 생성 (프로젝트 개요, 서비스 맵, 진행 중 작업 등)

---

### `/save` — 작업 상태 저장

현재 작업의 진행 상태를 `.ai/active/{task}.md`에 저장한다.

**언제 쓰나:**
- 세션 중간에 체크포인트를 남기고 싶을 때
- 세션 종료 전에 진행 상태를 기록할 때
- 다음 세션에서 이어서 할 작업이 있을 때

**사용법:**
```
/save              ← active 파일이 1개면 자동 업데이트
/save admin-auth   ← 특정 작업 파일 지정
```

**참고:**
- active 파일이 여러 개면 어떤 작업인지 질문
- 단일 세션으로 끝나는 작업이면 안 써도 됨

---

### `/resume` — 작업 복원

active 파일 목록에서 작업을 선택하고 로드한다.

**사용법:**
```
/resume    ← active 목록 표시 → 선택 → 로드 + 다음 작업 안내
```

| active 파일 수 | 동작 |
|---|---|
| 0개 | "활성 작업 없음" 메시지 |
| 1개 | 자동 로드 (질문 없음) |
| 2개 이상 | 선택 질문 |

보통은 쓸 일 없음. SessionStart Hook이 자동으로 목록을 보여줌.

---

### `/note` — 지식 영속 저장

세션 대화에서 나온 지식을 영구 저장소에 보존한다.

**언제 쓰나:**
- 분석 결과를 남기고 싶을 때
- 배운 개념을 정리하고 싶을 때
- 재사용할 코드 패턴을 발견했을 때

**저장 위치 (AI 자동 판단 → 사용자 확인):**

| 내용 성격 | 저장 위치 |
|----------|----------|
| 프로젝트 설계/분석/결정 | `.ai/notes/` |
| 재사용 코드 패턴 | `.ai/patterns/` |
| 개인 학습 | `~/obsidian-note/00_Inbox/` |

---

### `/done` — 작업 완료 처리

기능 단위 작업이 완료되었을 때 정리한다.

**동작:**
1. active 파일 선택 (1개면 자동)
2. `.ai/archive/{서비스}/`에 경량 기록 저장
3. 패턴화 가능하면 `.ai/patterns/` 저장 제안
4. active 파일 삭제
5. INDEX.md 업데이트

**사용법:**
```
/done              ← active 파일 선택 → 정리
/done admin-auth   ← 특정 작업 완료 처리
```

---

## Hook (자동 동작)

### SessionStart — 세션 시작 시

- `.ai/INDEX.md`가 있으면 프로젝트 컨텍스트 주입
- `.ai/active/` 파일 목록 표시 → `/resume`으로 이어가기 안내

### SessionEnd — 세션 종료 시

- `.ai/active/*.md` 파일들의 last-active 타임스탬프 자동 갱신
- 내용 자체를 업데이트하지는 않음 (그건 `/save`의 역할)

---

## /save vs /note vs /done 비교

| | `/save` | `/note` | `/done` |
|------|---------|---------|---------|
| **목적** | 작업 진행 상태 기록 | 지식 영구 보존 | 작업 완료 정리 |
| **저장 위치** | `.ai/active/{task}.md` | notes / patterns / obsidian | `.ai/archive/` |
| **수명** | 작업 완료 시 `/done` | 영구 | 영구 |
| **빈도** | 세션당 1-2회 | 필요할 때 | 기능 완료 시 1회 |

---

## 실전 시나리오

### 멀티 세션 기능 구현

```
세션 1:
  → (자동) INDEX.md 로드 + active 목록 표시
  → "인증 시스템 작업할게" → /resume
  → 설계 작업
  → /save → .ai/active/admin-auth.md 생성
  → 종료

세션 2:
  → (자동) "진행 중 작업 1개: admin-auth"
  → /resume → 자동 로드 + "다음 작업: API 연결"
  → 구현 작업
  → /save → 진행 상태 업데이트
  → /done → archive 저장 + active 삭제
```

### 병렬 작업

```
  → /save admin-auth   ← 인증 작업 저장
  → /save dx-deploy    ← 배포 작업 저장
  → (다음 세션) "진행 중 작업 2개: admin-auth, dx-deploy"
  → /resume → 작업 선택
```

---

## FAQ

**Q: current.md는 어떻게 되나요?**
v3에서 `active/{task}.md` 방식으로 전환. current.md가 남아있으면 SessionStart에서 감지하고 마이그레이션을 안내합니다.

**Q: /done 없이 active 파일을 직접 삭제해도 되나요?**
가능하지만, `/done`을 쓰면 archive 기록 + 패턴 저장 제안을 받을 수 있습니다.

**Q: INDEX.md는 누가 만드나요?**
`/setup` 커맨드로 자동 생성합니다. 프로젝트를 분석해서 의미있는 INDEX.md를 만들어줍니다. `/save`가 INDEX.md의 "진행 중" 섹션을 자동 동기화합니다.
