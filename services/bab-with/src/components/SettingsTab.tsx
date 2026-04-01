interface SettingsTabProps {
  onLogout: () => void;
}

export default function SettingsTab({ onLogout }: SettingsTabProps) {
  const handleLogout = () => {
    if (confirm("다른 사람으로 변경하시겠어요?")) {
      onLogout();
    }
  };

  return (
    <div className="px-5 pt-12">
      <h1 className="text-xl font-bold text-gray-900 mb-6">설정</h1>
      <button
        onClick={handleLogout}
        className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl text-red-500 font-medium border border-gray-100"
      >
        다른 사람으로 변경
      </button>
    </div>
  );
}
