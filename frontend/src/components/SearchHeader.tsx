import React, { useRef, useEffect } from 'react';
import { Search, Send, Loader2, X } from 'lucide-react';

interface SearchHeaderProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (overrideQuery?: string) => void;
  loading: boolean;
  activeSearchQuery?: string;
  onSelectExample: (q: string) => void;
  conversation?: string;
}

const CONVERSATION_EXAMPLES: Record<string, string[]> = {
  'College Friends': [
    'What did Priya say about the budget?',
    'When did we decide on the trip destination?',
    'whn did aman gt the google offr?',
    'Where did Aman deploy the staging build?',
    'What is Rahul\'s favorite restaurant?',
  ],
  'Project Team': [
    'What is our tech stack for the project?',
    'FastAPI backend setup',
    'React 19 with Vite frontend',
    'Docker containerization setup',
    'When is the hackathon MVP deadline?',
  ],
  'Rahul & Priya': [
    'What are our weekend dinner plans?',
    'Did we confirm Olive Bistro reservation?',
    'System design book recommendations',
    'Movie show timings for Sunday',
  ],
  'Family Chat': [
    'What are the updates on Diwali train tickets?',
    'When is Sunday family dinner?',
    'Did Rahul book the Shatabdi tickets?',
    'Kaju Katli sweets from hostel',
  ],
};

const CONVERSATION_PLACEHOLDERS: Record<string, string> = {
  'College Friends': 'What did Priya say about the budget?',
  'Project Team': 'What is our tech stack for the project?',
  'Rahul & Priya': 'What are our weekend dinner plans?',
  'Family Chat': 'What are the updates on Diwali train tickets?',
};

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  query,
  setQuery,
  onSearch,
  loading,
  activeSearchQuery,
  onSelectExample,
  conversation = 'College Friends',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const examples = CONVERSATION_EXAMPLES[conversation] || CONVERSATION_EXAMPLES['College Friends'];
  const placeholder = CONVERSATION_PLACEHOLDERS[conversation] || 'Search messages...';

  // Keyboard shortcut (Cmd/Ctrl + K to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
          Search your conversations
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-normal">
          Find the context behind every message.
        </p>
      </div>

      {/* Large Search Input Box */}
      <form onSubmit={handleSubmit} className="relative mt-5">
        <div className="relative flex items-center bg-white border border-gray-200/90 rounded-2xl shadow-xs hover:border-gray-300 focus-within:border-indigo-400 focus-within:ring-3 focus-within:ring-indigo-50 transition-all">
          {/* Search Icon */}
          <div className="pl-4.5 pr-2 pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full py-4 pr-28 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none font-normal"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mr-2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Keyboard shortcut hint */}
          <div className="hidden sm:flex items-center mr-2 select-none pointer-events-none">
            <kbd className="border border-gray-200 rounded px-1.5 py-0.5 text-[11px] text-gray-400 font-mono bg-gray-50/50">
              ⌘ K
            </kbd>
          </div>

          {/* Send / Search Button */}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="mr-2.5 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 shrink-0"
            title="Search"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </form>

      {/* Sub-search helper / Active query indicator */}
      {activeSearchQuery && (
        <div className="text-xs text-gray-400 font-normal px-1">
          Searching for <span className="text-gray-700 font-medium">"{activeSearchQuery}"</span> in <span className="text-indigo-600 font-medium">{conversation}</span>
        </div>
      )}

      {/* Quick Example Query Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs no-scrollbar">
        <span className="text-gray-400 shrink-0 text-[11px] font-medium">Examples:</span>
        {examples.map((eq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectExample(eq)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-gray-100/70 hover:bg-gray-200/80 border border-gray-200/60 text-gray-600 hover:text-gray-900 text-[11px] transition cursor-pointer active:scale-98"
          >
            {eq}
          </button>
        ))}
      </div>
    </div>
  );
};
