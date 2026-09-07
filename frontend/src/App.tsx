import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Activity,
  Layers,
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { checkHealth, searchMessages, getAnswer } from './services/api';
import { SearchBar } from './components/SearchBar';
import { FilterBar } from './components/FilterBar';
import { GroundedAnswerCard } from './components/GroundedAnswerCard';
import { SearchResultCard } from './components/SearchResultCard';
import { ContextModal } from './components/ContextModal';
import { SummaryModal } from './components/SummaryModal';
import type { HealthStatus, SearchResponse, AnswerResponse } from './types';

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);

  // Search & Filter State
  const [query, setQuery] = useState<string>('');
  const [sender, setSender] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [topK, setTopK] = useState<number>(10);
  const [generateAnswer, setGenerateAnswer] = useState<boolean>(true);

  // Results & UI State
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [answerData, setAnswerData] = useState<AnswerResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [answerLoading, setAnswerLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Context Modal State
  const [activeContextMessageId, setActiveContextMessageId] = useState<string | null>(null);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSearch = useCallback(
    async (overrideQuery?: string) => {
      const activeQuery = (overrideQuery ?? query).trim();
      if (!activeQuery) return;

      setSearchLoading(true);
      setError(null);
      setSearchResults(null);
      setAnswerData(null);

      try {
        // 1. Vector & Filter Search
        const searchPromise = searchMessages({
          query: activeQuery,
          sender: sender || null,
          start_date: startDate ? `${startDate}T00:00:00Z` : null,
          end_date: endDate ? `${endDate}T23:59:59Z` : null,
          top_k: topK,
          include_context: true,
          context_window: 3,
        });

        // 2. Parallel Grounded QA if toggled
        let answerPromise: Promise<AnswerResponse> | null = null;
        if (generateAnswer) {
          setAnswerLoading(true);
          answerPromise = getAnswer({
            query: activeQuery,
            sender: sender || null,
            start_date: startDate ? `${startDate}T00:00:00Z` : null,
            end_date: endDate ? `${endDate}T23:59:59Z` : null,
            top_k: Math.min(topK, 8),
          });
        }

        const res = await searchPromise;
        setSearchResults(res);

        if (answerPromise) {
          try {
            const aRes = await answerPromise;
            setAnswerData(aRes);
          } catch (aErr) {
            console.error('AI answer generation error:', aErr);
          } finally {
            setAnswerLoading(false);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to retrieve search results');
        }
      } finally {
        setSearchLoading(false);
      }
    },
    [query, sender, startDate, endDate, topK, generateAnswer]
  );

  const handleSelectExample = (exQuery: string) => {
    setQuery(exQuery);
    handleSearch(exQuery);
  };

  const handleResetFilters = () => {
    setSender('');
    setStartDate('');
    setEndDate('');
    setTopK(10);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-sky-500 p-2 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Chat Intelligence
              </span>
              <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                Assessment
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              type="button"
              onClick={() => setSummaryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white font-medium transition cursor-pointer active:scale-95 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Summarizer</span>
            </button>

            <div className="flex items-center space-x-2 text-slate-400 bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-800">
              <Activity
                className={`w-3.5 h-3.5 ${
                  health?.status === 'healthy' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                }`}
              />
              <span className="hidden sm:inline">API Gateway:</span>
              {healthLoading ? (
                <span className="text-amber-400">Checking...</span>
              ) : health?.status === 'healthy' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">Online</span>
              ) : (
                <span className="text-rose-400 font-semibold">Offline</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Bar Section */}
        <section className="space-y-4">
          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={() => handleSearch()}
            loading={searchLoading}
            generateAnswer={generateAnswer}
            setGenerateAnswer={setGenerateAnswer}
            onSelectExample={handleSelectExample}
          />

          <FilterBar
            sender={sender}
            setSender={setSender}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            topK={topK}
            setTopK={setTopK}
            queryAnalysis={searchResults?.query_analysis}
            onReset={handleResetFilters}
          />
        </section>

        {/* Error Toast */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Grounded AI Answer Card */}
        {(generateAnswer || answerData) && (
          <section>
            <GroundedAnswerCard
              answerData={answerData}
              loading={answerLoading}
              onOpenContext={(id) => setActiveContextMessageId(id)}
            />
          </section>
        )}

        {/* Results Stream */}
        {searchResults && (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-850 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  {searchResults.total_matches} messages retrieved
                </span>
                <span>•</span>
                <span className="text-sky-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Hybrid Ranked
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Search latency: {searchResults.latency_ms}ms</span>
              </div>
            </div>

            {searchResults.results.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-slate-850 bg-slate-900/40 p-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">No matching messages</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  No messages matched your query or filter criteria. Try broadening your dates or clearing speaker filters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.results.map((item) => (
                  <SearchResultCard
                    key={item.message.id}
                    item={item}
                    onOpenContext={(id) => setActiveContextMessageId(id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Initial Welcome / Hero State (When no search has run) */}
        {!searchResults && !searchLoading && (
          <section className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/5">
              <Layers className="w-8 h-8" />
            </div>

            <div className="max-w-xl space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Search 4,300+ Group Chat Messages Properly
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Powered by Multilingual E5 vector embeddings, SQLite indexing, explainable hybrid ranking, and strict anti-hallucination grounded answers.
              </p>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full text-xs text-left">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Semantic & Gap Search</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Handles vocabulary mismatch, typos, and Hinglish code-mixing seamlessly.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="font-semibold text-sky-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sender & Time Filters</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Detects participants and temporal bounds ("March 14", "last month") automatically.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Context Threads (±3)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Short replies like "yes" and "done" are grounded in their chronological thread.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Context Timeline Modal */}
      <ContextModal
        messageId={activeContextMessageId}
        onClose={() => setActiveContextMessageId(null)}
      />

      {/* AI Topic Summary Modal */}
      <SummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onOpenContext={(id) => {
          setSummaryModalOpen(false);
          setActiveContextMessageId(id);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 bg-slate-950">
        Chat Intelligence Platform • 4,300 Messages • 8 Participants • 6 Months
      </footer>
    </div>
  );
}
