# OpenClaw 도구(Tools) 시스템

## 스킬 vs 도구

| | 도구 (Tools) | 스킬 (Skills) |
|---|---|---|
| **정의** | 시스템 내장 기능 | 사용자 정의 마크다운 지침 |
| **호출** | 에이전트가 직접 호출 | description 매칭으로 자동 트리거 |
| **코드** | TypeScript로 구현됨 | 코드 없음 (마크다운) |
| **예시** | exec, read, write | weather, gh-issues |
| **제어** | allow/deny 정책 | 워크스페이스 skills/ 폴더 |

**핵심**: 스킬은 도구를 "어떻게 쓸지" 가르치는 가이드.
예: weather 스킬은 `exec` 도구로 `curl wttr.in/...` 을 실행하도록 지시.

## 내장 도구 그룹

### group:fs (파일시스템)
| 도구 | 설명 |
|------|------|
| `read` | 파일 읽기 (읽기 전용) |
| `write` | 파일 작성/덮어쓰기 |
| `edit` | 코드 편집 (정밀 수정) |
| `apply_patch` | 패치 적용 (실험적, OpenAI 전용) |

### group:runtime (실행)
| 도구 | 설명 |
|------|------|
| `exec` | 셸 명령 실행 (승인 프롬프트 지원) |
| `bash` | Bash 실행 |
| `process` | 백그라운드 프로세스 관리 |

### group:sessions (세션)
| 도구 | 설명 |
|------|------|
| `sessions_list` | 세션 목록 조회 |
| `sessions_history` | 대화 기록 조회 |
| `sessions_send` | 다른 세션에 메시지 전송 |
| `sessions_spawn` | 서브에이전트 생성 |
| `session_status` | 현재 세션 상태 조회 |

### group:memory (메모리)
| 도구 | 설명 |
|------|------|
| `memory_search` | 시맨틱 메모리 검색 |
| `memory_get` | 특정 메모리 파일 읽기 |

### group:web (웹)
| 도구 | 설명 |
|------|------|
| `web_search` | 웹 검색 |
| `web_fetch` | URL 콘텐츠 가져오기 |

### group:ui (UI)
| 도구 | 설명 |
|------|------|
| `browser` | Chrome 제어 (클릭, 폼, 스크린샷) |
| `canvas` | Canvas UI 파일 관리 |

### group:automation (자동화)
| 도구 | 설명 |
|------|------|
| `cron` | Gateway 크론 작업 관리 |
| `gateway` | Gateway 설정/상태 관리 |

### group:messaging (메시징)
| 도구 | 설명 |
|------|------|
| `message` | 채널로 메시지 전송 |

### group:nodes (노드)
| 도구 | 설명 |
|------|------|
| `nodes` | 연결된 디바이스(iOS/Android 등) 제어 |

## 도구 정책 (allow/deny)

계층 구조 (좁은 범위가 우선):
```
Profile → Global → Provider → Agent → Group → Sandbox → Subagent
```

설정 예시:
```json5
{
  tools: {
    allow: ["read", "exec", "memory_search"],
    deny: ["write", "browser"],
    elevated: { senders: ["+82..."] }  // 특정 사용자만 위험 도구 허용
  }
}
```

프로필 옵션:
- `minimal`: session_status만
- `coding`: 파일시스템 + 런타임 + 세션 + 메모리
- `messaging`: 메시지 + 세션 관리
- `full`: 제한 없음

**deny가 allow보다 우선** — 거부 규칙이 항상 승인 무효화

## 스킬이 도구를 사용하는 흐름

```
사용자: "오늘 날씨 알려줘"
    ↓
에이전트: description 매칭 → weather 스킬 트리거
    ↓
SKILL.md 본문 로드: "curl wttr.in/... 으로 날씨 조회"
    ↓
에이전트: exec 도구로 `curl "wttr.in/Seoul?format=3"` 실행
    ↓
결과를 사용자에게 응답
```

## 커스텀 도구 추가

내장 도구 외에 도구를 추가하려면:
1. **플러그인**: TypeScript로 도구 구현 (extensions/ 디렉토리)
2. **스킬로 우회**: exec 도구로 외부 CLI를 호출하도록 스킬에서 지시
   - 예: summarize 스킬 → `exec` 도구로 `summarize` CLI 호출
