# Funnel 패턴 템플릿

## 체크리스트

- [ ] 스텝 상수 정의 (`constants/step.ts`)
- [ ] 메인 퍼널 컴포넌트 (`[FunnelName]Funnel.tsx`)
- [ ] 각 스텝 컴포넌트 (`components/[StepName].tsx`)
- [ ] (선택) 조건부 분기 (`getPrevStep`)
- [ ] (선택) Context 상태 관리
- [ ] (선택) Overlay/중첩 퍼널

## 구조

```
src/pages/[funnel-name]/
├── constants/step.ts           # 스텝 정의 + 초기값 복원
├── contexts/                   # (선택)
├── components/
│   ├── [Step1].tsx
│   └── [SubFunnel].tsx         # (선택) 중첩 퍼널
└── [FunnelName]Funnel.tsx      # 메인 퍼널
```

## 1. 스텝 정의 + 초기값 복원

```typescript
export const FUNNEL_STEPS = ['Step1', 'Step2', 'Step3'] as const;
export type FunnelStepKey = (typeof FUNNEL_STEPS)[number];

// 스텝별 필수 필드 (초기 스텝 복원용)
export const REQUIRED_FIELDS_BY_STEP: Record<FunnelStepKey, (keyof YourDataType)[] | undefined> = {
  Step1: undefined,
  Step2: ['field1', 'field2'],
  Step3: ['field3'],
};

export function getInitialStep(data: YourDataType): FunnelStepKey {
  if (data.status === '발송') return 'Step1';
  for (const stepKey of FUNNEL_STEPS) {
    const fields = REQUIRED_FIELDS_BY_STEP[stepKey];
    if (fields != null && !fields.every(k => data[k] != null)) return stepKey;
  }
  return 'Step3';
}
```

## 2. 조건부 뒤로가기 (필요시만)

```typescript
type StepTransition = { prev?: FunnelStepKey | ((data: YourDataType) => FunnelStepKey) };

const STEP_TRANSITIONS: Record<FunnelStepKey, StepTransition> = {
  Step1: { prev: undefined },
  Step2: { prev: 'Step1' },
  Step3: { prev: (data) => data.someCondition ? 'Step2' : 'Step1' },
};

export function getPrevStep(current: FunnelStepKey, data: YourDataType): FunnelStepKey | undefined {
  const prev = STEP_TRANSITIONS[current].prev;
  return prev == null ? undefined : typeof prev === 'function' ? prev(data) : prev;
}
```

## 3. 메인 퍼널

```tsx
type FunnelState = Record<string, never>; // 상태 없으면 빈 객체

const steps = createFunnelSteps<FunnelState>().extends(FUNNEL_STEPS).build();

function YourFunnel() {
  const { data } = useYourData();
  const funnelId = useId();
  const funnel = useFunnel({
    id: `your-funnel-${funnelId}`,
    steps,
    initial: { step: getInitialStep(data), context: {} },
  });

  // 재접속 시 history 없으면 getPrevStep으로 이전 스텝 계산
  const handleBack = () => {
    if (funnel.historySteps.length === 1) {
      const prev = getPrevStep(funnel.step, data);
      if (prev != null) funnel.history.replace(prev);
    } else {
      funnel.history.back();
    }
  };

  return (
    <>
      {funnel.step !== 'Step1' && <Navigation onClickBack={handleBack} />}
      <funnel.Render
        Step1={({ history }) => <Step1 onNext={() => history.push('Step2')} />}
        Step2={({ history }) => <Step2 onNext={() => history.push('Step3')} />}
        Step3={() => <Step3 onComplete={() => {}} />}
      />
    </>
  );
}
```

## 4. Context로 스텝 간 데이터 전달

```tsx
type FunnelState = { selectedOption?: string; uploadedFiles?: File[] };

const steps = createFunnelSteps<FunnelState>()
  .extends('Step1')
  .extends('Step2', { requiredKeys: ['selectedOption'] })
  .build();

// push 시 context 업데이트
history.push('Step2', prev => ({ ...prev, selectedOption: option }));

// 스텝에서 context 사용
Step2={({ history, context }) => <Component option={context.selectedOption} />}
```

## 5. Overlay 스텝

```tsx
Step2={funnel.Render.overlay({
  render({ history, context, close }) {
    return (
      <BottomSheet onClose={close} onSelect={(v) => {
        history.replace('Step3', prev => ({ ...prev, value: v }));
      }} />
    );
  },
})}
```

## 6. 중첩 퍼널

```tsx
// 메인: 서브 퍼널에 onPrev/onComplete 전달
<SubFunnel onPrev={handleBack} onComplete={() => {}} />

// 서브: 첫 스텝 뒤로가기 -> 메인으로
function SubFunnel({ onPrev, onComplete }: { onPrev: () => void; onComplete: () => void }) {
  const funnel = useFunnel({ id: 'sub', steps: SUB_STEPS, initial: { step: 'SubStep1', context: {} } });
  return (
    <Navigation onClickBack={() => funnel.step === 'SubStep1' ? onPrev() : funnel.history.back()} />
  );
}
```

## history 메서드

| 메서드 | 용도 |
|--------|------|
| `push` | 히스토리 쌓음 (일반 다음 스텝) |
| `replace` | 히스토리 안 쌓음 (현재 스텝 교체) |
| `back` | 이전 히스토리로 이동 |

## DO / DON'T

**DO**: `as const` 타입 안전성 / `getInitialStep`으로 재접속 복원 / 조건부 분기는 헬퍼 함수로 / 중첩 퍼널은 props로 통신 / 스텝 컴포넌트 독립적 구현

**DON'T**: 스텝 하드코딩 / 스텝 간 강한 결합 / 전역 상태 남용 (context 사용) / 서브 퍼널에서 부모 state 직접 수정
