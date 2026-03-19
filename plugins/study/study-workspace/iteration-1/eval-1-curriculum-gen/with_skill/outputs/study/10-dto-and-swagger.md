# 10. DTO와 Swagger 문서화 패턴

> Request/Response의 형태를 DTO로 정의하고, .docs.ts로 Swagger 문서를 분리한다.

## 학습 목표
- [ ] DTO가 뭔지, 왜 Entity를 직접 반환하지 않는지 안다
- [ ] Request DTO의 validation 데코레이터(@IsString, @IsEnum 등)를 안다
- [ ] .docs.ts 패턴으로 Swagger 데코레이터를 분리하는 방식을 안다
- [ ] DTO 네이밍 컨벤션(create-xxx.request.dto.ts 등)을 안다

## 핵심 질문
- Express에서 req.body를 직접 쓰는 것 vs DTO로 받는 것의 차이는?
- class-validator 데코레이터는 어떤 시점에 검증을 수행하는가?
- .docs.ts 파일의 `SwaggerMethodDoc<Controller>` 타입은 어떻게 타입 안전성을 보장하는가?
- Response DTO에서 @ApiProperty()는 런타임에 영향을 주는가, 문서화 전용인가?

## 참고 (레포 파일)
- `src/api-admin/v2/funnel/dtos/` — DTO 예시
- `src/api-admin/v2/funnel/funnel.docs.ts` — Swagger 분리 패턴
- `src/api-admin/v2/funnel/funnel.controller.ts` — docs 사용 예시

## 메모
_(학습하면서 채워나갈 영역)_
