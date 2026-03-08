#!/bin/bash
# PostToolUse: 파일 수정 후 관련 컨벤션 위반 체크 리마인더

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then
  FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

  if [[ "$FILE" == *.tsx ]]; then
    echo "TSX 컨벤션 체크: useEffect 익명 금지, useSuspenseQuery+Suspense, mutateAsync+try-catch, 커스텀훅 return 5개↑ 추상화 의심, A-B-A-B 분산 주의" >&2
    exit 0
  fi

  if [[ "$FILE" == *remote* ]] || [[ "$FILE" == *mutation* ]] || [[ "$FILE" == *query* ]] || [[ "$FILE" == *dto* ]]; then
    echo "API 레이어 체크: *Params 객체 타입, Remote=httpClient만, DTO=도메인별 단일 파일 interface, Mutation=onSuccess invalidateQueries, Query=queryOptions+useSuspenseQuery" >&2
    exit 0
  fi

  if [[ "$FILE" == *.ts ]]; then
    echo "TS 컨벤션 체크: 객체→interface 유니온→type, any 금지, 파일 위치(Page First 지역성)" >&2
    exit 0
  fi
fi

exit 0
