import React, { useState } from 'react';
import {
  Bookmark,
  Search,
  ArrowRight,
  Trash2,
  Users,
  Hash,
  MessageCircle,
  Pin,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SavedSearchItem {
  id: string;
  query: string;
  channel: string;
  tag: string;
  tagColor: string;
  isPinned: boolean;
  savedAt: string;
}

interface SavedSearchesViewProps {
  onRunSearch: (query: string, channel: string) => void;
}

const DEFAULT_SAVED_SEARCHES: SavedSearchItem[] = [
  {
    id: 's-1',
    query: 'What did Priya say about the budget?',
    channel: 'College Friends',
    tag: 'Finance',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isPinned: true,
    savedAt: '2 hours ago',
  },
  {
    id: 's-2',
    query: 'What is our tech stack for the project?',
    channel: 'Project Team',
    tag: 'Architecture',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    isPinned: true,
    savedAt: 'Yesterday',
  },
  {
    id: 's-3',
    query: 'whn did aman gt the google offr?',
    channel: 'College Friends',
    tag: 'Career',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    isPinned: false,
    savedAt: '3 days ago',
  },
  {
    id: 's-4',
    query: 'What are the updates on Diwali train tickets?',
    channel: 'Family Chat',
    tag: 'Travel',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    isPinned: false,
    savedAt: '5 days ago',
  },
  {
    id: 's-5',
    query: 'What are our weekend dinner plans?',
    channel: 'Rahul & Priya',
    tag: 'Personal',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    isPinned: false,
    savedAt: '1 week ago',
  },
  {
    id: 's-6',
    query: 'Docker containerization setup',
    channel: 'Project Team',
    tag: 'DevOps',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    isPinned: false,
    savedAt: '2 weeks ago',
  },
];

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  'College Friends': Users,
  'Project Team': Hash,
  'Rahul & Priya': MessageCircle,
  'Family Chat': Users,
};

export const SavedSearchesView: React.FC<SavedSearchesViewProps> = ({ onRunSearch }) => {
  const [items, setItems] = useState<SavedSearchItem[]>(DEFAULT_SAVED_SEARCHES);

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  const handleRestoreDefaults = () => {
    setItems(DEFAULT_SAVED_SEARCHES);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Bookmarked Queries</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            Saved Searches
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-normal">
            Quick access to frequent queries, tagged questions, and pinned conversations.
          </p>
        </div>

        {items.length < DEFAULT_SAVED_SEARCHES.length && (
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 shadow-2xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Restore Defaults</span>
          </button>
        )}
      </div>

      {/* List or Empty State */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No saved searches</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
            You have cleared all bookmarked searches. You can restore the default curated searches anytime.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default Searches</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const ChannelIcon = CHANNEL_ICONS[item.channel] || MessageCircle;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs hover:border-gray-300 transition-all flex items-center justify-between gap-4 group"
              >
                {/* Left: Query & Metadata */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        <span>Pinned</span>
                      </span>
                    )}

                    {/* Channel Pill */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      <ChannelIcon className="w-3 h-3 text-gray-500" />
                      <span>{item.channel}</span>
                    </span>

                    {/* Category Tag */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${item.tagColor}`}
                    >
                      {item.tag}
                    </span>

                    <span className="text-[11px] text-gray-400 font-normal">
                      Saved {item.savedAt}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition truncate">
                    &ldquo;{item.query}&rdquo;
                  </p>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Pin Toggle */}
                  <button
                    type="button"
                    onClick={() => handleTogglePin(item.id)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      item.isPinned
                        ? 'border-amber-200 bg-amber-50 text-amber-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title={item.isPinned ? 'Unpin search' : 'Pin search'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-current' : ''}`} />
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Remove from saved searches"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Run Search Button */}
                  <button
                    type="button"
                    onClick={() => onRunSearch(item.query, item.channel)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-98"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Run Search</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tip Banner */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/60 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Tip: You can bookmark any search directly from the results stream or filter presets.</span>
        </div>
        <span className="font-mono text-[11px] text-gray-400">Total Saved: {items.length}</span>
      </div>
    </div>
  );
};