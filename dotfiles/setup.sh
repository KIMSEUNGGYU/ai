#!/bin/bash
# agents dotfiles 동기화 스크립트
# 새 PC에서 실행: ~/dev/agents/dotfiles/setup.sh

set -e

AGENTS_DIR="$HOME/dev/agents"
DOTFILES_DIR="$AGENTS_DIR/dotfiles"

echo "=== agents dotfiles 동기화 ==="

# 1. agents repo 확인
if [ ! -d "$AGENTS_DIR" ]; then
  echo "❌ $AGENTS_DIR 가 없습니다. 먼저 clone 하세요:"
  echo "   git clone https://github.com/KIMSEUNGGYU/agents.git ~/dev/agents"
  exit 1
fi

# 2. .claude/ 심링크
echo ""
echo "--- .claude/ 심링크 설정 ---"
CLAUDE_DIR="$HOME/.claude"
CLAUDE_DOTFILES="$DOTFILES_DIR/claude"

if [ ! -d "$CLAUDE_DIR" ]; then
  echo "❌ $CLAUDE_DIR 가 없습니다. Claude Code를 먼저 설치하세요."
  exit 1
fi

CLAUDE_TARGETS=("rules" "skills" "hooks" "commands" "CLAUDE.md" "keybindings.json")

for target in "${CLAUDE_TARGETS[@]}"; do
  src="$CLAUDE_DOTFILES/$target"
  dst="$CLAUDE_DIR/$target"

  if [ ! -e "$src" ]; then
    echo "⚠️  소스 없음: $src (스킵)"
    continue
  fi

  if [ -L "$dst" ]; then
    echo "✅ 이미 심링크: $dst"
    continue
  fi

  if [ -e "$dst" ]; then
    backup="$dst.bak.$(date +%Y%m%d%H%M%S)"
    echo "📦 기존 백업: $dst → $backup"
    mv "$dst" "$backup"
  fi

  ln -s "$src" "$dst"
  echo "🔗 심링크 생성: $dst → $src"
done

# 3. .openclaw/ 심링크
echo ""
echo "--- .openclaw/ 심링크 설정 ---"
OPENCLAW_DIR="$HOME/.openclaw"
OPENCLAW_DOTFILES="$DOTFILES_DIR/openclaw"

if [ ! -d "$OPENCLAW_DIR" ]; then
  echo "⚠️  $OPENCLAW_DIR 가 없습니다. OpenClaw 설치 후 다시 실행하세요."
else
  OPENCLAW_TARGETS=("workspace" "workspace-brief" "workspace-docs" "workspace-work")

  for target in "${OPENCLAW_TARGETS[@]}"; do
    src="$OPENCLAW_DOTFILES/$target"
    dst="$OPENCLAW_DIR/$target"

    if [ ! -e "$src" ]; then
      echo "⚠️  소스 없음: $src (스킵)"
      continue
    fi

    if [ -L "$dst" ]; then
      echo "✅ 이미 심링크: $dst"
      continue
    fi

    if [ -e "$dst" ]; then
      backup="$dst.bak.$(date +%Y%m%d%H%M%S)"
      echo "📦 기존 백업: $dst → $backup"
      mv "$dst" "$backup"
    fi

    ln -s "$src" "$dst"
    echo "🔗 심링크 생성: $dst → $src"
  done
fi

# 4. 플러그인 안내
echo ""
echo "--- 플러그인 설치 ---"
echo "아래 명령어를 수동으로 실행하세요:"
echo "  claude plugin install session-manager@gyu-plugins"
echo ""
echo "마켓플레이스가 없으면 먼저 등록:"
echo "  claude marketplace add https://github.com/KIMSEUNGGYU/agents.git"

# 5. 완료
echo ""
echo "=== 동기화 완료 ==="
echo ""
echo "⚠️  아래 파일은 PC별로 직접 설정 필요:"
echo "  - ~/.claude/mcp.json (MCP 서버 경로)"
echo "  - ~/.claude/settings.json"
echo "  - ~/.openclaw/openclaw.json (에이전트 경로)"
echo "  - ~/.openclaw/.env"
echo "  - ~/.openclaw/credentials/"
