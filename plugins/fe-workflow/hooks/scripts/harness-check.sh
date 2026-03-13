#!/bin/bash
# PostToolUse 하네스: 파일 수정 후 컨벤션 위반을 기계적으로 검증
# 위반 발견 시 stderr로 구체적 에러 메시지 출력 → AI가 자동 수정

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" != "Edit" ] && [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# 새로 생성/수정된 파일만 검증
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

VIOLATIONS=""

# ── 1. 파일 경로 패턴 검증 ──

BASENAME=$(basename "$FILE")

# .schema.ts는 types/에만
if [[ "$BASENAME" == *.schema.ts ]] && [[ "$FILE" != */types/* ]]; then
  VIOLATIONS="${VIOLATIONS}\n❌ [harness] ${BASENAME}는 types/ 폴더에 위치해야 합니다. (현재: ${FILE})"
fi

# .dto.ts는 models/에만
if [[ "$BASENAME" == *.dto.ts ]] && [[ "$FILE" != */models/* ]]; then
  VIOLATIONS="${VIOLATIONS}\n❌ [harness] ${BASENAME}는 models/ 폴더에 위치해야 합니다. (현재: ${FILE})"
fi

# .query.ts는 queries/에만
if [[ "$BASENAME" == *.query.ts ]] && [[ "$FILE" != */queries/* ]]; then
  VIOLATIONS="${VIOLATIONS}\n❌ [harness] ${BASENAME}는 queries/ 폴더에 위치해야 합니다. (현재: ${FILE})"
fi

# .mutation.ts는 mutations/에만
if [[ "$BASENAME" == *.mutation.ts ]] && [[ "$FILE" != */mutations/* ]]; then
  VIOLATIONS="${VIOLATIONS}\n❌ [harness] ${BASENAME}는 mutations/ 폴더에 위치해야 합니다. (현재: ${FILE})"
fi

# ── 2. 코드 패턴 검증 (.ts, .tsx만) ──

if [[ "$FILE" == *.ts ]] || [[ "$FILE" == *.tsx ]]; then

  # inline 타입 금지 (.get<{, .post<{, .patch<{, .put<{, .delete<{)
  INLINE_TYPES=$(grep -n '\.get<{.*}\|\.post<{.*}\|\.patch<{.*}\|\.put<{.*}\|\.delete<{.*}' "$FILE" 2>/dev/null)
  if [ -n "$INLINE_TYPES" ]; then
    VIOLATIONS="${VIOLATIONS}\n❌ [harness] inline 타입 금지 — *Response 타입을 models/에 정의하세요:\n${INLINE_TYPES}"
  fi

  # useEffect 익명함수 금지
  ANON_EFFECT=$(grep -n 'useEffect(() =>\|useEffect(async () =>' "$FILE" 2>/dev/null)
  if [ -n "$ANON_EFFECT" ]; then
    VIOLATIONS="${VIOLATIONS}\n❌ [harness] useEffect는 기명함수 필수 — useEffect(function descriptiveName() { ... }):\n${ANON_EFFECT}"
  fi

  # console.log 금지
  CONSOLE_LOG=$(grep -n 'console\.log' "$FILE" 2>/dev/null)
  if [ -n "$CONSOLE_LOG" ]; then
    VIOLATIONS="${VIOLATIONS}\n❌ [harness] console.log 금지:\n${CONSOLE_LOG}"
  fi

  # enum 금지
  ENUM_USE=$(grep -n '^export enum \|^enum ' "$FILE" 2>/dev/null)
  if [ -n "$ENUM_USE" ]; then
    VIOLATIONS="${VIOLATIONS}\n❌ [harness] enum 금지 — as const 객체 또는 union type 사용:\n${ENUM_USE}"
  fi

  # any 타입 금지
  ANY_USE=$(grep -n ': any\b\|as any\b\|<any>' "$FILE" 2>/dev/null)
  if [ -n "$ANY_USE" ]; then
    VIOLATIONS="${VIOLATIONS}\n❌ [harness] any 타입 금지 — unknown 또는 구체적 타입 사용:\n${ANY_USE}"
  fi

fi

# ── 결과 출력 ──

if [ -n "$VIOLATIONS" ]; then
  echo -e "\n🔴 하네스 검증 실패 — 아래 위반사항을 수정하세요:${VIOLATIONS}" >&2
fi

exit 0
