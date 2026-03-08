#!/bin/bash
# PostToolUse Hook: 코드 수정 후 힌트 (stderr 출력)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

  if [[ "$FILE" == *.ts ]] || [[ "$FILE" == *.tsx ]]; then
    echo "typecheck 권장: pnpm typecheck" >&2
    exit 0
  fi
fi

exit 0
