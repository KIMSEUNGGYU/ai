# 09. 암호화/해싱 데코레이터

> @EncryptedField()와 @HashField()로 개인정보를 자동 암호화/복호화한다.

## 학습 목표
- [ ] @EncryptedField()가 어떤 시점에 암호화/복호화하는지 안다
- [ ] @HashField()가 왜 필요한지 (암호화된 필드로는 검색 불가) 안다
- [ ] 암호화 필드의 comment에 'P_INFO,ENCRYPTED'를 쓰는 컨벤션을 안다
- [ ] KMS(Key Management Service)가 뭔지 개략적으로 안다

## 핵심 질문
- 암호화된 전화번호를 DB에서 검색하려면 어떻게 해야 하는가? (Hash 필드 활용)
- Subscriber에서 암호화가 처리되는가, 아니면 별도 인터셉터인가?
- FE에서 암호화된 데이터를 내려받으면 어떻게 보이는가? 복호화는 어디서?
- `@EncryptedField()`의 구현은 어디에 있고, 어떤 라이프사이클에서 동작하는가?

## 참고 (레포 파일)
- `src/core/encryption/encrypted-fields.decorator.ts` — @EncryptedField 구현
- `src/core/encryption/hash-field.decorator.ts` — @HashField 구현
- `src/modules/entities/document/document-v2/document-v2.entity.ts` — 사용 예시

## 메모
_(학습하면서 채워나갈 영역)_
