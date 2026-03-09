# leader-review: 곽호영 리뷰 시뮬레이션 스킬

## 스펙
- LinkedIn 포스트(heebum-review) 컨셉을 iShopCARE 버전으로 구현
- 곽호영(iShopCARE Leader) 슬랙 메시지 3,000건+ 분석 기반
- 팀원이 보고/제안/공유 올리기 전 리더 피드백 시뮬레이션

## 작업
- [x] 슬랙 메시지 수집 (2025-06 ~ 2026-03)
- [x] 소통 스타일/의사결정/피드백 패턴 분석 → `analysis/kwak-hoyoung.md`
- [x] 프로젝트 구조 결정 (`~/dev/ai/projects/leader-review/`)
- [x] skill-creator 플러그인으로 SKILL.md 공식 스펙 작성
- [x] iteration-1 테스트 (with_skill vs without_skill 6개)
- [x] iteration-1 결과 분석 → 맥락 반응/개선 예시/톤 개선
- [x] iteration-2 테스트 (with_skill 3개)
- [x] 루키(AI 챗봇) 발화 구분 수정 — 분석+스킬 양쪽
- [ ] 스킬 등록 (`~/.claude/skills/`에 배포)
- [ ] 실제 업무에서 사용 테스트

## 현재 컨텍스트
iteration-2 테스트 완료, 루키 발화 구분 수정 완료. 스킬 품질 안정화 단계.

## 결정사항
- `~/dev/ai/projects/` 폴더 신설 — 비코드 프로젝트용 (services/packages와 분리)
- 존대 기반 톤 — 곽호영은 팀원에게도 존대, 반말은 AI 챗봇(루키) 대상이었음
- pnpm workspace에 추가하지 않음 — 코드 서비스가 아니므로 독립 관리

## 파일 구조
```
~/dev/ai/projects/leader-review/
├── analysis/
│   └── kwak-hoyoung.md          # 원본 분석
└── skills/
    └── kwak-review/
        ├── SKILL.md              # 스킬 본체
        ├── evals/evals.json      # 테스트 케이스
        └── references/
            └── analysis.md       # 분석 복사본
```

## 세션 이력
- 0ba0a20a-46b5-47d2-b77f-44c92788d595 (2026-03-10 22:00)
