---
title: FE 하네스 설계
date: 2026-03-31
status: draft
---

# FE 하네스 설계

## 개요

FE 개발 품질을 높이기 위한 하네스 시스템. 앤트로픽의 $9 vs $200 실험과 Ouroboros에서 영감을 받아 Planner / Generator / Evaluator 3-에이전트 아키텍처로 설계.

핵심 원칙:
- **GAN 구조**: 만드는 놈(Generator)과 평가하는 놈(Evaluator)을 분리해서 Self-Evaluation Bias 해결
- **Sprint Contract**: 코드 작성 전에 완료 기준 합의
- **파일 기반 통신**: 에이전트 간 파일로 소통. 컨텍스트 격리 + 로그 자동 축적
- **점수 추이 기반 방향 결정**: 단순 재시도가 아닌 Ralph 스타일 적응형 루프

## 배경

### 현재 문제 (fe-workflow-개선.md 데이터)
- 패턴 불일치 35% — 컨벤션을 읽고도 안 따름
- 컨벤션 위반 25% — 1903줄을 한번에 읽으면 세부 규칙 놓침
- 자기검증 부실 — code-writer가 자기 코드를 자기가 평가 → 편향
- Planner 부재 — 뭘 만들지 깊이 생각 안 하고 바로 코딩 시작

### 참고 자료
- 앤트로픽 하네스 설계: https://www.anthropic.com/engineering/harness-design-long-running-apps
- Ouroboros: https://github.com/Q00/ouroboros/blob/main/README.ko.md

---

## 전체 흐름

```
입력: 한 줄 ~ 파일 (상황에 따라)

[사람 + AI 협업] Planner
  → 소크라테스식 질문으로 숨겨진 가정 발견
  → 스펙 확장 ("무엇"만, "어떻게"는 Generator에게)
  → 자체 모호성 체크
  → spec.md 출력
  → [사람 확인] 후 확정

[AI 자율] Build Loop (Sprint 반복)
  → Sprint Contract (Generator ↔ Evaluator 합의)
  → Generator 구현
  → Static Gate (tsc + biome + harness-check)
  → Evaluator 3단계 평가
  → 점수 추이 기반 방향 결정
  → 통과 시 다음 Sprint

[사람 검토] 결과물 확인
  → 작은 피드백 → 일반 Claude Code
  → 방향 변경 → 하네스 재호출
```

---

## 에이전트 3개

| 에이전트 | 모델 | 역할 |
|---------|------|------|
| Planner | Opus | 스펙 확장 + Sprint 분해 + 소크라테스식 질문 + 자체 모호성 체크 |
| Generator | Sonnet | Sprint 단위 코드 구현 |
| Evaluator | Opus | 3단계 평가 (Contract + 열린 + Contrarian) + 피드백 생성 |

---

## 1. Planner

### 역할
간단한 요구사항 → 전체 스펙 + Sprint 분해

### 입력
- 사용자 요구사항 (한 줄 ~ 파일, 상황에 따라 유동적)
- 대상 프로젝트의 기존 코드 구조
- domain-context.md (있으면)
- 컨벤션 문서들 (하네스 설정에서 참조, 아래 "컨벤션 설정" 섹션 참조)

### 동작
1. 기존 코드 구조 파악 (폴더, 유사 페이지 패턴)
2. 소크라테스식 질문 — 숨겨진 가정을 드러냄
   - "취소하면 환불도 자동 처리되나요, 별도 프로세스인가요?"
   - "취소 사유는 고정 선택지인가요, 자유 입력인가요?"
3. 스펙 확장 — "무엇"만 정의. "어떻게"는 Generator에게
4. Sprint 분해 — 의존성 순서대로
5. 자체 모호성 체크 — 부족하면 추가 질문, 충분하면 사람에게 확인 요청

### 핵심 원칙
- 기술 구현 디테일 안 정함 (훅 선택, 상태 관리 방식 등은 Generator 판단)
- 입력이 충분하면 바로 스펙 생성, 부족하면 적극 질문
- 도메인 컨텍스트 인식 (기존 DTO, remote, query 재사용 여부)

### 모호성 체크 (Ouroboros 영감)

스펙 생성 후 Planner가 자체적으로 모호성을 정량 평가:

```
모호성 점수 = 1 - Σ(clarityᵢ × weightᵢ)
임계값: ≤ 0.2 이어야 다음 단계로 진행
```

| 차원 | 가중치 | 설명 |
|------|--------|------|
| 목표 명확도 | 40% | 기능 목록이 구체적인가? "등등", "기타" 없는가? |
| 제약 명확도 | 30% | API 매핑, 기존 코드 재사용 여부가 명시되었는가? |
| 성공 기준 | 30% | 각 Sprint의 산출물과 완료 기준이 명확한가? |

- 0.2 초과 → Planner가 부족한 차원을 식별하고 사용자에게 추가 질문
- 0.2 이하 → 사람에게 확인 요청
- "목표는 명확한데 성공 기준이 모호하다" 같은 진단이 가능해짐

### 출력: spec.md

**필수 항목** (Planner 프롬프트가 반드시 포함하도록 강제):
- 기능 목록 — 구체적, "등등" 금지
- UI 구조 — 섹션/모달/드로어 레벨
- API 매핑 — 서버 엔드포인트, 메서드
- 데이터 흐름 — 어떤 데이터가 어디서 어디로 흐르는지
- 엣지 케이스 / 예외 상황
- 기존 코드와의 관계 — 재사용, 확장, 신규
- Sprint 계획 — 의존성 순서, 범위, 산출물

```markdown
# 주문서류 상세 페이지

## 기능 목록
- 주문서류 상세 조회
- 상태 변경 (승인/반려)
- 첨부파일 다운로드

## UI 구조
- 상단: 기본 정보 카드
- 중단: 서류 내용 테이블
- 하단: 액션 버튼 그룹

## API 매핑
- GET /order-documents/:id → 상세 조회
- PATCH /order-documents/:id/status → 상태 변경

## 데이터 흐름
- 페이지 진입 → orderDocumentDetailQuery → 상세 데이터 렌더링
- 상태 변경 버튼 → updateStatusMutation → 성공 시 query invalidate → 리렌더링

## 엣지 케이스
- 이미 처리된 서류에 대한 중복 상태 변경 시도
- 첨부파일 URL 만료
- 권한 없는 사용자 접근

## 기존 코드와의 관계
- OrderDocument DTO: models/order-document.dto.ts 확장
- fetchOrderDocuments remote: 이미 존재, 상세용 추가 필요
- 리스트 페이지: pages/order-document/list/ 참조 (UI 패턴)

## Sprint 계획
### Sprint 1: API 계층
  범위: DTO, remote, query, mutation
  산출물: models/, remotes/, queries/, mutations/ 파일

### Sprint 2: UI 컴포넌트
  범위: 페이지 레이아웃 + 컴포넌트
  산출물: OrderDocumentDetailPage.tsx + components/

### Sprint 3: 인터랙션
  범위: 상태 변경, 에러 처리, 폼
  산출물: mutation 연결 + 폼 + 에러 바운더리
```

---

## 2. Sprint Contract

### 역할
Generator와 Evaluator가 코드 작성 전에 완료 기준 합의.
"뭘 만드는지"와 "뭘 기준으로 평가하는지"를 명확히 해서 양쪽 모두 기준이 같게.

### 생성 과정
Generator가 초안 → Evaluator가 검토/보완 → 합의 → contract.md

### 출력: contract.md

**필수 항목:**
- 산출물 목록 — 구체적인 파일/함수/타입 이름
- 정적 게이트 기준
- 코드 품질 기준 — Evaluator가 검증할 항목
- 참조할 기존 코드 — Generator가 패턴을 따를 대상
- **하지 말아야 할 것** — Sprint 범위 밖 명시

```markdown
# Sprint 1 Contract: API 계층

## 이번 Sprint에서 만드는 것
- OrderDocumentDetailResponse DTO
- fetchOrderDocumentDetail remote 함수
- orderDocumentDetailQueryOptions
- updateOrderDocumentStatusMutationOptions

## 하지 말아야 할 것 (범위 밖)
- UI 컴포넌트 작성 (Sprint 2에서 다룸)
- 에러 바운더리 설정 (Sprint 3에서 다룸)
- 기존 리스트 API 수정

## 완료 기준

### 정적 게이트 (자동)
- [ ] tsc --noEmit 통과
- [ ] biome check 통과
- [ ] harness-check 통과

### 코드 품질 (Evaluator 검증)
- [ ] DTO 필드가 서버 API 스펙과 일치
- [ ] remote 함수 네이밍이 기존 패턴과 일관
- [ ] queryOptions가 기존 query 패턴과 동일한 구조
- [ ] mutationOptions에서 invalidateQueries 설정
- [ ] 파일 위치가 folder-structure 컨벤션 준수

### 참조할 기존 코드
- remotes/order-document.ts (이미 있으면)
- queries/ 내 다른 queryOptions 패턴
```

---

## 3. Generator

### 역할
Sprint Contract 기준으로 코드 구현.

### 입력
1. spec.md — 전체 맥락 (이 페이지가 뭔지, 전체 Sprint 구조)
2. contract.md — 이번 Sprint 범위 + 완료 기준
3. 참조 코드 — 패턴 파악 (contract에 명시된 것)
4. 컨벤션 문서들
5. feedback.md — 재실행 시 (Evaluator 피드백)

### 핵심 원칙
- contract에 없는 건 안 만듦 (Sprint 범위 엄수)
- 기존 코드 패턴을 따라감 (자기 판단으로 새 패턴 안 만듦)
- 재실행 시 feedback.md만 보고 수정 (이전 자기 사고 과정은 못 봄 — 프로세스 격리)

---

## 4. Evaluator

### 역할
contract 기준으로 검증 + 구체적 피드백 생성.

### 입력
1. contract.md — 평가 기준
2. 생성된 코드
3. 참조 코드 — 패턴 비교용
4. 컨벤션 문서들
5. 이전 eval-log — 점수 추이 파악용 (Orchestrator가 전달)

### 평가 3단계

**A. Contract 기준 (닫힌 평가)**
- contract.md에 명시된 항목 pass/fail
- "약속한 건 다 했나?"

**B. 열린 평가 (자유 판단)**
- 기존 코드 패턴과 비교해서 이상한 점
- 불필요한 복잡도
- 컨벤션에는 없지만 코드 품질에 영향을 주는 것

**C. Contrarian (반대 관점)**
- "이 코드의 가장 약한 점은?"
- "6개월 후 유지보수할 때 문제될 부분은?"
- Evaluator 프롬프트 섹션으로 포함 (별도 에이전트 아님. 써보고 부족하면 분리)

### 출력

**eval-log-rN.md:**
```markdown
# Sprint 1 Eval — Round 1

## 메타
- 시각: 2026-03-31 14:30
- Generator 모델: sonnet
- Evaluator 모델: opus
- 소요 시간: Generator 2분 30초, Evaluator 45초

## 통과 판정: FAIL (Contract 미충족)

## 품질 점수: 8.1/10 (보고서용)
| 영역 | 가중치 | 점수 | 산출 |
|------|--------|------|------|
| A. Contract 기준 | 60% | 4/5 통과 = 0.80 | 0.48 |
| B. 열린 평가 | 30% | 이슈 1건 (경미) = 0.85 | 0.255 |
| C. Contrarian | 10% | 약점 1건 = 0.70 | 0.07 |
| **합계** | | | **0.805 → 8.1/10** |

## A. Contract 기준
| # | 기준 | 결과 | 근거 |
|---|------|------|------|
| 1 | DTO 서버 스펙 일치 | pass | 필드 매칭 확인 |
| 2 | remote 네이밍 | fail | get* → fetch* 패턴 (참조: remotes/merchant.ts) |
| 3 | query 패턴 일관성 | pass | |
| 4 | mutation invalidate | pass | |
| 5 | 파일 위치 | pass | |

## B. 열린 평가
- status 필드를 string으로 정의. 기존 패턴은 as const union.
  (참조: models/order.dto.ts:L12)

## C. Contrarian
- queryOptions를 wrapping하는 커스텀 훅이 필요한가?
  기존 코드는 queryOptions를 직접 export. 사용처 1곳이면 불필요.

## 방향성
재시도. remote 네이밍 수정 + status 타입 변경.
```

**feedback-rN.md (Generator에게 전달):**
```markdown
# Sprint 1 Feedback — Round 1

## 수정 필요
1. remotes/order-document.ts: getOrderDocument → fetchOrderDocumentDetail
   참조: remotes/merchant.ts의 fetchMerchantDetail 패턴

2. models/order-document.dto.ts: status: string → as const union type
   참조: models/order.dto.ts:L12의 OrderStatus 패턴

## 검토 권장 (수정 필수 아님)
- queryOptions wrapping 훅 필요성 재검토
```

---

## 5. Orchestrator

### 역할
전체 흐름 제어. LLM이 아닌 코드 로직 (if/else 분기).

### 동작

```
1. 초기화
   - 입력 파싱
   - .ai/harness/{도메인}/{페이지}/ 디렉토리 생성
   - domain-context.md 존재 여부 확인

2. Planner 호출 (인터랙티브)
   - 사용자와 질문 주고받기
   - spec.md 생성
   - [사람 확인] 대기

3. Build Loop (AI 자율)
   for each Sprint in spec.md:
     a. Contract 생성
        Generator 초안 → Evaluator 검토 → contract.md
     b. Generate
        Generator 호출 → 코드 생성
     c. Static Gate
        tsc + biome + harness-check
        실패 → 에러 전달 → Generator 재호출 (max 3회)
        3회 실패 → Sprint 중단
     d. Eval Loop
        Evaluator 호출 → eval-log-rN.md
        점수 추이 판단 → 분기 (아래 참조)
     e. Sprint 완료
        domain-context.md 업데이트

4. 결과 출력
   summary.md 생성
```

### Eval Loop 방향 결정

Sprint 통과 = Contract 전부 pass AND 품질 점수 ≥ 임계값.
재시도 시 방향 결정은 Contract fail 수 + 품질 점수 추이로 판단:

```
Contract 전부 pass + 품질 점수 ≥ 임계값 → Sprint 완료.

미충족 시:
  fail 수 or 품질 점수 개선 중 → 같은 방향 재시도
  3회 연속 동일 → 현재 상태 수용 (정체)
  fail 수 증가 or 품질 점수 하락 → 다른 방향 지시 or 중단 (악화)
  같은 피드백 반복 → 중단 (수렴 불가)
  Hard cap → 안전장치 (max N회)
```

### 비정상 종료 처리
Sprint 도중 중단 시 → 사람에게 "여기서 막혔다" + 현재 상태 알림.

---

## 6. Static Gate

Evaluator 전에 빠르게 걸러내는 기계적 검증. 비용 0, 즉시 실행.

| 검증 | 명령 | 역할 |
|------|------|------|
| 타입 | `tsc --noEmit` | 타입 에러 0 |
| 린트 | `biome check` | 린트 에러 0 |
| 규칙 | `harness-check` | 기계적 컨벤션 위반 0 |

실패 → 에러 메시지만 Generator에게 전달 → 재생성 (max 3회).
Static Gate 통과 후에만 Evaluator 호출 (비용 절약).

---

## 에이전트 간 정보 흐름

```
Planner → spec.md → Generator (읽음), Evaluator (읽음)

Generator ↔ Evaluator:
  contract.md     ← 둘 다 읽음 (합의 문서)
  [생성된 코드]    ← Evaluator가 읽음
  eval-log-rN.md  ← Generator가 읽을 수 있음
  feedback-rN.md  ← Generator가 읽고 수정 반영

정보 차단 (의도적):
  Generator → Evaluator의 내부 추론 과정 (게이밍 방지)
  Evaluator → Generator의 사고 과정 (편향 방지)
```

---

## 사람 개입 시점

| 시점 | 조건 | 동작 |
|------|------|------|
| Planner 후 | 항상 | 스펙 확인 + 피드백 → 확정 |
| Build Loop 중 | 비정상 종료 시만 | "여기서 막혔다" 알림 |
| 완료 후 | 항상 | 결과물 검토 |
| 검토 후 | 작은 피드백 | 일반 Claude Code에서 수정 |
| 검토 후 | 방향 변경 | 하네스 재호출 |

---

## 파일 구조

```
.ai/harness/
├── {도메인}/
│   ├── domain-context.md            ← 도메인 공유 설계 (DTO, API, 타입)
│   ├── {페이지}/                    ← 하네스 실행 단위 = 페이지 1개
│   │   ├── spec.md                  ← Planner 출력
│   │   ├── sprint-1/
│   │   │   ├── contract.md          ← 완료 기준 합의
│   │   │   ├── eval-log-r1.md       ← Round 1 평가
│   │   │   ├── feedback-r1.md       ← Round 1 피드백
│   │   │   ├── eval-log-r2.md       ← Round 2 평가 (재시도 시)
│   │   │   └── feedback-r2.md       ← Round 2 피드백 (있으면)
│   │   ├── sprint-2/
│   │   │   └── ...
│   │   └── summary.md               ← 실행 요약
```

- 실행 단위 = 페이지 1개
- 도메인 단위로 그룹핑 (공유 DTO/API 일관성)
- eval-log는 라운드마다 별도 파일 (독립 평가 보장)
- 파일 생명주기: 써보고 결정

---

## summary.md 형식

```markdown
# 하네스 실행 요약

## 대상
- 도메인: order-document
- 페이지: detail
- 입력: "주문서류 상세 페이지 구현"

## Sprint 결과
| Sprint | 범위 | 라운드 | 최종 점수 | 결과 |
|--------|------|--------|----------|------|
| 1 | API 계층 | 2 | 9/10 | 통과 |
| 2 | UI 컴포넌트 | 1 | 8/10 | 통과 |
| 3 | 인터랙션 | 3 | 7/10 | 정체로 수용 |

## 생성된 파일
- models/order-document.dto.ts
- remotes/order-document.ts
- queries/order-document.query.ts
- mutations/order-document.mutation.ts
- pages/order-document/detail/OrderDocumentDetailPage.tsx
- pages/order-document/detail/components/...

## 미해결 (사람 판단)
- Sprint 3에서 queryOptions 커스텀 훅 필요성 (Contrarian 지적)
```

---

## 커맨드 구조

### 통합 + 개별 호출

```
/fe:harness              (통합 오케스트레이터)
  → /fe:planning         (스펙 작성)
  → /fe:implementing     (구현 — contract 자동 포함)
  → /fe:evaluating       (평가)
```

**통합 호출:**
`/fe:harness "요구사항"` → planning → implementing → evaluating → 반복

**개별 호출:**
- `/fe:planning "요구사항"` → spec.md 생성만
- `/fe:implementing spec.md` → contract 없으면 자동 생성 → 구현
- `/fe:evaluating` → 기존 코드 평가만

개별 호출 시 선행 단계가 없으면 자동으로 포함:
- implementing 호출 시 contract.md가 없으면 → contract 자동 생성 후 구현
- evaluating 호출 시 contract.md가 없으면 → contract 없이 열린 평가 + Contrarian만

---

## 구현 계획: 2가지 버전

동일한 설계를 두 가지 호스팅으로 구현하여 비교.

### A. Claude Code 플러그인
- Agent 도구로 서브에이전트 분리
- Claude Code 안에서 바로 사용
- 컨텍스트 격리: 부분적 (같은 세션)

### B. 독립 서비스 (`claude -p` CLI)
- 각 에이전트가 완전히 독립된 프로세스
- 터미널에서 별도 실행
- 컨텍스트 격리: 완전 (프로세스 분리)

### 공유하는 것
- Planner / Generator / Evaluator 프롬프트
- Sprint Contract / eval-log / feedback / summary 형식
- 컨벤션 문서 참조
- 파일 구조 (.ai/harness/)
- Orchestrator 로직 (점수 분기, 수렴 감지)

### 비교 포인트
| 항목 | A 플러그인 | B 독립 서비스 |
|------|----------|-------------|
| 결과물 품질 | ? | ? |
| 컨텍스트 격리 효과 | ? | ? |
| 사용 편의성 | ? | ? |
| 실행 시간 / 비용 | ? | ? |

---

## 컨벤션 설정

컨벤션 문서를 하드코딩하지 않고 설정으로 관리. 누락 방지 + 프로젝트별 유연성.

```markdown
# harness-config.md (또는 JSON)

## 컨벤션 문서
- conventions/code-principles.md
- conventions/folder-structure.md
- conventions/api-layer.md
- conventions/coding-style.md

## Static Gate 명령
- tsc --noEmit
- biome check
- harness-check.sh
```

- 컨벤션이 추가/제거되면 설정만 변경
- 프로젝트마다 다른 컨벤션 세트 가능
- Generator, Evaluator 모두 이 설정을 읽고 해당 문서를 참조

---

## 평가 체계: 통과 판정 + 품질 점수

### Sprint 통과 판정

두 조건 모두 충족해야 통과:

```
Sprint 통과 = Contract 전부 pass AND 품질 점수 ≥ 임계값
```

- Contract 하나라도 fail → 재시도
- Contract 전부 pass인데 품질 점수 미달 → 열린 평가/Contrarian 피드백 반영 재시도
- 둘 다 충족 → Sprint 통과

임계값: 써보고 결정 (8.0/10 기준으로 시작)

### 품질 점수 (보고서/추적용)

통과 판정과 별개로 품질을 정량화. summary, cc-monitor 연동, 하네스 간 비교에 활용.

```
품질 점수 = (Contract 통과율 × 0.6) + (열린 평가 × 0.3) + (Contrarian × 0.1)
```

| 영역 | 가중치 | 산출 방법 |
|------|--------|----------|
| A. Contract 기준 | 60% | pass 수 / 전체 기준 수 (예: 4/5 = 0.80) |
| B. 열린 평가 | 30% | 이슈 심각도 기반 (이슈 없음=1.0, 경미=0.85, 중간=0.7, 심각=0.5) |
| C. Contrarian | 10% | 약점 심각도 기반 (약점 없음=1.0, 경미=0.8, 중간=0.6) |

"통과는 했는데 품질 점수 6.5? 열린 평가에서 뭐가 걸렸지?" 같은 판단이 가능.

---

## 미정 사항 (써보고 결정)

- 점수 임계값: 고정 vs Sprint별
- 파일 생명주기: 완료 후 삭제 / summary만 보존 / 전부 보존
- 컨벤션 문서 수: 현재 5개, 유동적
- Hard cap 횟수: 구체적 숫자
- Contrarian 분리 시점: Evaluator 안에서 부족하면 별도 에이전트로
- cc-monitor 연동 방식
