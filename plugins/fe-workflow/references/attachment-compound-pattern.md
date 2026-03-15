# Attachment Compound Pattern

> 관련 규칙: `[COUP]` `[DECL]` `[API]`

첨부파일 UI를 선언적으로 구성하는 Compound Component 패턴.

## 핵심 구성요소

| 구성요소 | 역할 |
|---------|------|
| `Attachment` | Root 컨테이너, 전체 영역 클릭 처리 |
| `Attachment.Badge` | 파일 라벨/카테고리 표시 |
| `Attachment.Thumbnail` | 이미지/문서 썸네일 (자동 분기) |
| `Attachment.FileName` | 파일명 표시 |

## 폴더 구조

```
src/
├── components/
│   └── Attachment.tsx       ← Compound Component 정의
└── pages/
    └── {page}/
        └── components/
            └── {Feature}Attachment.tsx  ← 사용처
```

## 타입 정의

```typescript
// Root
interface AttachmentRootProps {
  children: ReactNode;
  onClick?: () => void;
}

// Thumbnail
interface AttachmentThumbnailProps {
  src: string;
  fileName: string;
  alt?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

// Badge - TDS Badge props 그대로 전달
type AttachmentBadgeProps = ComponentProps<typeof Badge>;

// FileName
interface AttachmentFileNameProps {
  children: ReactNode;
}
```

## 사용 가이드

### 1. 기본 사용 (전체 영역 클릭)

**무엇을**: 첨부파일 전체 영역 클릭 시 동작 정의
**왜**: 가장 일반적인 케이스 (다운로드) [DECL]

```tsx
<Attachment onClick={handleDownload}>
  <Attachment.Badge size="small" theme="teal">
    {labelName}
  </Attachment.Badge>
  <Attachment.Thumbnail src={url} fileName={fileName} />
  <Attachment.FileName>{fileName}</Attachment.FileName>
</Attachment>
```

### 2. Thumbnail만 별도 클릭 (미리보기 + 다운로드 분리)

**무엇을**: Thumbnail 클릭과 나머지 영역 클릭 분리
**왜**: 미리보기와 다운로드를 분리해야 할 때 [SRP]

```tsx
<Attachment onClick={handleDownload}>
  <Attachment.Thumbnail
    src={url}
    fileName={fileName}
    onClick={e => {
      e.stopPropagation();  // 버블링 방지
      handlePreview();
    }}
  />
</Attachment>
```

### 3. 클릭 없이 표시만

**무엇을**: 클릭 이벤트 없이 표시만
**왜**: 읽기 전용 UI [READ]

```tsx
<Attachment>
  <Attachment.Thumbnail src={url} fileName={fileName} />
  <Attachment.FileName>{fileName}</Attachment.FileName>
</Attachment>
```

## 클릭 동작 매트릭스

| Thumbnail onClick | Root onClick | Thumbnail 클릭 시 |
|-------------------|--------------|-------------------|
| O | O | Thumbnail만 실행 (stopPropagation) |
| O | X | Thumbnail만 실행 |
| X | O | Root 실행 (버블링) |
| X | X | 아무것도 안함 |

## 주의사항

### Bad: 직접 이미지/문서 분기 작성

```tsx
// Bad - How(어떻게)를 직접 작성
const isImage = /\.(jpg|jpeg|png)$/i.test(fileName);
{isImage ? <img src={url} /> : <DocumentIcon />}
```

### Good: Thumbnail 컴포넌트 사용

```tsx
// Good - What(무엇)만 선언
<Attachment.Thumbnail src={url} fileName={fileName} />
```

### Bad: a 태그로 다운로드

```tsx
// Bad - 스타일 일관성 깨짐
<a href={url} target="_blank">
  <img src={url} />
</a>
```

### Good: onClick + window.open

```tsx
// Good - 일관된 클릭 처리
<Attachment onClick={() => window.open(url, '_blank')}>
  <Attachment.Thumbnail src={url} fileName={fileName} />
</Attachment>
```

## 실제 적용 예시

```tsx
function AttachFileItem({ attachment }: AttachFileItemProps) {
  const handleDownload = () => window.open(attachment.downloadUrl, '_blank');

  return (
    <Attachment onClick={handleDownload}>
      <Attachment.Badge size="small" theme="teal">
        {attachment.labelName}
      </Attachment.Badge>
      <Attachment.Thumbnail
        src={attachment.downloadUrl}
        fileName={attachment.fileName}
        alt={attachment.labelName}
      />
      <Attachment.FileName>{attachment.fileName}</Attachment.FileName>
    </Attachment>
  );
}
```

## 검증 체크리스트

- [ ] Attachment import 확인
- [ ] onClick 이벤트 연결 확인
- [ ] fileName에 확장자 포함 확인 (이미지/문서 분기용)
- [ ] stopPropagation 필요 여부 확인
