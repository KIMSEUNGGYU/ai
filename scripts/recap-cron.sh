#!/bin/bash
# recap-cron.sh — launchd에서 매일 실행

LOG="/tmp/recap-cron.log"
echo "=== recap started: $(date) ===" > "$LOG"

cd "$HOME/dev/ai" || exit 1

CLAUDE_PATH="/Applications/cmux.app/Contents/Resources/bin/claude"
"$CLAUDE_PATH" -p "/recap" >> "$LOG" 2>&1

echo "=== recap finished: $(date) ===" >> "$LOG"
