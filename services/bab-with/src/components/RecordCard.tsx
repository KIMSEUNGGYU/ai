import { useState } from "react";
import type { MealRecord } from "@/lib/api-client";

interface RecordCardProps {
  record: MealRecord;
  onEdit: (record: MealRecord) => void;
}

const mealTypeLabels: Record<string, { label: string; color: string; bg: string }> = {
  lunch: { label: "점심", color: "text-blue-600", bg: "bg-blue-50" },
  dinner: { label: "석식", color: "text-amber-500", bg: "bg-amber-50" },
  other: { label: "기타", color: "text-gray-500", bg: "bg-gray-100" },
};

function formatCardDate(dateStr: string): { date: string; day: string } {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const month = d.getMonth() + 1;
  const date = d.getDate();
  return { date: `${month}/${date}`, day: days[d.getDay()] };
}

export default function RecordCard({ record, onEdit }: RecordCardProps) {
  const [copied, setCopied] = useState(false);
  const { date, day } = formatCardDate(record.date);
  const meal = mealTypeLabels[record.mealType] ?? mealTypeLabels.other;
  const names = record.companions.map((c) => c.user.name).join(", ");

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(names);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={() => onEdit(record)}
      className="bg-gray-50 rounded-xl px-3.5 py-3 border border-gray-100 flex items-center cursor-pointer active:bg-gray-100"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[15px] font-semibold text-gray-900">
            {date} {day}
          </span>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${meal.color} ${meal.bg}`}
          >
            {meal.label}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 mr-1.5 transition-colors ${
              copied ? "text-green-500" : "text-gray-400 hover:text-gray-600 active:text-blue-600"
            }`}
            title="이름 복사"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="8" width="14" height="14" rx="2" />
                <path d="M4 16V4a2 2 0 0 1 2-2h12" />
              </svg>
            )}
          </button>
          <span className="truncate">{copied ? "복사 완료!" : names}</span>
        </div>
      </div>
      <span className="text-gray-300 text-lg ml-2 flex-shrink-0">›</span>
    </div>
  );
}
