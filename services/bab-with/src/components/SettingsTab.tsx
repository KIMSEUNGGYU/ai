import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/lib/api-client";

const greetings = [
  (name: string) => `${name}님 안녕하세요 👋`,
  (name: string) => `${name}님, 맛점하세요 😋`,
  (name: string) => `${name}님, 오늘도 화이팅!`,
  (name: string) => `${name}님, 오늘도 맛있는 식사하세요 🍚`,
  (name: string) => `${name}님, 밥은 먹고 다니세요? 🍽️`,
];

interface SettingsTabProps {
  userId: string;
  userName: string;
  onLogout: () => void;
  onSwitchToTest: () => void;
}

export default function SettingsTab({ userId, userName, onLogout, onSwitchToTest }: SettingsTabProps) {
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: Infinity,
  });

  const currentUser = users?.find((u) => u.id === userId);
  const isAdmin = currentUser?.role === "admin";

  const handleLogout = () => {
    if (confirm("다른 사람으로 변경하시겠어요?")) {
      onLogout();
    }
  };

  return (
    <div className="px-5 pt-12">
      <h1 className="text-xl font-bold text-gray-900 mb-2">설정</h1>
      <p className="text-sm text-gray-400 mb-6">{greeting(userName)}</p>
      <div className="space-y-3">
        {isAdmin && (
          <button
            onClick={onSwitchToTest}
            className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl text-blue-600 font-medium border border-gray-100"
          >
            테스트 모드로 전환
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl text-red-500 font-medium border border-gray-100"
        >
          다른 사람으로 변경
        </button>
      </div>
    </div>
  );
}
