# PC 폴더 지도

## 원칙
3폴더 체계: **work**(회사) + **dev**(개인) + **hq**(지식)

## 경로 규칙
- 회사 프로젝트 → `~/work/`
- 개인 프로젝트 → `~/dev/`
- 새 프로젝트 생성 시: 회사면 work, 그 외 전부 dev

### 지식 (Obsidian)
- 학습 노트/TIL → `~/hq/00_Inbox/`
- 프로젝트 작업 문서 → 해당 프로젝트의 `.ai/`
- 아이디어 → `~/hq/05_Ideas/`
- TODO → `~/hq/01_TODO/`
- 업무 관련 → `~/hq/10_Work/`
- 프로젝트 기록 → `~/hq/15_Projects/`
- 학습 정리 → `~/hq/20_Learn/`
- 커리어 → `~/hq/30_Career/`
- 시스템/설정 → `~/hq/40_System/`
- 회고 → `~/hq/회고/`

## 플러그인 소스 매핑

**절대 `~/.claude/plugins/cache/`를 직접 수정하지 않는다.** 항상 소스 레포를 수정.

| 플러그인 | 소스 레포 | 성격 |
|---------|----------|------|
| `session-manager` | `~/dev/ai/plugins/session-manager/` | 개인 |
| `fe` (fe-workflow) | `~/dev/ai/plugins/fe-workflow/` | 개인 |
| `dev` (dev-workflow) | `~/dev/ai/plugins/dev-workflow/` | 개인 |
| `work-recap` | `~/work/claude-plugins-node-main/isc-sync/` | 회사 |

**플러그인 수정 워크플로우:**
1. 소스 레포에서 수정
2. `plugin.json` version 올리기
3. git commit + push
4. `claude plugin update`로 cache 갱신
