import type { User } from "@/lib/api-client";

interface CompanionSelectorProps {
  users: User[];
  selected: Set<string>;
  currentUserId: string;
  onToggle: (userId: string) => void;
}

export default function CompanionSelector({
  users,
  selected,
  currentUserId,
  onToggle,
}: CompanionSelectorProps) {
  const productTeam = users.filter((u) => u.team === "product");
  const dataTeam = users.filter((u) => u.team === "data");

  return (
    <div className="space-y-4">
      <TeamGroup
        label="제품팀"
        users={productTeam}
        selected={selected}
        onToggle={onToggle}
      />
      <TeamGroup
        label="데이터팀"
        users={dataTeam}
        selected={selected}
        onToggle={onToggle}
      />
    </div>
  );
}

interface TeamGroupProps {
  label: string;
  users: User[];
  selected: Set<string>;
  onToggle: (userId: string) => void;
}

function TeamGroup({ label, users, selected, onToggle }: TeamGroupProps) {
  return (
    <div>
      <div className="text-xs text-gray-400 font-semibold tracking-wide mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {users.map((user) => {
          const isSelected = selected.has(user.id);
          return (
            <button
              key={user.id}
              onClick={() => onToggle(user.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
              }`}
            >
              {user.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
