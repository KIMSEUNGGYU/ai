# 미니 테스트 케이스 — 하네스 스모크 테스트

## 목적
Plugin 수정 후 하네스 파이프라인이 정상 동작하는지 빠르게 확인.
Sprint 1개, 파일 3개 수준의 최소 케이스.

## 입력
```
공지사항 리스트 페이지 구현 (가상 도메인, 테스트용)
```

## 대상
- 프로젝트: ~/work/ishopcare-frontend
- 서비스: ishopcare
- 도메인: notice
- 페이지: list

## 기대 스펙 (Sprint 1개)
- 기능: 공지사항 목록 조회 (페이지네이션), 테이블 표시
- API: GET /notices (목록)
- Sprint 1개: DTO + Remote + Query + 테이블 컴포넌트 + 페이지

## 검증 체크리스트
- [ ] Planner가 spec.md 생성
- [ ] Contract 생성 (Planner 초안 + Evaluator 검토)
- [ ] Generator가 파일 생성
- [ ] Static Gate 통과 (tsc + biome)
- [ ] Evaluator가 점수 산출 (8.0 이상)
- [ ] summary.md 생성

## 실행 방법
```
/fe:harness "공지사항 리스트 페이지 구현"
→ 도메인: notice, 페이지: list, 서비스: ishopcare
```

## 정리
테스트 후 생성된 파일 삭제:
```bash
rm -rf ~/work/ishopcare-frontend/.ai/harness/notice/
rm -rf ~/work/ishopcare-frontend/services/ishopcare/src/pages/notice/
rm -f ~/work/ishopcare-frontend/services/ishopcare/pages/notice/index.tsx
```
