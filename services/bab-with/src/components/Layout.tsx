import { type ReactNode } from "react";

type Tab = "register" | "history" | "settings";

interface LayoutProps {
  children: ReactNode;
  activeTab: Tab;
  userName: string;
  onTabChange: (tab: Tab) => void;
}

export type { Tab };

export default function Layout({ children, activeTab, userName, onTabChange }: LayoutProps) {
  const tabs: Array<{ key: Tab; icon: string; label: string }> = [
    { key: "register", icon: "📝", label: "등록" },
    { key: "history", icon: "📋", label: "히스토리" },
    { key: "settings", icon: "⚙️", label: "설정" },
  ];

  return (
    <div className="h-dvh bg-white">
    <div className="flex flex-col h-full bg-white max-w-[430px] mx-auto shadow-xl">
      <div className="bg-blue-50 text-blue-600 text-center text-sm py-2 font-medium">
        {userName}님 안녕하세요
      </div>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav className="flex border-t border-gray-200 pb-5 pt-2 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 text-xs ${
              activeTab === tab.key
                ? "text-blue-600 font-semibold"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
    </div>
  );
}
