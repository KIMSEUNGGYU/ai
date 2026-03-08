#!/bin/bash
# PreToolUse Hook: 위험 명령어 체크

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // {}')

# Bash 명령어 체크
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // empty')

  # 위험 패턴 체크
  if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+/|git\s+push.*--force|git\s+reset.*--hard'; then
    cat << EOF
{
  "decision": "block",
  "reason": "위험 명령어 감지: $COMMAND"
}
EOF
    exit 2
  fi
fi

# 기본: 허용
exit 0
