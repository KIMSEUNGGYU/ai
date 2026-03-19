# 01. NestJS 앱 구조와 모듈 시스템

> Express의 app.use()와 라우터 대신, NestJS는 모듈 단위로 앱을 조립한다.

## 학습 목표
- [ ] Express와 NestJS의 구조 차이를 설명할 수 있다
- [ ] @Module()의 imports, providers, exports, controllers 역할을 안다
- [ ] 이 레포의 진입점(main.ts)에서 앱이 어떻게 부트스트랩되는지 따라갈 수 있다
- [ ] SERVICE 환경변수에 따른 모듈 분기를 이해한다

## 핵심 질문
- Express에서 미들웨어 체인으로 하던 걸 NestJS에서는 어떻게 구성하지?
- `@Module()`의 4가지 속성은 각각 뭘 하는 건가?
- `app-combined.module.ts`에서 SERVICE별로 모듈을 어떻게 분기하고 있나?
- `@Global()` 모듈은 왜 필요한가? 언제 쓰는가?

## 참고 (레포 파일)
- `src/main.ts` — 앱 부트스트랩
- `src/app-combined.module.ts` — SERVICE별 모듈 분기
- `src/api-admin/api-admin.module.ts` — Admin API 루트 모듈
- `src/api-public/` — Public API 루트 모듈

## 메모
_(학습하면서 채워나갈 영역)_
