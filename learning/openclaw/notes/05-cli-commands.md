# OpenClaw CLI 명령어 정리

## Gateway 관리

```bash
openclaw gateway              # Gateway 시작
openclaw gateway stop         # Gateway 중지
openclaw gateway --force      # 포트 충돌 시 강제 시작
openclaw gateway --port 19001 # 다른 포트로 시작
openclaw --dev gateway        # 개발 모드 (격리된 상태)
openclaw health               # Gateway 상태 확인
openclaw status               # 채널 상태 + 최근 세션
```

## 설정

```bash
openclaw configure            # 대화형 설정 마법사
openclaw config get <path>    # 설정값 조회 (예: agents.defaults.model.primary)
openclaw config set <path> <value>  # 설정값 변경
openclaw config unset <path>  # 설정값 삭제
```

## 스킬

```bash
openclaw skills list          # 전체 스킬 목록 (ready/missing 표시)
openclaw skills check         # 스킬 요구사항 상태 점검
openclaw skills info <name>   # 특정 스킬 상세 정보
```

## 채널 (Telegram 등)

```bash
openclaw channels --help      # 채널 관련 명령어
openclaw channels login       # 채널 로그인/연결
```

## 메시지

```bash
openclaw message send --channel telegram --target @chat --message "내용"
openclaw agent --to <target> --message "내용"  # 에이전트로 직접 대화
```

## Cron (자동 실행)

```bash
openclaw cron --help          # cron 관련 명령어
```

## 메모리

```bash
openclaw memory --help        # 메모리 검색/리인덱스
```

## 로그/디버깅

```bash
openclaw logs                 # Gateway 로그 tail
openclaw doctor               # 건강 체크 + 자동 수정
openclaw --log-level debug gateway  # 디버그 모드로 시작
```

## 업데이트

```bash
openclaw update               # OpenClaw 업데이트
openclaw --version            # 현재 버전 확인
```

## 기타

```bash
openclaw dashboard            # Control UI 열기
openclaw tui                  # 터미널 UI
openclaw onboard              # 온보딩 마법사 (최초 설정)
openclaw reset                # 로컬 설정/상태 초기화
openclaw docs <keyword>       # 공식 문서 검색
```

## 환경변수 (.env)

파일 위치: `~/.openclaw/.env` (workspace가 아니라 루트)

```bash
# ~/.openclaw/.env
LINEAR_API_KEY=lin_api_xxx
# NOTION_API_KEY=ntn_xxx
```

- `.env`는 프로세스 환경변수가 없을 때만 적용 (override 아님)
- Gateway 재시작 후 반영
