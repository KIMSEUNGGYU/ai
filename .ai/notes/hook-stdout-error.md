# Claude Code PostToolUse Hook stdout 에러

> 날짜: 2026-03-06

## 요약
Claude Code v2.1.70에서 PostToolUse hook이 stdout에 출력하면 "hook error"로 표시되는 버그. stderr로 출력하면 해결.

## 원인
- Claude Code가 PostToolUse hook의 stdout 출력을 에러로 처리함
- `hookSpecificOutput` JSON을 stdout으로 내보내도 동일하게 에러 취급
- exit code 0이어도 stdout에 내용이 있으면 에러로 표시

## 증상
- `PostToolUse:Edit hook error` 메시지가 Edit/Write 할 때마다 출력
- 에러 개수 = stdout 출력하는 hook 개수와 일치

## 영향 받은 파일
- `~/.claude/hooks/post-edit.sh` — hookSpecificOutput JSON stdout 출력
- `~/dev/ai-ax/fe-workflow/hooks/scripts/post-edit-convention.sh` — 컨벤션 힌트 JSON stdout 출력

## 해결
stdout JSON → stderr 플레인 텍스트로 변경:

```bash
# Before (에러 발생)
cat << 'EOF'
{ "hookSpecificOutput": { "additionalContext": "..." } }
EOF

# After (정상)
echo "컨벤션 힌트 메시지" >&2
```

## 디버깅 방법
1. settings.json에서 PostToolUse hook matcher를 하나씩 비활성화
2. 플러그인 hook은 enabledPlugins 토글로는 안 됨 (세션 재시작 필요)
3. settings.json matcher 변경은 즉시 반영됨

## 관련
- `~/.claude/settings.json` (PostToolUse 섹션)
- `~/dev/ai-ax/fe-workflow/.claude-plugin/plugin.json` (v0.18.0→0.18.1)
- Claude Code 버그일 가능성 높음 — 향후 버전에서 수정되면 stdout 방식 복원 가능
