# TDS 컴포넌트 Form 패턴 (ishopcare)

> TDS(Toss Design System) 컴포넌트와 react-hook-form 연동 시 주의사항. 전역 Form 패턴은 `../conventions/form-patterns.md` 참조.


## TDS 컴포넌트별 reset 문제

### Select — key로 강제 리마운트

Select는 내부 상태를 가지고 있어 `form.reset()`만으로 UI가 갱신되지 않는다. `key`에 현재 값을 바인딩하여 강제 리마운트:

```typescript
<Controller
  name="taskStatus"
  control={control}
  render={({ field }) => (
    <Select
      key={field.value ?? 'empty'}  // reset 시 리마운트
      value={field.value}
      onValueChange={field.onChange}
    >
      {statusOptions.map(opt => (
        <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
      ))}
    </Select>
  )}
/>
```

### DateTimePicker — undefined 금지

DateTimePicker는 `undefined`를 빈 값으로 인식하지 않는다. 반드시 `null`을 사용:

```typescript
<Controller
  name="date"
  control={control}
  render={({ field }) => (
    <DateTimePicker
      value={field.value ?? null}  // undefined → null 변환
      onChange={field.onChange}
    />
  )}
/>
```

### defaultValues 전체 정의

TDS 컴포넌트와 함께 `form.reset()`이 정상 동작하려면, `defaultValues`에 모든 필드를 정의해야 한다. 누락된 필드는 reset 시 이전 값이 유지될 수 있음.


---

## 변경 히스토리

| 날짜 | 변경사항 |
|------|----------|
| 2026-04-04 | 신규 — TDS Select/DateTimePicker reset 패턴 |
