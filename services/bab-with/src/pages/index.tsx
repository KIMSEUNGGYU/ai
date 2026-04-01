import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Onboarding from "@/components/Onboarding";
import RegisterTab from "@/components/RegisterTab";
import HistoryTab from "@/components/HistoryTab";
import SettingsTab from "@/components/SettingsTab";
import MealTypeSelector from "@/components/MealTypeSelector";
import CompanionSelector from "@/components/CompanionSelector";
import {
  fetchUsers,
  updateRecord,
  deleteRecord,
} from "@/lib/api-client";
import type { MealRecord } from "@/lib/api-client";
import type { Tab } from "@/components/Layout";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("register");
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MealRecord | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bab-with-user-id");
    if (stored) setUserId(stored);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null;

  if (!userId) {
    return (
      <Onboarding
        onComplete={(id) => {
          localStorage.setItem("bab-with-user-id", id);
          setUserId(id);
        }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("bab-with-user-id");
    setUserId(null);
    setActiveTab("register");
  };

  if (editingRecord) {
    return (
      <EditRecordView
        record={editingRecord}
        userId={userId}
        onClose={() => setEditingRecord(null)}
      />
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "register" && <RegisterTab userId={userId} />}
      {activeTab === "history" && (
        <HistoryTab userId={userId} onEdit={setEditingRecord} />
      )}
      {activeTab === "settings" && <SettingsTab onLogout={handleLogout} />}
    </Layout>
  );
}

interface EditRecordViewProps {
  record: MealRecord;
  userId: string;
  onClose: () => void;
}

function EditRecordView({ record, userId, onClose }: EditRecordViewProps) {
  const [mealType, setMealType] = useState(record.mealType);
  const [selectedCompanions, setSelectedCompanions] = useState<Set<string>>(
    new Set(record.companions.map((c) => c.userId))
  );

  const queryClient = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRecord(record.id, {
        date: record.date,
        mealType,
        companionIds: Array.from(selectedCompanions),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecord(record.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      onClose();
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

  const handleDelete = () => {
    if (confirm("이 기록을 삭제하시겠어요?")) {
      deleteMutation.mutate();
    }
  };

  const d = new Date(record.date + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const displayDate = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;

  return (
    <div className="flex flex-col h-dvh bg-white max-w-[430px] mx-auto">
      <div className="flex items-center px-5 pt-12 mb-4">
        <button onClick={onClose} className="text-gray-400 text-lg mr-3">
          ← 뒤로
        </button>
        <h1 className="text-lg font-bold text-gray-900">기록 수정</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <p className="text-sm text-gray-400 text-center mb-5">
          {displayDate}
        </p>

        <div className="mb-6">
          <MealTypeSelector value={mealType} onChange={setMealType} />
        </div>

        {users && (
          <CompanionSelector
            users={users}
            selected={selectedCompanions}
            currentUserId={userId}
            onToggle={handleToggle}
          />
        )}
      </div>

      <div className="px-5 pb-8 pt-4 space-y-2">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={
            selectedCompanions.size === 0 || updateMutation.isPending
          }
          className={`w-full py-4 rounded-xl text-base font-semibold ${
            selectedCompanions.size === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white active:bg-blue-700"
          }`}
        >
          {updateMutation.isPending ? "수정 중..." : "수정"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="w-full py-3 rounded-xl text-sm font-medium text-red-500 bg-red-50 active:bg-red-100"
        >
          {deleteMutation.isPending ? "삭제 중..." : "삭제"}
        </button>
      </div>
    </div>
  );
}
