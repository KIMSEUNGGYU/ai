# OpenClaw AI 에이전트 프레임워크 학습

## 스펙
- OpenClaw 프레임워크로 실전 에이전트 구축
- 설치 → 스킬 시스템 이해 → 커스텀 에이전트 구축

## 학습 계획

### Phase 1: 설치 + 기본 동작 이해
- [ ] OpenClaw 설치 + Gateway 실행
- [ ] 메신저 채널 1개 연결 (Telegram or Discord)
- [ ] LLM 연결 (Claude) + 기본 대화 확인

### Phase 2: 스킬 시스템 이해
- [ ] 기존 커뮤니티 스킬 2-3개 해부 (SKILL.md 구조 파악)
- [ ] 커스텀 스킬 1개 직접 만들기
- [ ] 스킬 = YAML 프론트매터 + 마크다운 지시사항 (코드 불필요)

### Phase 3: 실전 에이전트 구축
- [ ] 여러 스킬 조합 워크플로우 (오케스트레이션)
- [ ] 작업별 LLM 선택 (멀티 모델)
- [ ] morning-brief 같은 실제 서비스를 OpenClaw 스킬로 구현

### Phase 4: 고급 기능
- [ ] 멀티 에이전트 라우팅 (채널별 에이전트 분리)
- [ ] 메모리/세션 관리 (마크다운 파일 기반)
- [ ] cron 자동 실행 스케줄링

## 기존 학습과의 연결
| agent-fundamentals | OpenClaw |
|---|---|
| main.ts 오케스트레이터 | Gateway |
| agents/ 서브에이전트 | Skills |
| evaluators/ 하네스 | 없음 (직접 구현 가능) |
| Claude Agent SDK | Pi SDK (내장) |

## 현재 컨텍스트
- 브랜치: 미정 (Phase 1 시작 시 생성)
- OpenClaw GitHub: 247K stars, MIT 라이선스
- 핵심: 스킬 = SKILL.md 파일 하나, 코드 없이 마크다운으로 에이전트 행동 정의

## 결정사항
- (아직 없음)

## 메모
- 보안 이슈 주의 (512개 취약점 보고된 바 있음)
- Pi SDK 기반 — 자체 에이전트 루프 없이 인프라 레이어로 감쌈
