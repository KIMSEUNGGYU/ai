import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, createRecord } from "@/lib/api-client";
import MealTypeSelector from "./MealTypeSelector";
import CompanionSelector from "./CompanionSelector";

interface RegisterTabProps {
  userId: string;
}

function getDefaultMealType(): string {
  const hour = new Date().getHours();
  return hour < 17 ? "lunch" : "dinner";
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = days[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}

export default function RegisterTab({ userId }: RegisterTabProps) {
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [mealType, setMealType] = useState(getDefaultMealType);
  const [selectedCompanions, setSelectedCompanions] = useState<Set<string>>(
    new Set([userId])
  );
  const [extraCompanions, setExtraCompanions] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const queryClient = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const mutation = useMutation({
    mutationFn: createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      setSelectedCompanions(new Set([userId]));
      setExtraCompanions("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  const handleToggle = (id: string) => {
    setSelectedCompanions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (selectedCompanions.size === 0) return;
    mutation.mutate({
      userId,
      date: selectedDate,
      mealType,
      companionIds: Array.from(selectedCompanions),
      extraCompanions: extraCompanions.trim(),
    });
  };

  return (
    <div className="px-5 pt-12 pb-4 flex flex-col h-full">
      <div className="text-center mb-5">
        <h1 className="text-xl font-bold text-gray-900">식사 등록</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-transparent border-none text-sm text-gray-500 cursor-pointer focus:outline-none w-auto mx-auto block"
        />
      </div>

      <div className="mb-6">
        <MealTypeSelector value={mealType} onChange={setMealType} />
      </div>

      <div className="flex-1">
        {users && (
          <CompanionSelector
            users={users}
            selected={selectedCompanions}
            currentUserId={userId}
            onToggle={handleToggle}
          />
        )}

        <div className="mt-4">
          <div className="text-xs text-gray-400 font-semibold tracking-wide mb-0.5">
            참석자 추가
          </div>
          <p className="text-[11px] text-gray-400 mb-2">예: 홍길동, 김철수</p>
          <input
            type="text"
            value={extraCompanions}
            onChange={(e) => setExtraCompanions(e.target.value)}
            placeholder="예: 홍길동, 김철수"
            className="w-full px-4 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-300"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={selectedCompanions.size === 0 || mutation.isPending}
        className={`w-full py-4 rounded-xl text-base font-semibold transition-colors ${
          selectedCompanions.size === 0
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : saveSuccess
              ? "bg-green-500 text-white"
              : "bg-blue-600 text-white active:bg-blue-700"
        }`}
      >
        {mutation.isPending
          ? "저장 중..."
          : saveSuccess
            ? "저장 완료 ✓"
            : "저장"}
      </button>
    </div>
  );
}
