# 03. Controller -> Service -> Repository 흐름

> HTTP 요청이 들어와서 DB를 거쳐 응답이 나가기까지의 전체 흐름.

## 학습 목표
- [ ] Express의 route handler와 NestJS Controller의 대응 관계를 안다
- [ ] @Get(), @Post(), @Param(), @Body() 등 데코레이터 역할을 안다
- [ ] 하나의 API 엔드포인트를 Controller -> Service -> Repository로 따라갈 수 있다
- [ ] Guard, Interceptor, Pipe가 요청 흐름에서 어디에 끼어드는지 안다

## 핵심 질문
- Express의 `router.get('/users/:id', handler)`가 NestJS에서는 어떻게 되는가?
- 이 레포에서 Guard(JwtAuthGuard)는 어떤 역할을 하고, 어디서 적용되는가?
- Service 레이어가 왜 필요한가? Controller에서 바로 Repository를 쓰면 안 되나?
- `@UseGuards()`, `@UseInterceptors()` 같은 데코레이터는 미들웨어와 뭐가 다른가?

## 참고 (레포 파일)
- `src/api-admin/v2/funnel/funnel.controller.ts` — v2 컨트롤러 예시
- `src/api-admin/v2/funnel/funnel.service.ts` — 서비스 레이어
- `src/core/guards/` — Guard 구현
- `src/core/interceptors/` — Interceptor 구현

## 메모
_(학습하면서 채워나갈 영역)_
