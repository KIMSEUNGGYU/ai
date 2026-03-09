#!/bin/bash
# PreToolUse: git commit / gh pr create 시 Claude attribution 차단

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)

# Bash 명령만 검사
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# git commit 또는 gh pr 명령이 아니면 패스
if ! echo "$COMMAND" | grep -qE 'git commit|gh pr create|gh pr edit'; then
  exit 0
fi

# Claude attribution 패턴 차단
if echo "$COMMAND" | grep -qiE 'Co-Authored-By.*Claude|Generated with.*Claude|🤖'; then
  echo "BLOCKED: Claude attribution 포함 금지. Co-Authored-By, Generated with, 🤖 제거 후 재시도." >&2
  exit 2
fi

exit 0
