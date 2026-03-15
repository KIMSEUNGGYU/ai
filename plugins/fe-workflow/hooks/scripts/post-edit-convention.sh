#!/bin/bash
# PostToolUse: 파일 수정 후 관련 컨벤션 위반 체크 리마인더

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

CONVENTION_TYPE=""
CONVENTION_FILE=""

if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

  if [[ "$FILE" == *.tsx ]]; then
    CONVENTION_TYPE="tsx"
    CONVENTION_FILE="coding-style.md"
    echo "TSX 컨벤션 체크: useEffect 익명 금지, useSuspenseQuery+Suspense, mutateAsync+try-catch, 커스텀훅 return 5개↑ 추상화 의심, A-B-A-B 분산 주의" >&2
  elif [[ "$FILE" == *remote* ]] || [[ "$FILE" == *mutation* ]] || [[ "$FILE" == *query* ]] || [[ "$FILE" == *dto* ]]; then
    CONVENTION_TYPE="api-layer"
    CONVENTION_FILE="api-layer.md"
    echo "API 레이어 체크: *Params 객체 타입, Remote=httpClient만, DTO=도메인별 단일 파일 interface, Mutation=onSuccess invalidateQueries, Query=queryOptions+useSuspenseQuery" >&2
  elif [[ "$FILE" == *.ts ]]; then
    CONVENTION_TYPE="ts"
    CONVENTION_FILE="coding-style.md"
    echo "TS 컨벤션 체크: 객체→interface 유니온→type, any 금지, 파일 위치(Page First 지역성)" >&2
  fi

  # ── 로깅 + cc-monitor 전송 ──
  if [ -n "$CONVENTION_TYPE" ]; then
    LOG_DIR="${HOME}/.claude/logs"
    mkdir -p "$LOG_DIR"
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] POST-EDIT: ${CONVENTION_FILE} (${CONVENTION_TYPE}) | file: ${FILE}" >> "$LOG_DIR/fe-hook.log"

    if [ -n "$SESSION_ID" ]; then
      CC_MONITOR_URL="${CC_MONITOR_URL:-https://cc-monitor.vercel.app}"
      CONV_BYTES=0
      if [ -n "$CONVENTION_FILE" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/conventions/${CONVENTION_FILE}" ]; then
        CONV_BYTES=$(wc -c < "${CLAUDE_PLUGIN_ROOT}/conventions/${CONVENTION_FILE}")
      fi
      curl -s -X POST "${CC_MONITOR_URL}/api/events" \
        -H "Content-Type: application/json" \
        -H "X-CC-User: $(whoami)" \
        --max-time 3 \
        -d "{
          \"session_id\": \"${SESSION_ID}\",
          \"hook_event_name\": \"PluginHook\",
          \"cwd\": \"${CWD}\",
          \"plugin_name\": \"fe-workflow\",
          \"hook_name\": \"post-edit-convention\",
          \"injected_conventions\": [\"${CONVENTION_FILE}\"],
          \"injection_bytes\": [${CONV_BYTES}],
          \"injection_total_bytes\": ${CONV_BYTES},
          \"matched_keywords\": [\"${CONVENTION_TYPE}\"],
          \"target_file\": \"${FILE}\"
        }" >/dev/null 2>&1 &
    fi
  fi
fi

exit 0
