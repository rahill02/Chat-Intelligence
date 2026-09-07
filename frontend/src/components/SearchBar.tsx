import React from 'react';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
  loading: boolean;
  generateAnswer: boolean;
  setGenerateAnswer: (val: boolean) => void;
  onSelectExample: (q: string) => void;
}

const EXAMPLE_QUERIES = [
  { label: 'Trip Decision', query: 'When did we decide on the trip destination?', category: 'Semantic Gap' },
  { label: "Priya's Budget", query: 'What did Priya say about the budget?', category: 'Attributed' },
  { label: 'March 14 Decisions', query: 'What was decided on March 14?', category: 'Temporal' },
  { label: 'Google Offer (Typos)', query: 'whn did aman gt the google offr?', category: 'Typo/Informal' },
  { label: 'Trip Discussion (Hinglish)', query: 'Priya ne kya bola trip ke baare mein?', category: 'Hinglish' },
  { label: 'Favorite Restaurant', query: "What is Rahul's favorite restaurant?", category: 'Unanswerable' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  setQuery,
  onSearch,
  loading,
  generateAnswer,
  setGenerateAnswer,
  onSelectExample,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch();
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search group chat (e.g. 'What did Priya say about the budget?' or 'March 14 decisions')..."
            className="w-full pl-12 pr-32 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-xl text-sm transition-all"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-24 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-medium text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching</span>
              </>
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>
      </form>

      {/* Controls: AI Answer Toggle & Example Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGenerateAnswer(!generateAnswer)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition cursor-pointer font-medium ${
              generateAnswer
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm shadow-indigo-500/20'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${generateAnswer ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>AI Grounded Answer: {generateAnswer ? 'ON' : 'OFF'}</span>
          </button>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            Synthesizes answers cited directly from messages
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-slate-500 font-medium shrink-0">Try:</span>
          {EXAMPLE_QUERIES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectExample(ex.query)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] transition cursor-pointer active:scale-95"
              title={`${ex.category}: ${ex.query}`}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
