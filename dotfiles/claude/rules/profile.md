# 사용자 판단 프로파일

> AI가 사용자의 판단 패턴을 학습하여 더 나은 제안을 하기 위한 원칙 모음.

## 핵심 원칙

1. 정보 배치는 '코딩 중 접근성' 기준으로 결정한다
2. convention으로 해결 가능한 것은 별도 파일/메모리가 아닌 convention에 넣는다
3. 파일/디렉토리 생성 전 기존 구조와 겹침 여부를 먼저 확인한다
4. 콘텐츠의 프로젝트 특화 여부를 분석한 뒤 배치를 결정한다
5. 다른 시스템이 관리하는 영역을 임의로 수정하지 않는다

## 근거 패턴

### 1. 코딩 중 접근성 기준
- hq(Obsidian) 이동 거부 → fe plugin 유지, 프로젝트 특화 내용은 프로젝트 .ai/로 <!-- pattern: 2026-03-15, task: patterns-conventions 정리 -->

### 2. convention 우선
- 메모리 저장 대신 convention 활용 지시, 관리 포인트 최소화 원칙과 일맥 <!-- pattern: 2026-03-15, task: patterns-conventions 정리 -->

### 3. 기존 구조 겹침 확인
- .ai/projects 제안 시 specs 겹침 지적, references/ 생성 후 번복 <!-- pattern: 2026-03-15, task: patterns-conventions 정리 -->

### 4. 프로젝트 특화 분석
- 6개 파일 일괄 이동 후 4개가 프로젝트 특화임을 뒤늦게 발견 <!-- pattern: 2026-03-15, task: patterns-conventions 정리 -->

### 5. 시스템 관할 존중
- active 파일 삭제 제안 시 session-manager 관할임을 교정 <!-- pattern: 2026-03-15, task: patterns-conventions 정리 -->
