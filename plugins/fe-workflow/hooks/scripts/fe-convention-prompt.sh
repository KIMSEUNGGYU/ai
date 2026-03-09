#!/bin/bash
# UserPromptSubmit: 프롬프트 키워드 분석 → 관련 컨벤션 파일 선택적 주입
#
# 기존: 요약 bullet만 출력 → 에이전트가 인지만 하고 실제 적용 안 함
# 개선: 관련 컨벤션 파일 내용을 직접 주입 → Skill 호출 없이도 컨벤션 적용 가능

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
# fallback: jq 실패 시 stdin 전체를 prompt로
if [ -z "$PROMPT" ]; then
  PROMPT="$INPUT"
fi

CONV_DIR="${CLAUDE_PLUGIN_ROOT}/conventions"
INJECTED=()
MATCHED_KEYWORDS=()

# 키워드 → 컨벤션 파일 매핑 (최대 2개까지 주입)
inject_convention() {
  local file="$1"
  local label="$2"
  local keyword="$3"
  if [ ${#INJECTED[@]} -lt 2 ] && [ -f "$CONV_DIR/$file" ]; then
    INJECTED+=("$file")
    MATCHED_KEYWORDS+=("$keyword")
    echo ""
    echo "---"
    echo "## [AUTO-INJECTED] $label"
    echo "아래 컨벤션을 반드시 따라서 코드를 작성하세요."
    echo ""
    cat "$CONV_DIR/$file"
  fi
}

# 1. API/Remote/Query/Mutation 관련
if echo "$PROMPT" | grep -qiE 'remote|mutation|query|API|api|dto|DTO|fetch|httpClient|endpoint|useSuspense|invalidate|queryOptions|staleTime'; then
  inject_convention "api-layer.md" "API 계층 컨벤션" "api"
fi

# 2. 컴포넌트/훅/스타일 관련
if echo "$PROMPT" | grep -qiE 'component|컴포넌트|useEffect|useState|hook|훅|form|zod|handleSubmit|이벤트.*핸들|handler|네이밍|naming'; then
  inject_convention "coding-style.md" "코딩 스타일 컨벤션" "component"
fi

# 3. 리팩토링/코드 리뷰/구조 개선
if echo "$PROMPT" | grep -qiE '리팩토링|refactor|리뷰|review|추상화|분리|추출|extract|개선|정리|코드.*구조|중복'; then
  inject_convention "code-principles.md" "코드 원칙" "refactor"
fi

# 4. 폴더/파일 구조
if echo "$PROMPT" | grep -qiE '폴더|folder|구조|structure|파일.*생성|새.*파일|디렉토리|directory|models/|remotes/|mutations/|_common|modules/'; then
  inject_convention "folder-structure.md" "폴더 구조 컨벤션" "folder"
fi

# 5. 에러 처리
if echo "$PROMPT" | grep -qiE 'error|에러|예외|exception|ErrorBoundary|try.*catch|Suspense|AsyncBoundary'; then
  inject_convention "error-handling.md" "에러 핸들링 컨벤션" "error"
fi

# 매칭된 컨벤션이 없으면 기존 요약 출력 (일반적인 구현 키워드에 대한 fallback)
if [ ${#INJECTED[@]} -eq 0 ]; then
  echo 'FE 컨벤션 요약 (상세가 필요하면 ${CLAUDE_PLUGIN_ROOT}/conventions/ 파일을 직접 읽으세요)
[API] httpClient만, *Params 객체, DTO 도메인별 단일 파일
[Query] useSuspenseQuery + queryOptions 팩토리, staleTime 설정
[Mutation] mutateAsync+try-catch, onSuccess에서 invalidateQueries
[컴포넌트] useEffect 기명함수, 명령형 로딩 분기 금지
[폴더] Page First, 지역성 원칙, models/remotes/mutations 도메인 단위
[추상화] 2-3번 반복 전 이른 추출 금지, 분리!=추상화'
fi

# ── 로깅 + cc-monitor 전송 ──
LOG_DIR="${HOME}/.claude/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 로컬 로그
if [ ${#INJECTED[@]} -gt 0 ]; then
  echo "[$TIMESTAMP] INJECTED: ${INJECTED[*]} | keywords: ${MATCHED_KEYWORDS[*]}" >> "$LOG_DIR/fe-hook.log"
else
  echo "[$TIMESTAMP] FALLBACK (no match)" >> "$LOG_DIR/fe-hook.log"
fi

# cc-monitor 전송 (비동기, 실패해도 무시)
if [ -n "$SESSION_ID" ]; then
  CC_MONITOR_URL="${CC_MONITOR_URL:-https://cc-monitor.vercel.app}"
  INJECTED_JSON=$(printf '%s\n' "${INJECTED[@]}" | jq -R . | jq -s .)
  KEYWORDS_JSON=$(printf '%s\n' "${MATCHED_KEYWORDS[@]}" | jq -R . | jq -s .)

  curl -s -X POST "${CC_MONITOR_URL}/api/events" \
    -H "Content-Type: application/json" \
    -H "X-CC-User: $(whoami)" \
    --max-time 3 \
    -d "{
      \"session_id\": \"${SESSION_ID}\",
      \"hook_event_name\": \"PluginHook\",
      \"cwd\": \"${CWD}\",
      \"plugin_name\": \"fe-workflow\",
      \"hook_name\": \"fe-convention-prompt\",
      \"injected_conventions\": ${INJECTED_JSON},
      \"matched_keywords\": ${KEYWORDS_JSON}
    }" >/dev/null 2>&1 &
fi
