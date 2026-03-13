# FE 워크플로우 가이드

> superpowers 사고 스킬 + fe-workflow 실행 스킬 하이브리드

## 전체 흐름

```
brainstorming → /fe:fe-spec → /fe:implement → /done
(superpowers)   (fe-workflow)  (fe-workflow)   (session-manager)
```

- superpowers의 **사고 스킬** (brainstorming, debugging, code-review 등)은 그대로 사용
- **계획+실행**만 fe-workflow로 대체 (FE 컨벤션 주입 + Phase 기반)

---

## 1. 탐색: brainstorming (superpowers)

요구사항이 들어오면 superpowers:brainstorming이 자동 트리거.

```
"청약 상세에서 서류 첨부 파일 기능 추가해야 해"
→ brainstorming으로 범위 확인, 접근 방식 탐색
```

단순 작업(버그 수정, 1파일 변경)은 brainstorming 스킵하고 바로 구현 가능.

## 2. 스펙 작성: /fe:fe-spec

### 입력 방식 3가지

**A. 러프 초안 있을 때:**
```
/fe:fe-spec 청약 서류 첨부
→ .ai/specs/청약-상세.md 의 러프 초안을 읽고 정제
```

**B. 초안 없이 처음부터:**
```
/fe:fe-spec 주문 상세
→ AI가 질문으로 정보 수집 후 스펙 생성
```

**C. 디자인/스크린샷 기반:**
```
/fe:fe-spec 청약 서류 첨부
→ 스크린샷 경로나 디자인 설명 제공
```

### AI가 하는 것

1. **정보 수집** — 러프 초안 읽기 or 질문 (최대 2회)
2. **코드 탐색** — 유사 페이지, 기존 패턴 확인
3. **Gap Analysis** — 빠진 부분/모호한 점을 구조화된 질문으로 짚어줌
   - 빠진 요구사항 (빈 상태, 권한, 에러 복구 등)
   - 모호한 지점 (양자택일 질문)
   - 기존 패턴과 충돌 확인
4. **정제 스펙 생성** → `.ai/specs/{name}.md`
   - 페이지 구조, 섹션별 상세, API 매핑
   - **구현 Phases** (검증 기준 포함)

### 결과물 예시

```markdown
## 구현 Phases

### Phase 1: API 계층
- [ ] DTO 정의
- [ ] remotes/queries/mutations
- 검증: 타입체크 통과

### Phase 2: UI 컴포넌트
- [ ] 레이아웃 + 컴포넌트
- 검증: 화면 렌더링 확인

### Phase 3: 인터랙션 + 엣지 케이스
- [ ] CRUD 연결, 상태별 분기
- 검증: 전체 시나리오 동작
```

스펙 검토 후 승인하면 다음 단계.

## 3. 구현: /fe:implement

```
/fe:implement .ai/specs/청약-서류첨부.md
```

### Phase별 실행

스펙에 Phase가 있으면 자동으로 Phase별 실행 모드 진입.

**각 Phase마다:**
1. 해당 Phase만 Agent에게 위임 (FE 컨벤션 자동 주입)
2. 완료 후 구조화된 검증 보고:
   - 구현 내용, 검증 결과
   - 컨텍스트 적합성 (기존 패턴과 일관적인가)
   - 스펙 차이 (다르게 구현한 부분 + 사유)
   - 결정사항 (기술 판단 + 근거)
3. 사용자 확인 후 다음 Phase

### 선택지

| 선택 | 동작 |
|------|------|
| **다음 Phase 진행** | 다음 Phase만 실행 |
| **수정 필요** | 피드백 반영 후 같은 Phase 재검증 |
| **스펙 변경 필요** | 스펙 수정 후 현재 Phase 재실행 |
| **나머지 전부 진행** | 남은 Phase 연속 실행 (확인 생략) |

### Phase 없는 작업

스펙에 Phase가 없거나, 스펙 없이 직접 요청하면 기존처럼 전체 위임.

```
/fe:implement "버튼 클릭 안 됨 수정"
→ Phase 없음 → 전체 위임 (기존 방식)
```

## 4. 완료: /done

```
/done
```

### 자가학습 3트랙

| 트랙 | 소스 | 학습 성격 | 예시 |
|------|------|----------|------|
| Transcript | 대화 기록 | "하지 마라" (교정) | `as` 타입 단언 금지 |
| Active 파일 | 결정사항/컨벤션 | "이렇게 해라" (선호) | viewState 패턴 사용 |
| Profile | 의사결정 턴 | 판단 패턴 | 관리 포인트 최소화 |

- 각 트랙에서 새로운 학습 항목 발견 시 제안 → 승인하면 `learnings-*.md`에 저장
- CHANGELOG 기록 + active 파일 정리

---

## 상황별 워크플로우

### 새 페이지/기능 구현

```
brainstorming → /fe:fe-spec → (검토/승인) → /fe:implement → /done
```

### 기존 기능 수정/추가

```
/fe:fe-spec (러프 초안 기반) → /fe:implement → /done
```

### 버그 수정/단순 변경

```
직접 수정 or /fe:implement "버그 설명" → /done
```

### 디버깅

```
superpowers:systematic-debugging → 수정 → /done
```

---

## superpowers와의 역할 분담

| superpowers (유지) | fe-workflow (FE 특화) |
|-------------------|---------------------|
| brainstorming | fe-spec (Gap Analysis + Phase) |
| systematic-debugging | implement (컨벤션 주입 실행) |
| requesting-code-review | — |
| using-git-worktrees | — |
| verification-before-completion | — |

**핵심:** superpowers의 writing-plans/executing-plans 대신 fe-spec/implement를 쓰는 이유는 **FE 컨벤션 주입**. superpowers는 범용이라 프로젝트별 conventions를 모름.
