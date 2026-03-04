# cc-monitor API 스펙

## Base URL
`http://localhost:3000/api`

## Endpoints

### POST /api/events
이벤트 수신 (Claude Code hook에서 호출)

**Request Body** (Claude Code hook stdin JSON):
```json
{
  "session_id": "abc-123",
  "hook_event_name": "PostToolUse",
  "cwd": "/Users/gyu/project",
  "tool_name": "Bash",
  "tool_input": { "command": "pnpm test" }
}
```

**Headers**:
- `X-CC-User`: 사용자 식별 (hostname:username)

**Response**: `200 { ok: true }`

---

### GET /api/sessions
활성 세션 목록

**Query Params**:
- `status`: `active` | `ended` | `all` (기본: `active`)

**Response**:
```json
{
  "sessions": [
    {
      "session_id": "abc-123",
      "user_id": "gyu@macbook",
      "project_path": "/Users/gyu/project",
      "model": "sonnet",
      "started_at": "2026-03-04T10:00:00Z",
      "event_count": 142,
      "tool_count": 89,
      "status": "active"
    }
  ]
}
```

---

### GET /api/analytics
통계 데이터

**Query Params**:
- `hours`: 조회 기간 (기본: 24)

**Response**:
```json
{
  "tools": [
    { "tool_name": "Bash", "count": 234, "percentage": 32 },
    { "tool_name": "Read", "count": 178, "percentage": 24 }
  ],
  "hourly": [
    { "hour": 9, "count": 45 },
    { "hour": 10, "count": 67 }
  ],
  "users": [
    { "user_id": "gyu@macbook", "active_sessions": 2, "total_events": 529, "last_activity": "2026-03-04T14:30:00Z" }
  ]
}
```

---

### GET /api/feed
최근 활동 피드

**Query Params**:
- `limit`: 건수 (기본: 50)
- `since`: ISO timestamp (polling용, 이후 이벤트만)

**Response**:
```json
{
  "events": [
    {
      "id": 1234,
      "session_id": "abc-123",
      "event_type": "PostToolUse",
      "user_id": "gyu@macbook",
      "tool_name": "Bash",
      "tool_input_summary": "pnpm test",
      "timestamp": "2026-03-04T14:29:45Z"
    }
  ]
}
```
