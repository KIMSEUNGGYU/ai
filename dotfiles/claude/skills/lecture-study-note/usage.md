# 강의 학습 노트 정리 - 사용법

## 기본 사용

```
{주제} 정리해줘
DB 섹션 4 정리해줘
섹션 4 정리 노트 만들어줘
```

강의ID 생략 시 가장 최근 진행 중인 강의로 자동 선택.

## 노트 종류

| 종류 | 파일명 패턴 | 설명 |
|------|------------|------|
| 상세 노트 | `{섹션}-{순번} {주제}.md` | 개념 학습용 (왜→개념→문법→실습→팁→정리) |
| 정리 노트 | `{섹션} {섹션명} 정리.md` | 복습용 요약 (bullet 핵심만) |
| 문제 풀이 | `{섹션} {주제} 문제 풀이.md` | 실습 문제 + 풀이 + 핵심 |

## 새 강의 추가

1. `~/.claude/skills/lecture-study-note/courses/{강의ID}.md` 생성
2. 경로, 태그, 커리큘럼 정보 작성 (db-basic.md 참고)
3. 강의 PDF를 reference 폴더에 넣기
4. `pdftotext`로 txt 변환 (PDF가 크면 Read tool이 못 읽음)

```bash
# txt 변환 (poppler 필요: brew install poppler)
for pdf in "{pdf폴더}"/*.pdf; do
  pdftotext "$pdf" "{txt폴더}/$(basename "$pdf" .pdf).txt"
done
```

5. 변환 후 PDF 원본은 reference에서 삭제 가능 (별도 보관 중이면)

## 현재 등록된 강의

| ID | 강의명 | 설정 파일 |
|----|--------|-----------|
| db-basic | 김영한 실전 데이터베이스 기본편 | `courses/db-basic.md` |

## 파일 위치

```
~/.claude/skills/lecture-study-note/
├── SKILL.md          # 스킬 정의 (Claude가 읽는 파일)
├── usage.md          # 사용법 (이 파일)
└── courses/
    └── db-basic.md   # 강의별 설정
```

## 노트 저장 위치

옵시디언: `/Users/gyu/obsidian-note/30_Resources/{주제}/`
