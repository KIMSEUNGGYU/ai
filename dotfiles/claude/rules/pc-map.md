# PC 폴더 지도

## 원칙
3폴더 체계: **work**(회사) + **dev**(개인) + **hq**(지식)

## 경로 규칙
- 회사 프로젝트 → `~/work/`
- 개인 프로젝트 → `~/dev/`
- 새 프로젝트 생성 시: 회사면 work, 그 외 전부 dev

### 지식 — hq (Obsidian, 세컨드 브레인)
- 일일 리캡 → `~/hq/00_daily/`
- 프로젝트별 축적 지식 → `~/hq/10_projects/{프로젝트명}/`
- 나에 대한 전역 지식 → `~/hq/20_me/` (core.md, now.md)
- 학습/참고자료 → `~/hq/30_learn/`
- 완료/비활성 → `~/hq/90_archive/`
- 프로젝트 작업 상태(active, specs) → 해당 프로젝트의 `.ai/`

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
