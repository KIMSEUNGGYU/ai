# session-manager-v2

자동 세션 컨텍스트 복원 — JSONL 기반, 수동 저장 불필요

## 핵심 개선

| 항목 | v1 | v2 |
|------|----|----|
| 저장 방식 | `/save` 수동 | JSONL 자동 (저장 불필요) |
| 복원 방식 | `current.md` 읽기 | JSONL 앞+뒤 파싱 |
| 핵심 파일 | `.ai/current.md` | `.ai/last-session-id` (UUID 1줄) |
| `/save` | 필수 | 제거됨 |
| `/resume` | current.md 로드 | 특정 세션 수동 선택 |

## 동작 원리

```
세션 종료 시 (SessionEnd):
  ~/.claude/projects/{key}/ 에서 최신 .jsonl 파일명 → sessionId
  → {cwd}/.ai/last-session-id 저장

세션 시작 시 (SessionStart):
  last-session-id 읽기 → {sessionId}.jsonl 로드
  → 앞 15 + 뒤 15 메시지 추출
  → additionalContext로 자동 inject
```

## 파일 구조

```
session-manager-v2/
├── .claude-plugin/
│   └── plugin.json
├── hooks/
│   └── hooks.json
├── scripts/
│   ├── session-start.mjs     # SessionStart 훅
│   ├── session-end.mjs       # SessionEnd 훅
│   └── utils/
│       └── jsonl-parser.mjs  # JSONL 파싱 유틸
├── commands/
│   └── resume.md             # 수동 세션 선택
└── README.md
```

## 설치

```bash
# 플러그인 디렉토리에 심볼릭 링크 또는 복사
ln -s ~/gyu/ai-ax/session-manager-v2 ~/.claude/plugins/marketplaces/gyu-plugins/session-manager-v2
```

## 검증

```bash
# 1. session-end 단독 실행
cd ~/your-project
node ~/gyu/ai-ax/session-manager-v2/scripts/session-end.mjs
cat .ai/last-session-id

# 2. jsonl-parser 단독 테스트
node -e "
import { extractContext } from './scripts/utils/jsonl-parser.mjs';
const id = require('fs').readFileSync('.ai/last-session-id', 'utf-8').trim();
const path = \`\${process.env.HOME}/.claude/projects/\${process.cwd().replace(/\\//g,'-')}/\${id}.jsonl\`;
const ctx = await extractContext(path, 5);
console.log(ctx);
" --input-type=module

# 3. session-start 단독 실행
node ~/gyu/ai-ax/session-manager-v2/scripts/session-start.mjs
```
