interface MealTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const mealTypes = [
  { key: "lunch", label: "점심" },
  { key: "dinner", label: "석식" },
  { key: "other", label: "기타" },
];

export default function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  return (
    <div className="flex gap-2 justify-center">
      {mealTypes.map((type) => (
        <button
          key={type.key}
          onClick={() => onChange(type.key)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            value === type.key
              ? "bg-blue-600 text-white"
              : "bg-gray-50 text-gray-500 border border-gray-200"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
