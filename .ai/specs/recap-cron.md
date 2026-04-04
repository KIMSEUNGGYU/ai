---
title: recap 자동 실행 (launchd cron)
date: 2026-04-04
status: in-progress
---

# recap 자동 실행

## 목적
매일 아침 `/recap`을 자동 실행하여 전날 작업 회고를 `~/hq/00_daily/`에 저장.

## 구조

```
launchd (매일 09:00) → recap-cron.sh → claude -p "/recap" → ~/hq/00_daily/{날짜}/
```

## 파일 구성

| 파일 | 경로 | 역할 |
|------|------|------|
| wrapper 스크립트 | `~/dev/ai/scripts/recap-cron.sh` | claude 실행 + 로그 |
| launchd plist | `~/Library/LaunchAgents/com.gyu.recap.plist` | 매일 09:00 트리거 |

## wrapper 스크립트 (`recap-cron.sh`)

- working directory: `~/dev/ai`
- 실행: `claude -p "/recap"`
- 로그: stdout/stderr → `/tmp/recap-cron.log` (덮어쓰기, 최근 1회분만 유지)

## launchd 설정

- Label: `com.gyu.recap`
- 실행 시간: 매일 09:00
- sleep 복귀 시 밀린 스케줄 자동 실행 (launchd 기본 동작)

## 실패 처리

- 별도 알림 없음
- `/tmp/recap-cron.log`에 에러 기록
- `~/hq/00_daily/{날짜}/recap.md` 없으면 수동 `/recap` 실행

## 전제 조건

- `claude` CLI가 PATH에 있고 인증된 상태
- Node.js 설치 (recap 스킬의 extract-transcripts.mjs 실행용)
