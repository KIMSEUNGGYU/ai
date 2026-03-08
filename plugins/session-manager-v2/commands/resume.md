---
description: 특정 이전 세션을 수동으로 로드합니다. 기본적으로 이전 세션은 SessionStart 시 자동 주입되므로, N번째 전 세션이나 특정 날짜 세션을 불러올 때 사용하세요.
---

이전 세션 컨텍스트를 수동으로 로드합니다.

**Note**: v2에서는 SessionStart 시 이전 세션이 **자동으로** 주입됩니다.
이 커맨드는 특정 세션을 명시적으로 불러오거나, 세션 목록을 조회할 때 사용하세요.

## 사용법

인수 없이 실행하면 최근 세션 목록을 보여줍니다:

```bash
/resume
```

특정 세션 번호로 불러오기 (1 = 가장 최근):

```bash
/resume 2   # 2번째 전 세션
/resume 5   # 5번째 전 세션
```

---

다음 작업을 수행하세요:

1. 아래 셸 명령으로 현재 프로젝트의 세션 목록을 조회하세요:

```bash
node -e "
import { readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const projectKey = process.cwd().replace(/\//g, '-');
const dir = join(homedir(), '.claude', 'projects', projectKey);

async function getFirstUserMsg(jsonlPath) {
  const rl = createInterface({ input: createReadStream(jsonlPath, { encoding: 'utf-8' }) });
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'user' && typeof obj.message?.content === 'string') {
        rl.close();
        const text = obj.message.content.trim();
        return text.length > 60 ? text.slice(0, 60) + '…' : text;
      }
    } catch {}
  }
  return '(메시지 없음)';
}

const entries = await readdir(dir);
const files = entries.filter(e => e.endsWith('.jsonl'));
const withStat = await Promise.all(files.map(async name => {
  const p = join(dir, name);
  const s = await stat(p);
  return { name, path: p, mtime: s.mtimeMs };
}));
withStat.sort((a, b) => b.mtime - a.mtime);

for (let i = 0; i < Math.min(10, withStat.length); i++) {
  const { name, path, mtime } = withStat[i];
  const date = new Date(mtime).toLocaleString('ko-KR');
  const preview = await getFirstUserMsg(path);
  const id = basename(name, '.jsonl').slice(0, 8);
  console.log(\`[\${i+1}] \${date} | \${id}… | \${preview}\`);
}
" 2>/dev/null
```

2. $ARGUMENTS가 비어있으면 목록만 보여주고 종료하세요.

3. $ARGUMENTS에 숫자 N이 있으면 N번째 세션을 로드하세요:
   - 위 목록에서 N번째 파일의 sessionId 추출
   - `~/.claude/projects/{projectKey}/{sessionId}.jsonl` 읽기
   - `scripts/utils/jsonl-parser.mjs`의 `extractContext` 함수 사용해 앞 15 + 뒤 15 메시지 추출
   - 추출된 컨텍스트를 사용자에게 보여주고 "이 컨텍스트로 작업을 이어가겠습니다"라고 안내

4. 세션 로드 후 이전 작업 내용을 간략히 요약해 주세요.
