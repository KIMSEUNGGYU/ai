# 11. Batch 구조와 ts-pattern match()

> 배치 작업은 별도 진입점(batch.ts)으로 실행되며, ts-pattern으로 분기한다.

## 학습 목표
- [ ] 배치 시스템의 진입점과 실행 흐름을 따라갈 수 있다
- [ ] match()가 if-else 체인을 어떻게 대체하는지 안다
- [ ] Usecase 패턴이 뭔지, Service와 뭐가 다른지 안다
- [ ] @Catch 데코레이터로 배치 에러를 처리하는 패턴을 안다

## 핵심 질문
- `pnpm batch:dev --service order --batchName send-slack`이 실행되면 코드가 어떤 경로로 흐르는가?
- match().with().otherwise() 패턴은 switch-case와 뭐가 다른가? 타입 안전성?
- Usecase는 왜 Service와 분리하는가? 언제 Usecase를 쓰는가?
- 배치에서 에러가 나면 어떻게 처리되는가? Sentry 연동 흐름은?

## 참고 (레포 파일)
- `src/batch.ts` — 배치 진입점
- `src/batch/order/batch-order.service.ts` — batchName 라우팅
- `src/batch/order/usecases/` — Usecase 예시
- `src/batch/inquiry/usecases/batch-inquiry.reservation-remind-alimtalk.usecase.ts` — @Catch 예시

## 메모
_(학습하면서 채워나갈 영역)_
