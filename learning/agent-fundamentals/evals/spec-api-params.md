# 스펙: API 파라미터 빌더

## 요구사항
- `buildQueryParams(params: Record<string, unknown>): string` 함수 작성
- undefined, null, 빈 문자열 값은 제외
- 배열은 콤마로 join (예: `tags=a,b,c`)
- Date 객체는 ISO string으로 변환
- 결과는 `?key=value&key2=value2` 형식
- 테스트 코드 포함
