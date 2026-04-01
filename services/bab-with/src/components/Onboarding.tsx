import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/lib/api-client";
import type { User } from "@/lib/api-client";

interface OnboardingProps {
  onComplete: (userId: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-white">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-white px-6">
        <p className="text-xl font-bold text-gray-900 mb-2">
          {selectedUser.name}님으로 시작할게요
        </p>
        <p className="text-sm text-gray-400 mb-8">
          설정에서 언제든 변경할 수 있어요
        </p>
        <button
          onClick={() => onComplete(selectedUser.id)}
          className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-semibold"
        >
          확인
        </button>
        <button
          onClick={() => setSelectedUser(null)}
          className="mt-3 text-sm text-gray-400"
        >
          다시 선택
        </button>
      </div>
    );
  }

  const productTeam = users?.filter((u) => u.team === "product") ?? [];
  const dataTeam = users?.filter((u) => u.team === "data") ?? [];

  return (
    <div className="flex flex-col h-dvh bg-white px-6 pt-16">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
        bab-with
      </h1>
      <p className="text-sm text-gray-400 text-center mb-8">
        본인 이름을 선택해주세요
      </p>

      <div className="space-y-5">
        <div>
          <div className="text-xs text-gray-400 font-semibold tracking-wide mb-2">
            제품팀
          </div>
          <div className="flex flex-wrap gap-2">
            {productTeam.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 active:bg-blue-600 active:text-white"
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 font-semibold tracking-wide mb-2">
            데이터팀
          </div>
          <div className="flex flex-wrap gap-2">
            {dataTeam.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 active:bg-blue-600 active:text-white"
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
