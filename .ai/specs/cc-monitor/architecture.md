# cc-monitor 아키텍처

## 아키텍처 다이어그램

```
[Claude Code] --hook(command)--> [send-event.ts] --HTTP POST--> [Next.js API] --> [SQLite]
                                                                      |
                                                               [Dashboard Pages]
```

## 기술 선택 및 근거

### 서버: Next.js (Pages Router)
- **선택 이유**: FE 개발자로서 익숙, API Routes + 페이지를 한 프로젝트에서 관리
- **대안**: Hono (경량 but FE 별도 필요), Express (레거시 느낌)
- **Pages Router 이유**: App Router보다 직관적, API Routes 패턴이 단순

### 저장소: SQLite (better-sqlite3)
- **선택 이유**: 파일 1개로 배포 끝, WAL 모드로 동시 읽기/쓰기, 설치 간단
- **대안**: PostgreSQL (과도), JSON 파일 (쿼리 불편)
- **마이그레이션 경로**: 필요 시 Drizzle ORM으로 PostgreSQL 전환

### 수집: Claude Code command hooks
- **선택 이유**: Claude Code가 네이티브로 지원하는 유일한 방식
- **동작**: hook 트리거 → stdin JSON → `send-event.ts` → HTTP POST
- **대안**: zeude 방식 (OTEL + ClickHouse) — 과도하게 복잡

### 대시보드: SSR + Polling
- **선택 이유**: getServerSideProps로 초기 데이터 로드 + 클라이언트 polling으로 갱신
- **대안**: WebSocket (복잡도 증가), SSE (Phase 2에서 고려)

## 레퍼런스
- [zeude](https://github.com/zep-us/zeude) — 엔터프라이즈급, 3계층 (Sensing/Delivery/Guidance)
- [disler/claude-code-hooks-multi-agent-observability](https://github.com/disler/claude-code-hooks-multi-agent-observability) — hook 수집 구현
- 이미지 레퍼런스: Active Sessions + Activity Feed + Analytics 대시보드
