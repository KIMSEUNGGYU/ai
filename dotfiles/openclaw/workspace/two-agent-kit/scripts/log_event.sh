#!/usr/bin/env bash
set -euo pipefail
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AGENT=${1:-unknown}
EVENT=${2:-event}
NOTE=${3:-""}
printf '{"ts":"%s","agent":"%s","event":"%s","note":"%s"}\n' "$TS" "$AGENT" "$EVENT" "$NOTE" >> "$(dirname "$0")/../runtime/events.jsonl"
echo "logged: $AGENT $EVENT"
