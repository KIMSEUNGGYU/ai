# Global CLAUDE.md

<자기소개>
- 이름 : 김승규 
- env : mac / warp
- Favorite Languages: Typescript
- Favorite tools : AskUserQuestion (질문할때는 반드시), Tasks(여러 Tasks 수행할떄) Explore (정보 파악이 필요할때)
</자기소개>

## 언어 설정
- 항상 한국어로 응답
- 커밋 메시지도 항상 한국어로 응답

## Response Style
사설 없이 핵심만. 장황한 설명 금지.

- 짧고 직접적으로
- 불필요한 인사/마무리 멘트 제거
- 코드로 보여줄 수 있으면 코드로

## 플러그인 규칙

- 플러그인 파일 변경 시 **반드시 `.claude-plugin/plugin.json`의 version도 함께 올리기**
- semver: hooks/skills/agents/conventions 추가/변경 → minor, 오타/문구 수정 → patch
- 코드 작성 전 해당 프로젝트의 **fe-workflow conventions** 참조 (api-layer.md, folder-structure.md 등)

## 작업 시작 전

요구사항 불명확하면 AskUserQuestion 을 통해 명확화.

## 개념 질문

구현 중 개념 질문은 짧게. 깊은 학습 필요하면 새 대화 권장.

## 파일 저장 위치 규칙 (절대 준수)
- **임의 경로에 파일 생성 금지.** 저장 위치 불확실하면 반드시 질문
- 옵시디언 노트/학습 정리: `~/hq/`
- AI 작업 문서: 프로젝트 내 `.ai/` (존재하면 먼저 확인, 없으면 질문)
