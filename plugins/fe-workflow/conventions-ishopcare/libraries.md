# 회사 라이브러리 컨벤션 (ishopcare)

> 프로젝트에서 사용하는 특정 라이브러리별 규칙. 전역 코딩 스타일은 `../conventions/coding-style.md` 참조.


## @tossteam/is 라이브러리

프로젝트 전체에서 `@tossteam/is` 라이브러리를 boolean 판별에 사용한다. `!` 연산자나 직접 boolean 변환으로 대체하지 않는다.

```typescript
// ✅ is 라이브러리 사용 (프로젝트 컨벤션)
import { is } from '@tossteam/is';

const invalidFile = selected.find(f => is.falsy(ALLOWED_EXTENSIONS.includes(getFileExtension(f.name))));
const removed = files.filter(file => is.truthy(selectedFiles.has(file.downloadUrl)));
onFilesChange(files.filter(file => is.falsy(selectedFiles.has(file.downloadUrl))));

// ❌ 직접 boolean 연산 (리뷰에서 제안되어도 거부)
const invalidFile = selected.find(f => !ALLOWED_EXTENSIONS.includes(getFileExtension(f.name)));
const removed = files.filter(file => selectedFiles.has(file.downloadUrl));
```


## Toss 패키지 활용

es-toolkit, react-simplikit 등 toss 패키지를 적극 활용한다:

```typescript
// ✅ toss 패키지
import { sum, objectEntries, objectValues } from 'es-toolkit';
import { useBooleanState } from 'react-simplikit';

sum(countArr);
objectEntries({ ... });
const [isOpen, open, close] = useBooleanState(false);

// ❌ 네이티브 메서드 직접 사용
amounts.reduce((acc, curr) => acc + curr, 0);
Object.entries(data);
```


## Modal / Dialog (overlay-kit)

`overlay-kit`의 `overlay.open` 패턴을 사용한다. 컴포넌트 상태(`useState`)로 모달을 제어하지 않는다:

```tsx
import { overlay } from 'overlay-kit';
import { AlertDialog } from 'components/Dialog';

// ✅ overlay.open 패턴
const handleDeleteClick = () => {
  overlay.open(({ isOpen, close }) => (
    <AlertDialog
      isOpen={isOpen}
      close={close}
      title="삭제할까요?"
      description="삭제 후 복구할 수 없어요."
      onConfirm={async () => {
        await deleteMutation.mutateAsync(params);
        close();
      }}
    />
  ));
};

// ❌ useState로 모달 제어
const [isDialogOpen, setIsDialogOpen] = useState(false);
<Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
```

공용 `AlertDialog` (`components/Dialog.tsx`)를 우선 사용하고, 커스텀 모달이 필요한 경우에만 TDS `AlertDialog`를 직접 사용한다.


## overlay.open + Suspense 래핑

overlay 내부에서 `useSuspenseQuery` 사용 시 반드시 Suspense로 래핑한다:

```typescript
// ✅ Suspense 래핑 필수
overlay.open(({ isOpen, close }) => (
  <Modal isOpen={isOpen} onClose={close}>
    <Suspense fallback={<Spinner />}>
      <EditFormContent onClose={close} />
    </Suspense>
  </Modal>
));

// ❌ Suspense 없이 useSuspenseQuery 사용 → 에러
overlay.open(({ isOpen, close }) => (
  <Modal isOpen={isOpen} onClose={close}>
    <EditFormContent onClose={close} />
  </Modal>
));
```


---

## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2026-04-04 | coding-style.md에서 회사 전용 섹션 분리 + overlay Suspense 추가 |
