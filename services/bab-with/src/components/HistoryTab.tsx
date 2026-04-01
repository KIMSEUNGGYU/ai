import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRecords } from "@/lib/api-client";
import type { MealRecord } from "@/lib/api-client";
import RecordCard from "./RecordCard";

interface HistoryTabProps {
  userId: string;
  onEdit?: (record: MealRecord) => void;
}

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default function HistoryTab({ userId, onEdit }: HistoryTabProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: records, isLoading } = useQuery({
    queryKey: ["records", userId, formatMonth(year, month)],
    queryFn: () => fetchRecords(userId, formatMonth(year, month)),
  });

  const handlePrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleEdit = (record: MealRecord) => {
    onEdit?.(record);
  };

  return (
    <div className="px-5 pt-12 pb-4">
      <div className="flex items-center justify-center gap-5 mb-6">
        <button onClick={handlePrev} className="text-gray-400 text-2xl">
          ‹
        </button>
        <span className="text-lg font-bold text-gray-900">
          {year}년 {month}월
        </span>
        <button onClick={handleNext} className="text-gray-400 text-2xl">
          ›
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 text-sm">로딩 중...</p>
      ) : records?.length === 0 ? (
        <p className="text-center text-gray-400 text-sm mt-10">
          기록이 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {records?.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
