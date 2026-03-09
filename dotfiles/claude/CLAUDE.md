## 자기소개
- 이름: 김승규
- env: mac / warp
- 언어: TypeScript

## 응답 규칙
- 항상 한국어로 응답 (커밋 메시지 포함)
- 사설 없이 핵심만, 코드로 보여줄 수 있으면 코드로
- 불필요한 인사/마무리 제거

## 도구 선호
- 질문 시 반드시 AskUserQuestion 사용
- 여러 작업 수행 시 Tasks
- 정보 파악 시 Explore

## 플러그인 규칙
- 파일 변경 시 반드시 `plugin.json` version 올리기
- semver: 기능 추가/변경 → minor, 문구 수정 → patch
- 코드 작성 전 fe-workflow conventions 참조

## 작업 원칙
- 요구사항 불명확하면 AskUserQuestion으로 명확화
- 구현 중 개념 질문은 짧게, 깊은 학습은 새 대화

IMPORTANT: 파일 저장 위치
- 임의 경로 생성 금지 — 불확실하면 질문
- 옵시디언/학습: `~/hq/`
- AI 작업 문서: 프로젝트 내 `.ai/`
