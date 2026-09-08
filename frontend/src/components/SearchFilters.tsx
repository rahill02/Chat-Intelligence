import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  User,
  Clock,
  LayoutGrid,
  ChevronDown,
  RotateCcw,
  Search,
  Check,
  Users,
  Hash,
  MessageCircle,
  Calendar,
  ArrowDownUp,
} from 'lucide-react';

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
  { id: 'College Friends', name: 'College Friends', icon: Users, color: 'bg-blue-100 text-blue-600' },
  { id: 'Project Team', name: 'Project Team', icon: Hash, color: 'bg-amber-100 text-amber-600' },
  { id: 'Rahul & Priya', name: 'Rahul & Priya', icon: MessageCircle, color: 'bg-purple-100 text-purple-600' },
  { id: 'Family Chat', name: 'Family Chat', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
];

const CONVERSATION_PARTICIPANTS: Record<string, Array<{ name: string; color: string }>> = {
  'College Friends': [
    { name: 'Rahul Sharma', color: 'bg-blue-100 text-blue-700' },
    { name: 'Priya Patel', color: 'bg-purple-100 text-purple-700' },
    { name: 'Aman Verma', color: 'bg-sky-100 text-sky-700' },
    { name: 'Sneha Rao', color: 'bg-pink-100 text-pink-700' },
    { name: 'Vikram Singh', color: 'bg-amber-100 text-amber-700' },
    { name: 'Neha Gupta', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Rohan Mehta', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Ananya Joshi', color: 'bg-rose-100 text-rose-700' },
  ],
  'Project Team': [
    { name: 'Aman Verma', color: 'bg-sky-100 text-sky-700' },
    { name: 'Sneha Rao', color: 'bg-pink-100 text-pink-700' },
    { name: 'Rohan Mehta', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Ananya Joshi', color: 'bg-rose-100 text-rose-700' },
  ],
  'Rahul & Priya': [
    { name: 'Rahul Sharma', color: 'bg-blue-100 text-blue-700' },
    { name: 'Priya Patel', color: 'bg-purple-100 text-purple-700' },
  ],
  'Family Chat': [
    { name: 'Rahul Sharma', color: 'bg-blue-100 text-blue-700' },
    { name: 'Anita Sharma', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Rajesh Sharma', color: 'bg-cyan-100 text-cyan-700' },
    { name: 'Pooja Sharma', color: 'bg-fuchsia-100 text-fuchsia-700' },
  ],
};

const TIME_PRESETS = [
  { label: 'Any time', start: '', end: '', desc: 'All 6 months history' },
  { label: 'March 2026', start: '2026-03-01', end: '2026-03-31', desc: 'Trip planning & destination' },
  { label: 'April 2026', start: '2026-04-01', end: '2026-04-30', desc: 'Project tech stack setup' },
  { label: 'May 2026', start: '2026-05-01', end: '2026-05-31', desc: 'NeuralByte hackathon' },
  { label: 'June 2026', start: '2026-06-01', end: '2026-06-30', desc: 'Semester exams & notes' },
  { label: 'July 2026', start: '2026-07-01', end: '2026-07-31', desc: 'Google offer announcements' },
  { label: 'August 2026', start: '2026-08-01', end: '2026-08-31', desc: 'Priya\'s surprise dinner' },
];

const SORT_OPTIONS = [
  { id: 'Relevance', label: 'Relevance', desc: 'Hybrid semantic vector & score rank' },
  { id: 'Newest first', label: 'Newest first', desc: 'Latest chronological order' },
  { id: 'Oldest first', label: 'Oldest first', desc: 'Earliest chronological order' },
];

type OpenDropdown = 'conversation' | 'person' | 'time' | 'sort' | null;

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
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [personSearch, setPersonSearch] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Active conversation participants
  const activeParticipants = CONVERSATION_PARTICIPANTS[conversation] || CONVERSATION_PARTICIPANTS['College Friends'];

  // Auto-reset sender if the selected person is not in the active conversation
  useEffect(() => {
    if (sender && !activeParticipants.some((p) => p.name === sender)) {
      setSender('');
    }
  }, [conversation, sender, setSender, activeParticipants]);

  // Filter participants based on search query
  const filteredParticipants = activeParticipants.filter((p) =>
    p.name.toLowerCase().includes(personSearch.toLowerCase().trim())
  );

  const currentTimePreset =
    TIME_PRESETS.find((t) => t.start === startDate && t.end === endDate)?.label ||
    (startDate ? 'Custom Range' : 'Any time');

  const hasActiveFilters = Boolean(sender || startDate || endDate || sortBy !== 'Relevance');

  const toggleDropdown = (name: OpenDropdown) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(name);
      if (name === 'person') setPersonSearch('');
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-2.5 pt-1 z-20">
      {/* 1. Conversation Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('conversation')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-2xs transition cursor-pointer select-none ${
            openDropdown === 'conversation'
              ? 'border-indigo-400 bg-white ring-2 ring-indigo-100 text-gray-900'
              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400 font-normal">Conversation</span>
          <span className="font-semibold text-gray-800">{conversation}</span>
          <ChevronDown
            className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${
              openDropdown === 'conversation' ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {openDropdown === 'conversation' && (
          <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-gray-200/90 rounded-2xl shadow-xl shadow-gray-900/5 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Select Conversation
            </div>
            {CONVERSATIONS.map((c) => {
              const Icon = c.icon;
              const isSelected = conversation === c.name;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setConversation(c.name);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${c.color}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span>{c.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Person Custom Floating Popover (Linear / Notion Style) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('person')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-2xs transition cursor-pointer select-none ${
            openDropdown === 'person'
              ? 'border-indigo-400 bg-white ring-2 ring-indigo-100 text-gray-900'
              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
          }`}
        >
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400 font-normal">Person</span>
          <span className="font-semibold text-gray-800">{sender ? sender.split(' ')[0] : 'All people'}</span>
          <ChevronDown
            className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${
              openDropdown === 'person' ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {openDropdown === 'person' && (
          <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-gray-200/90 rounded-2xl shadow-xl shadow-gray-900/5 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
            {/* Search Person Input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative flex items-center bg-gray-50/80 rounded-xl px-2.5 py-1.5 border border-gray-200/60 focus-within:border-indigo-400 focus-within:bg-white transition">
                <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={personSearch}
                  onChange={(e) => setPersonSearch(e.target.value)}
                  placeholder="Search people..."
                  className="w-full bg-transparent text-xs text-gray-800 placeholder:text-gray-400 outline-none font-normal"
                />
              </div>
            </div>

            {/* People List */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
              {/* "All people" Option */}
              {!personSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setSender('');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                    sender === ''
                      ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-medium">All people</span>
                      <span className="block text-[10px] text-gray-400">{activeParticipants.length} participants</span>
                    </div>
                  </div>
                  {sender === '' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              )}

              {/* Filtered Participant Rows */}
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((p) => {
                  const isSelected = sender === p.name;
                  const initials = p.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('');

                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setSender(p.name);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${p.color}`}
                        >
                          {initials}
                        </div>
                        <span className="font-medium text-left">{p.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No person found matching "{personSearch}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Time Custom Floating Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('time')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-2xs transition cursor-pointer select-none ${
            openDropdown === 'time'
              ? 'border-indigo-400 bg-white ring-2 ring-indigo-100 text-gray-900'
              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400 font-normal">Time</span>
          <span className="font-semibold text-gray-800">{currentTimePreset}</span>
          <ChevronDown
            className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${
              openDropdown === 'time' ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {openDropdown === 'time' && (
          <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-gray-200/90 rounded-2xl shadow-xl shadow-gray-900/5 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Filter by Date Range
            </div>
            {TIME_PRESETS.map((t) => {
              const isSelected = currentTimePreset === t.label;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setStartDate(t.start);
                    setEndDate(t.end);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <span className="block font-medium">{t.label}</span>
                      <span className="block text-[10px] text-gray-400">{t.desc}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Sort Custom Floating Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown('sort')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-2xs transition cursor-pointer select-none ${
            openDropdown === 'sort'
              ? 'border-indigo-400 bg-white ring-2 ring-indigo-100 text-gray-900'
              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400 font-normal">Sort</span>
          <span className="font-semibold text-gray-800">{sortBy}</span>
          <ChevronDown
            className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${
              openDropdown === 'sort' ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {openDropdown === 'sort' && (
          <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-gray-200/90 rounded-2xl shadow-xl shadow-gray-900/5 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Sort Results By
            </div>
            {SORT_OPTIONS.map((s) => {
              const isSelected = sortBy === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSortBy(s.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowDownUp className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <span className="block font-medium">{s.label}</span>
                      <span className="block text-[10px] text-gray-400">{s.desc}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset Filters */}
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
