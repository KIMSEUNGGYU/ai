---
description: "일일 리캡 — 오늘 한 것 요약 + 세컨드 브레인 데이터 축적. 매일 오전 실행 권장. '어제 뭐 했지?', '하루 정리', '일일 회고', '리캡', 'recap' 등으로도 트리거."
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
argument-description: '[YYYY-MM-DD] 분석할 날짜 (기본: 어제)'
---


# /recap — 일일 리캡 + 세컨드 브레인

## 목적

1. **사람용**: 어제(또는 지정일) 뭘 했는지 요약
2. **AI용**: 세컨드 브레인 구축 — 판단 패턴, 사고 흐름, 관심사 축적
3. **학습용**: 배운 것 / 몰랐던 것 추출
4. **이력서용**: 이력서에 쓸만한 성과 탐지

## 실행 순서

### Phase 1: 날짜 결정

- 인자가 있으면 해당 날짜 사용
- 없으면 어제 날짜 사용 (`date -v-1d +%Y-%m-%d`)
- 이미 `~/hq/00_daily/{date}/recap.md`가 존재하면 덮어쓸지 확인

### Phase 2: Transcript 추출

스크립트를 실행하여 대상 날짜의 대화 데이터를 추출한다.

```bash
node scripts/extract-transcripts.mjs {YYYY-MM-DD}
```

추출된 transcript를 변수에 저장해둔다 (Phase 4에서 각 agent에 전달).

### Phase 3: 과거 Recap 로드

최근 7일간의 recap 파일을 읽는다:

```bash
ls -dt ~/hq/00_daily/*/recap.md 2>/dev/null | head -7
```

파일이 있으면 Read로 읽어서 **반복 주제, 이전 미해결 항목**을 파악한다.

### Phase 4: 분석 — 3개 Agent 병렬 실행

추출된 transcript를 3개 agent에 **동시에** 전달한다. 반드시 병렬로 실행할 것.

#### Agent 1: daily-recap

- transcript + 과거 7일 recap을 전달
- "오늘 한 것, 판단 기록, 관심사, 미해결 과제"를 정리
- 과거 recap의 미해결 중 해결된 것이 있으면 표시

#### Agent 2: learning-extractor

- transcript를 전달
- "기술적 학습, 도메인 학습, 실수에서 배운 것, 재확인한 것"을 추출
- **파일 저장하지 않고 결과만 반환하도록 지시**

#### Agent 3: resume-detector

- transcript를 전달
- "이력서에 쓸만한 성과"를 상/중/하 등급으로 탐지
- 현재 이력서 내용도 함께 전달하면 대조 가능 (선택)
- **파일 저장하지 않고 결과만 반환하도록 지시**

### Phase 5: 저장 — 파일 분리

각 agent의 결과를 **별도 파일**로 저장한다. agent 결과를 요약/축소하지 않고 그대로 저장.

```
~/hq/00_daily/{date}/
├── recap.md       ← daily-recap 결과
├── learning.md    ← learning-extractor 결과
└── resume.md      ← resume-detector 결과
```

각 파일의 frontmatter:

```markdown
---
date: {YYYY-MM-DD}
type: {recap | learning | resume}
projects: [{프로젝트 목록}]
tags: [recap]
---
```

**중요**: learning과 resume 파일은 내용이 없을 수 있음 (루틴 작업만 한 날). 내용이 없으면 파일을 생성하지 않는다.

### Phase 6: 완료 보고

저장된 파일 경로와 핵심 통계를 보고한다:

- 분석한 세션 수
- 추출한 판단 기록 수
- 새로 배운 것 수 (learning-extractor)
- 이력서 성과 탐지 수 (resume-detector) — 있으면 상/중/하 개수
- 새로 발견된 미해결 항목
- 과거 대비 해결된 항목 (있으면)
