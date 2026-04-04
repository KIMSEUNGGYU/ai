# recap 자동 실행 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 매일 오전 9시 launchd로 `/recap`을 자동 실행하여 전날 회고를 저장

**Architecture:** launchd가 wrapper 스크립트를 트리거 → wrapper가 `claude -p "/recap"` 실행 → recap 스킬이 transcript 추출 + 에이전트 실행 + 파일 저장

**Tech Stack:** macOS launchd, bash, Claude Code CLI

---

### Task 1: wrapper 스크립트 작성

**Files:**
- Create: `~/dev/ai/scripts/recap-cron.sh`

- [ ] **Step 1: claude CLI 경로 확인**

Run: `which claude`

이 경로를 wrapper 스크립트에서 사용.

- [ ] **Step 2: wrapper 스크립트 생성**

```bash
#!/bin/bash
# recap-cron.sh — launchd에서 매일 실행

LOG="/tmp/recap-cron.log"
echo "=== recap started: $(date) ===" > "$LOG"

cd "$HOME/dev/ai" || exit 1

# claude CLI 실행 (PATH에 없을 수 있으므로 절대경로)
CLAUDE_PATH="<which claude 결과>"
"$CLAUDE_PATH" -p "/recap" >> "$LOG" 2>&1

echo "=== recap finished: $(date) ===" >> "$LOG"
```

- [ ] **Step 3: 실행 권한 부여**

Run: `chmod +x ~/dev/ai/scripts/recap-cron.sh`

- [ ] **Step 4: 수동 실행으로 동작 확인**

Run: `~/dev/ai/scripts/recap-cron.sh`

확인: `/tmp/recap-cron.log`에 로그 기록 + `~/hq/00_daily/{어제날짜}/recap.md` 생성

- [ ] **Step 5: 커밋**

```bash
git add scripts/recap-cron.sh
git commit -m "feat: recap 자동 실행 wrapper 스크립트 추가"
```

---

### Task 2: launchd plist 등록

**Files:**
- Create: `~/Library/LaunchAgents/com.gyu.recap.plist`

- [ ] **Step 1: plist 파일 생성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gyu.recap</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/isc010252/dev/ai/scripts/recap-cron.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>3</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/recap-launchd-out.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/recap-launchd-err.log</string>
</dict>
</plist>
```

Note: Minute을 3으로 설정 (정각 회피, API 부하 분산)

- [ ] **Step 2: plist 로드**

Run: `launchctl load ~/Library/LaunchAgents/com.gyu.recap.plist`

- [ ] **Step 3: 등록 확인**

Run: `launchctl list | grep com.gyu.recap`

Expected: `com.gyu.recap` 항목이 표시됨

---

### Task 3: 동작 검증

- [ ] **Step 1: 즉시 실행 테스트**

Run: `launchctl start com.gyu.recap`

확인사항:
- `/tmp/recap-cron.log`에 실행 로그
- `/tmp/recap-launchd-out.log`, `/tmp/recap-launchd-err.log` 확인
- `~/hq/00_daily/{어제날짜}/recap.md` 생성 여부

- [ ] **Step 2: 문제 있으면 로그 확인 후 수정**

```bash
cat /tmp/recap-cron.log
cat /tmp/recap-launchd-err.log
```

---

### 관리 참고

**중지**: `launchctl unload ~/Library/LaunchAgents/com.gyu.recap.plist`
**재시작**: unload → load
**시간 변경**: plist의 Hour/Minute 수정 후 재시작
**삭제**: unload + plist 파일 삭제
