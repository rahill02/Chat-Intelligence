import React from 'react';
import { Bell } from 'lucide-react';

interface TopBarProps {
  currentSection?: string;
  conversationName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentSection = 'Search',
  conversationName = 'College Friends',
}) => {
  return (
    <header className="h-14 border-b border-gray-200/80 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 font-normal">{currentSection}</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-medium">{conversationName}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-white text-[11px] font-medium text-gray-600 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Demo Mode</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-600" />
        </button>

        {/* User Avatar */}
        <div
          className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs flex items-center justify-center shadow-2xs"
          title="Logged in as Antigravity Researcher"
        >
          AR
        </div>
      </div>
    </header>
  );
};
