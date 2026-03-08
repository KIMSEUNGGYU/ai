#!/usr/bin/env bash
set -euo pipefail
TASK_ID=${1:-}
COMMIT=${2:-}
NEXT=${3:-}
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
python3 - <<PY
import json
p = '/Users/gyu/.openclaw/workspace/two-agent-kit/runtime/checkpoint.json'
with open(p) as f:
    d = json.load(f)
d['last_task_id'] = ${TASK_ID@Q} if ${TASK_ID@Q} else d.get('last_task_id')
d['last_commit'] = ${COMMIT@Q} if ${COMMIT@Q} else d.get('last_commit')
d['next_action'] = ${NEXT@Q} if ${NEXT@Q} else d.get('next_action')
d['updated_at'] = '$TS'
with open(p,'w') as f:
    json.dump(d,f,ensure_ascii=False,indent=2)
print('updated checkpoint')
PY
