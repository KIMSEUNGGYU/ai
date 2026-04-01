# bab-with — 식사 동행 기록 서비스

## 스펙
- bizfest 법인카드 식사 동행 기록 모바일 웹앱
- 설계 문서: `.ai/specs/2026-04-02-lunch-with-design.md`
- 구현 계획: `.ai/specs/2026-04-02-bab-with-plan.md`
- 서비스 위치: `services/bab-with/`
- 배포: https://bab-with.vercel.app/
- DB: Turso (bab-with-seunggyu)

## 작업
- [x] 프로젝트 초기화 (Next.js + Tailwind + Prisma + React Query)
- [x] Prisma + Turso 설정 및 시드 (14명 + 테스트 유저)
- [x] API Routes (users, records CRUD)
- [x] API Client + 공통 컴포넌트 (Layout, MealTypeSelector, CompanionSelector)
- [x] 온보딩 (이름 선택 → 확인 → localStorage)
- [x] 등록 탭 (날짜 선택, 식사구분, 팀별 배지, 참석자 추가)
- [x] 히스토리 탭 (월별 조회, 컴팩트 카드, 복사, 가나다순 정렬)
- [x] 설정 탭 (로그아웃, 랜덤 인사, admin 테스트 모드)
- [x] 수정/삭제 화면
- [x] PWA 메타 + manifest.json
- [x] Vercel 배포 (kimseunggyus-projects)
- [x] HTTP 환경 클립보드 복사 폴백
- [x] 한글 IME Enter 중복 방지
- [x] API 캐시 전략 (users Infinity, records 30초)
- [x] User role 추가 (김승규 admin)
- [x] 참석자 추가 UI (입력 + 배지 + 삭제, 접기/펼치기)
- [ ] 앱 아이콘 (루키 캐릭터 + 밥 먹는 모습)

## 현재 컨텍스트
앱 아이콘 작업 중. 루키 캐릭터가 밥 먹는 모습을 원하지만 이미지 생성은 AI 이미지 도구(ChatGPT/DALL-E 등) 필요. 이미지 준비되면 적용 예정.

## 결정사항
- PWA (Next.js Pages Router) 선택 → cc-monitor 패턴 재활용 가능
- 인증 없음, localStorage로 이름 저장 → 14명 사내 서비스에 충분
- Turso + Prisma → cc-monitor와 동일 패턴, 무료 티어 충분
- RecordCompanion 관계 테이블 → JSON string 대신 쿼리 자유도/무결성
- 서비스명 bab-with → 사내에서 "밥위드"로 부르기 자연스러움
- 하단 3탭 (등록/히스토리/설정) → 등록에 집중, 조회에 집중 분리
- 히스토리 컴팩트 카드 + 복사 아이콘 → 카드 탭=수정, 아이콘 탭=복사
- 월 선택 네비게이션 → 기간 선택보다 모바일에서 심플
- 수정 + 삭제 둘 다 지원
- 중복 기록 허용 → 사용자가 알아서 관리
- 동행자 목록에 본인 포함 + 기본 선택 → 복사 시 본인 이름 필요
- 설정 탭에서만 사용자 이름 표시 → 띠 배너는 매번 공간 차지로 오버
- 참석자 추가 접기/펼치기 → 가끔 쓰는 기능이라 기본 접힘
- 개인 Vercel 계정 배포 → 회사 프로덕션과 분리, MVP 검증 단계
- 브랜드 컬러 #0064ff (아이샵케어 블루) 참고

## 기각된 대안
- 슬랙 봇 → 기각: 배지 UX 구현 불가, UI 자유도 낮음
- 카카오톡 봇 → 기각: 같은 이유
- 회원가입/비밀번호 → 기각: 14명 서비스에 오버엔지니어링
- companions JSON string → 기각: 쿼리 불편, DB 무결성 없음
- 상단 이름 띠 배너 → 기각: 매 화면 공간 차지, 14명이라 자주 바꿀 일 없음
- 탭바 이니셜/이름 → 기각: 설정 탭에서만 표시로 충분
- 날짜+mealType 중복 방지 → 기각: 사용자가 알아서 관리하는 게 심플

## 미해결 논의
- 앱 아이콘: 루키 캐릭터가 밥 먹는 모습 원함. AI 이미지 생성 도구로 만들어야 함. 이미지 준비 후 적용 필요.

## 메모
- Turso CLI: `brew install tursodatabase/tap/turso`, `turso auth login` 필요
- Prisma 7: schema에 url 없이 prisma.config.ts 사용, output 별도 지정 필요 (모노레포)
- generated 파일은 .gitignore 처리
- `?mode=admin`으로 테스트 계정 접근 가능
- 브랜치: feat/bab-with

## 세션 이력
- 1bdbacad-dbea-40ce-a1c1-ca4560efe0af (2026-04-02 05:00)
