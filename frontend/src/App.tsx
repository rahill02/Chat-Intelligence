import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { searchMessages, getAnswer } from './services/api';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SearchHeader } from './components/SearchHeader';
import { SearchFilters } from './components/SearchFilters';
import { AIAnswerCard } from './components/AIAnswerCard';
import { ConversationThread } from './components/ConversationThread';
import { SearchInsightsPanel } from './components/SearchInsightsPanel';
import { ContextModal } from './components/ContextModal';
import { SummaryModal } from './components/SummaryModal';
import type { SearchResponse, AnswerResponse, SearchResultItem } from './types';

export default function App() {
  // Navigation & Conversation State
  const [activeNav, setActiveNav] = useState<string>('Search');
  const [activeConversation, setActiveConversation] = useState<string>('College Friends');
  const [insightsPanelOpen, setInsightsPanelOpen] = useState<boolean>(true);

  // Search & Filter State (Default initialized to match reference query)
  const [query, setQuery] = useState<string>('What did Priya say about the budget?');
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('What did Priya say about the budget?');
  const [sender, setSender] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Relevance');
  const [topK, setTopK] = useState<number>(10);

  // Results & Loading State
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [answerData, setAnswerData] = useState<AnswerResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [answerLoading, setAnswerLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [activeContextMessageId, setActiveContextMessageId] = useState<string | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);

  // Core Search Execution (Preserving all API logic and query flows)
  const handleSearch = useCallback(
    async (overrideQuery?: string) => {
      const targetQuery = (overrideQuery ?? query).trim();
      if (!targetQuery) return;

      setSearchLoading(true);
      setError(null);
      setActiveSearchQuery(targetQuery);

      try {
        // 1. Vector & Hybrid Candidate Search
        const searchPromise = searchMessages({
          query: targetQuery,
          sender: sender || null,
          start_date: startDate ? `${startDate}T00:00:00Z` : null,
          end_date: endDate ? `${endDate}T23:59:59Z` : null,
          top_k: topK,
          include_context: true,
          context_window: 3,
        });

        // 2. Grounded AI QA Generation
        setAnswerLoading(true);
        const answerPromise = getAnswer({
          query: targetQuery,
          sender: sender || null,
          start_date: startDate ? `${startDate}T00:00:00Z` : null,
          end_date: endDate ? `${endDate}T23:59:59Z` : null,
          top_k: Math.min(topK, 8),
        });

        const res = await searchPromise;
        setSearchResults(res);

        try {
          const aRes = await answerPromise;
          setAnswerData(aRes);
        } catch (aErr) {
          console.error('AI answer generation error:', aErr);
        } finally {
          setAnswerLoading(false);
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
    [query, sender, startDate, endDate, topK]
  );

  // Auto-search on initial mount so reference state renders immediately with real data
  useEffect(() => {
    handleSearch('What did Priya say about the budget?');
  }, []);

  // Re-trigger search when sender, dates, or topK filters change
  useEffect(() => {
    if (activeSearchQuery) {
      handleSearch(activeSearchQuery);
    }
  }, [sender, startDate, endDate, topK]);

  // Handle example query selection
  const handleSelectExample = (exQuery: string) => {
    setQuery(exQuery);
    handleSearch(exQuery);
  };

  // Reset filter state
  const handleResetFilters = () => {
    setSender('');
    setStartDate('');
    setEndDate('');
    setSortBy('Relevance');
    setTopK(10);
  };

  // Sorted Results based on selected Sort filter
  const displayedResults: SearchResultItem[] = useMemo(() => {
    if (!searchResults?.results) return [];
    const list = [...searchResults.results];
    if (sortBy === 'Newest first') {
      return list.sort(
        (a, b) => new Date(b.message.timestamp).getTime() - new Date(a.message.timestamp).getTime()
      );
    }
    if (sortBy === 'Oldest first') {
      return list.sort(
        (a, b) => new Date(a.message.timestamp).getTime() - new Date(b.message.timestamp).getTime()
      );
    }
    // Default 'Relevance' retains hybrid score order
    return list;
  }, [searchResults, sortBy]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9FAFB] text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(nav) => {
          setActiveNav(nav);
          if (nav === 'Summaries') setSummaryModalOpen(true);
        }}
        onOpenSummaries={() => setSummaryModalOpen(true)}
        activeConversation={activeConversation}
        onSelectConversation={(conv) => setActiveConversation(conv)}
      />

      {/* 2. Center Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          currentSection={activeNav}
          conversationName={activeConversation}
        />

        {/* Scrollable Center Container */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Search Input Section */}
            <SearchHeader
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              loading={searchLoading}
              activeSearchQuery={activeSearchQuery}
              onSelectExample={handleSelectExample}
            />

            {/* Filter Pills */}
            <SearchFilters
              conversation={activeConversation}
              setConversation={setActiveConversation}
              sender={sender}
              setSender={setSender}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onReset={handleResetFilters}
            />

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Grounded AI Answer Card */}
            <AIAnswerCard
              answerData={answerData}
              loading={answerLoading}
              totalSourcesCount={searchResults?.results?.length ?? 4}
              onViewSources={() => {
                if (searchResults?.results?.[0]) {
                  setActiveContextMessageId(searchResults.results[0].message.id);
                }
              }}
            />

            {/* Relevant Conversation Stream */}
            <ConversationThread
              conversationName={activeConversation}
              results={displayedResults}
              onOpenContext={(messageId) => setActiveContextMessageId(messageId)}
            />
          </div>
        </main>
      </div>

      {/* 3. Right Search Insights Panel */}
      {insightsPanelOpen && (
        <SearchInsightsPanel
          searchResults={searchResults}
          onClose={() => setInsightsPanelOpen(false)}
          onSummarizeTopic={() => setSummaryModalOpen(true)}
        />
      )}

      {/* Reusable Context Modal */}
      <ContextModal
        messageId={activeContextMessageId}
        onClose={() => setActiveContextMessageId(null)}
      />

      {/* Reusable AI Summary Modal */}
      <SummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onOpenContext={(id) => {
          setSummaryModalOpen(false);
          setActiveContextMessageId(id);
        }}
      />
    </div>
  );
}
