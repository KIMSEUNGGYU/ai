# 12. 외부 API 모듈 패턴 (DynamicModule)

> 외부 서비스(Cafe24, Google Ads 등) 연동은 DynamicModule + Options 패턴으로 구성한다.

## 학습 목표
- [ ] DynamicModule이 뭔지, 일반 Module과 뭐가 다른지 안다
- [ ] Options + AsyncOptions + Symbol 토큰 패턴을 이해한다
- [ ] forRoot()에서 ConfigService로 설정을 주입하는 흐름을 안다
- [ ] 새 외부 API 모듈을 추가하려면 어떤 파일들이 필요한지 안다

## 핵심 질문
- Express에서 axios 인스턴스를 config로 만들어 쓰는 것과 DynamicModule 방식은 뭐가 다른가?
- `XXX_API_MODULE_OPTIONS` Symbol 토큰은 왜 필요한가? 문자열이면 안 되나?
- `forRoot()`와 `forRootAsync()`의 차이는?
- 이 레포에 연동된 외부 서비스는 어떤 것들이 있는가?

## 참고 (레포 파일)
- `src/modules/google-ads-api/` — 전체 구조 참고용
- `src/modules/cafe24-api/` — 또 다른 외부 API 예시
- `src/modules/modusign-api/` — 모두사인 API 모듈

## 메모
_(학습하면서 채워나갈 영역)_
