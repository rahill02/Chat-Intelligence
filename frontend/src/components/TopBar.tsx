import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  ChevronDown,
  CheckCheck,
  Settings,
  HelpCircle,
  RotateCcw,
  PanelRightClose,
} from 'lucide-react';

interface TopBarProps {
  currentSection?: string;
  conversationName?: string;
  insightsPanelOpen?: boolean;
  onToggleInsights?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onResetDemo?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Vector Index Initialized',
    desc: '4,348 messages indexed into FAISS with multilingual-e5-small embeddings.',
    time: '5m ago',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Anti-Hallucination Guardrail Active',
    desc: 'Confidence gating refusal threshold (< 0.35) is enforcing verified citations.',
    time: '1h ago',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Multi-Channel Datasets Ready',
    desc: 'College Friends, Project Team, Rahul & Priya, and Family Chat are ready for search.',
    time: '2h ago',
    unread: true,
  },
];

type OpenPopover = 'demo' | 'notifications' | 'profile' | null;

export const TopBar: React.FC<TopBarProps> = ({
  currentSection = 'Search',
  conversationName = 'College Friends',
  insightsPanelOpen = true,
  onToggleInsights,
  onOpenSettings,
  onOpenHelp,
  onResetDemo,
}) => {
  const [openPopover, setOpenPopover] = useState<OpenPopover>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  // Close popovers on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenPopover(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header
      ref={containerRef}
      className="h-14 border-b border-gray-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 font-normal">{currentSection}</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-medium">{conversationName}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Toggle Search Insights Button */}
        {onToggleInsights && (
          <button
            type="button"
            onClick={onToggleInsights}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              !insightsPanelOpen
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-2xs hover:bg-indigo-100/70'
                : 'border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
            title={insightsPanelOpen ? 'Hide Search Insights panel' : 'Restore Search Insights panel'}
          >
            {insightsPanelOpen ? (
              <>
                <PanelRightClose className="w-3.5 h-3.5 text-gray-500" />
                <span>Hide Insights</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Show Insights</span>
              </>
            )}
          </button>
        )}

        {/* Demo Mode Pill & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === 'demo' ? null : 'demo')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-[11px] font-medium text-gray-600 shadow-2xs transition cursor-pointer"
            title="View system status & indexing details"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Demo Mode</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {openPopover === 'demo' && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-gray-900">System Operational</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                  Live Engine
                </span>
              </div>

              <div className="py-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Indexed Corpus</span>
                  <span className="font-semibold text-gray-800">4,348 messages</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Active Channels</span>
                  <span className="font-semibold text-gray-800">4 groups</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Embedding Model</span>
                  <span className="font-mono text-[11px] text-gray-800">multilingual-e5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Vector Store</span>
                  <span className="font-mono text-[11px] text-gray-800">FAISS (Cosine)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Anti-Hallucination</span>
                  <span className="text-emerald-600 font-medium">Active (Threshold 0.35)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpenPopover(null);
                    onOpenSettings?.();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-medium border border-gray-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === 'notifications' ? null : 'notifications')}
            className="relative p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {openPopover === 'notifications' && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="py-2 divide-y divide-gray-100 max-h-64 overflow-y-auto no-scrollbar">
                {notifications.length === 0 || unreadCount === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">
                    <p>You&apos;re all caught up!</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">No unread notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="py-2.5 first:pt-1 last:pb-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-800">{n.title}</span>
                        <span className="text-[10px] text-gray-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal">{n.desc}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === 'profile' ? null : 'profile')}
            className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs flex items-center justify-center shadow-2xs hover:ring-2 hover:ring-blue-200 transition cursor-pointer"
            title="User menu"
          >
            AR
          </button>

          {openPopover === 'profile' && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-3 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100">
              {/* Profile Header */}
              <div className="pb-3 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shadow-2xs">
                    AR
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-gray-900 truncate">
                      Antigravity Researcher
                    </span>
                    <span className="block text-[10px] text-gray-400 truncate">
                      researcher@chatintelligence.ai
                    </span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-semibold">
                    Admin Demo Mode
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpenPopover(null);
                    onOpenSettings?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                  <span>System Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenPopover(null);
                    onOpenHelp?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span>Help & Shortcuts</span>
                </button>

                {onResetDemo && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenPopover(null);
                      onResetDemo();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-indigo-600 hover:bg-indigo-50/70 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Reset Search State</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};