import React from 'react';
import {
  Search,
  MessageSquare,
  FileText,
  Bookmark,
  Users,
  Hash,
  MessageCircle,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeNav?: string;
  onSelectNav?: (nav: string) => void;
  onOpenSummaries: () => void;
  activeConversation?: string;
  onSelectConversation?: (conv: string) => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

const RECENT_CONVERSATIONS = [
  {
    id: 'College Friends',
    name: 'College Friends',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    count: '4.3k',
  },
  {
    id: 'Project Team',
    name: 'Project Team',
    icon: Hash,
    color: 'bg-amber-100 text-amber-600',
    count: '20',
  },
  {
    id: 'Rahul & Priya',
    name: 'Rahul & Priya',
    icon: MessageCircle,
    color: 'bg-purple-100 text-purple-600',
    count: '14',
  },
  {
    id: 'Family Chat',
    name: 'Family Chat',
    icon: Users,
    color: 'bg-emerald-100 text-emerald-600',
    count: '14',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav = 'Search',
  onSelectNav,
  onOpenSummaries,
  activeConversation = 'College Friends',
  onSelectConversation,
  onOpenSettings,
  onOpenHelp,
}) => {
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200/80 flex flex-col justify-between h-screen sticky top-0 select-none">
      {/* Top section: Logo & Nav */}
      <div className="p-4 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-[15px] text-gray-900 tracking-tight leading-none">
              Chat Intelligence
            </h1>
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block mt-1">
              CONVERSATION OS
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectNav?.('Search')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeNav === 'Search'
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Search className={`w-4 h-4 ${activeNav === 'Search' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectNav?.('Conversations')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeNav === 'Conversations'
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageSquare
              className={`w-4 h-4 ${activeNav === 'Conversations' ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <span>Conversations</span>
          </button>

          <button
            type="button"
            onClick={onOpenSummaries}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeNav === 'Summaries'
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FileText
              className={`w-4 h-4 ${activeNav === 'Summaries' ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <span>Summaries</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectNav?.('Saved Searches')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeNav === 'Saved Searches'
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${activeNav === 'Saved Searches' ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <span>Saved Searches</span>
          </button>
        </nav>

        {/* Recent Conversations */}
        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 block mb-2">
            RECENT CONVERSATIONS
          </span>
          <div className="space-y-1">
            {RECENT_CONVERSATIONS.map((conv) => {
              const Icon = conv.icon;
              const isSelected = activeConversation === conv.name && activeNav === 'Search';
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    onSelectNav?.('Search');
                    onSelectConversation?.(conv.name);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-gray-100/80 text-gray-900 font-semibold shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${conv.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate flex-1 text-left">{conv.name}</span>
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ${
                      isSelected ? 'bg-gray-200/80 text-gray-700 font-semibold' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {conv.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom section: Settings & Help */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition cursor-pointer"
        >
          <Settings className="w-4 h-4 text-gray-400" />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={onOpenHelp}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <span>Help & Documentation</span>
        </button>
      </div>
    </aside>
  );
};