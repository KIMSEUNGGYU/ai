# dotfiles

`.claude/`와 `.openclaw/` 설정을 `ai/` repo에서 중앙 관리.
심링크로 실제 경로에 연결.

## 구조

```
dotfiles/
├── claude/          # ~/.claude/ 설정
│   ├── CLAUDE.md
│   ├── rules/
│   ├── skills/
│   ├── hooks/
│   ├── commands/
│   └── keybindings.json
├── openclaw/        # ~/.openclaw/ 워크스페이스
│   ├── workspace/
│   ├── workspace-brief/
│   ├── workspace-docs/
│   └── workspace-work/
├── setup.sh         # 심링크 자동 설정 스크립트
└── README.md
```

## 새 PC 세팅

```bash
# 1. repo clone
git clone https://github.com/KIMSEUNGGYU/ai.git ~/dev/ai
cd ~/dev/ai && pnpm install

# 2. 심링크 설정
./dotfiles/setup.sh

# 3. PC별 수동 설정
#    - ~/.claude/mcp.json
#    - ~/.claude/settings.json
#    - ~/.openclaw/openclaw.json
#    - ~/.openclaw/.env
#    - ~/.openclaw/credentials/
```

## 심링크 목록

| 심링크 경로 | → 실제 파일 |
|------------|------------|
| `~/.claude/rules/` | `ai/dotfiles/claude/rules/` |
| `~/.claude/skills/` | `ai/dotfiles/claude/skills/` |
| `~/.claude/hooks/` | `ai/dotfiles/claude/hooks/` |
| `~/.claude/commands/` | `ai/dotfiles/claude/commands/` |
| `~/.claude/CLAUDE.md` | `ai/dotfiles/claude/CLAUDE.md` |
| `~/.claude/keybindings.json` | `ai/dotfiles/claude/keybindings.json` |
| `~/.openclaw/workspace/` | `ai/dotfiles/openclaw/workspace/` |
| `~/.openclaw/workspace-brief/` | `ai/dotfiles/openclaw/workspace-brief/` |
| `~/.openclaw/workspace-docs/` | `ai/dotfiles/openclaw/workspace-docs/` |
| `~/.openclaw/workspace-work/` | `ai/dotfiles/openclaw/workspace-work/` |
