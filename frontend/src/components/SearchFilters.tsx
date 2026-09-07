import React from 'react';
import { MessageSquare, User, Clock, LayoutGrid, ChevronDown, RotateCcw } from 'lucide-react';

interface SearchFiltersProps {
  conversation: string;
  setConversation: (c: string) => void;
  sender: string;
  setSender: (s: string) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  onReset?: () => void;
}

const CONVERSATIONS = [
  'College Friends',
  'Project Team',
  'Rahul & Priya',
  'Family Chat',
];

const PARTICIPANTS = [
  'Rahul Sharma',
  'Priya Patel',
  'Aman Verma',
  'Sneha Rao',
  'Vikram Singh',
  'Neha Gupta',
  'Rohan Mehta',
  'Ananya Joshi',
];

const TIME_PRESETS = [
  { label: 'Any time', start: '', end: '' },
  { label: 'March 2026', start: '2026-03-01', end: '2026-03-31' },
  { label: 'April 2026', start: '2026-04-01', end: '2026-04-30' },
  { label: 'May 2026', start: '2026-05-01', end: '2026-05-31' },
  { label: 'June 2026', start: '2026-06-01', end: '2026-06-30' },
  { label: 'July 2026', start: '2026-07-01', end: '2026-07-31' },
  { label: 'August 2026', start: '2026-08-01', end: '2026-08-31' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  conversation,
  setConversation,
  sender,
  setSender,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  sortBy,
  setSortBy,
  onReset,
}) => {
  const currentTimePreset =
    TIME_PRESETS.find((t) => t.start === startDate && t.end === endDate)?.label ||
    (startDate ? 'Custom Range' : 'Any time');

  const hasActiveFilters = Boolean(sender || startDate || endDate || sortBy !== 'Relevance');

  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-1">
      {/* Conversation Filter */}
      <div className="relative inline-flex items-center">
        <label htmlFor="conv-select" className="sr-only">Conversation</label>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-xs font-medium text-gray-700 shadow-2xs transition cursor-pointer">
          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Conversation</span>
          <span className="font-semibold text-gray-800">{conversation}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
        <select
          id="conv-select"
          value={conversation}
          onChange={(e) => setConversation(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        >
          {CONVERSATIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Person Filter */}
      <div className="relative inline-flex items-center">
        <label htmlFor="person-select" className="sr-only">Person</label>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-xs font-medium text-gray-700 shadow-2xs transition cursor-pointer">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Person</span>
          <span className="font-semibold text-gray-800">{sender || 'All people'}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
        <select
          id="person-select"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        >
          <option value="">All people</option>
          {PARTICIPANTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Time Filter */}
      <div className="relative inline-flex items-center">
        <label htmlFor="time-select" className="sr-only">Time</label>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-xs font-medium text-gray-700 shadow-2xs transition cursor-pointer">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Time</span>
          <span className="font-semibold text-gray-800">{currentTimePreset}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
        <select
          id="time-select"
          value={currentTimePreset}
          onChange={(e) => {
            const found = TIME_PRESETS.find((t) => t.label === e.target.value);
            if (found) {
              setStartDate(found.start);
              setEndDate(found.end);
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        >
          {TIME_PRESETS.map((t) => (
            <option key={t.label} value={t.label}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Filter */}
      <div className="relative inline-flex items-center">
        <label htmlFor="sort-select" className="sr-only">Sort</label>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-xs font-medium text-gray-700 shadow-2xs transition cursor-pointer">
          <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400">Sort</span>
          <span className="font-semibold text-gray-800">{sortBy}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        >
          <option value="Relevance">Relevance</option>
          <option value="Newest first">Newest first</option>
          <option value="Oldest first">Oldest first</option>
        </select>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-medium transition cursor-pointer"
          title="Reset active filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
