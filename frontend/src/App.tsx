import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
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
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { ConversationsView } from './components/ConversationsView';
import { SavedSearchesView } from './components/SavedSearchesView';
import type { SearchResponse, AnswerResponse, SearchResultItem } from './types';

const CONVERSATION_ID_MAP: Record<string, string> = {
  'College Friends': 'conv_main_group',
  'Project Team': 'conv_project_team',
  'Rahul & Priya': 'conv_rahul_priya',
  'Family Chat': 'conv_family_chat',
};

const CONVERSATION_DEFAULT_QUERIES: Record<string, string> = {
  'College Friends': 'What did Priya say about the budget?',
  'Project Team': 'What is our tech stack for the project?',
  'Rahul & Priya': 'What are our weekend dinner plans?',
  'Family Chat': 'What are the updates on Diwali train tickets?',
};

export default function App() {
  // Navigation & Conversation State
  const [activeNav, setActiveNav] = useState<string>('Search');
  const [activeConversation, setActiveConversation] = useState<string>('College Friends');
  const [insightsPanelOpen, setInsightsPanelOpen] = useState<boolean>(true);

  // Modals
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [activeContextMessageId, setActiveContextMessageId] = useState<string | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);
  const [summaryTopic, setSummaryTopic] = useState<string>('Budget');
  const [directSummaryMode, setDirectSummaryMode] = useState<boolean>(false);

  // Search & Filter State
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

  // Core Search Execution
  const handleSearch = useCallback(
    async (overrideQuery?: string, overrideConv?: string) => {
      const targetQuery = (overrideQuery ?? query).trim();
      if (!targetQuery) return;

      const targetConv = overrideConv ?? activeConversation;
      setSearchLoading(true);
      setError(null);
      setActiveSearchQuery(targetQuery);

      const conversationId = CONVERSATION_ID_MAP[targetConv] || null;

      try {
        // 1. Vector & Hybrid Candidate Search
        const searchPromise = searchMessages({
          query: targetQuery,
          conversation_id: conversationId,
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
          conversation_id: conversationId,
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
    [query, sender, startDate, endDate, topK, activeConversation]
  );

  // Auto-search on initial mount
  useEffect(() => {
    handleSearch('What did Priya say about the budget?');
  }, []);

  // Handle conversation change smoothly
  const handleSelectConversation = useCallback(
    (newConv: string) => {
      setActiveConversation(newConv);
      setSender('');
      setStartDate('');
      setEndDate('');
      const defaultQ = CONVERSATION_DEFAULT_QUERIES[newConv] || 'What was discussed?';
      setQuery(defaultQ);
      handleSearch(defaultQ, newConv);
    },
    [handleSearch]
  );

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

  // Reset entire demo state
  const handleResetDemo = () => {
    handleResetFilters();
    setActiveConversation('College Friends');
    const defaultQ = CONVERSATION_DEFAULT_QUERIES['College Friends'];
    setQuery(defaultQ);
    setActiveNav('Search');
    handleSearch(defaultQ, 'College Friends');
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
    return list;
  }, [searchResults, sortBy]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9FAFB] text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(nav) => {
          if (nav === 'Summaries') {
            setDirectSummaryMode(false);
            setSummaryModalOpen(true);
          } else {
            setActiveNav(nav);
          }
        }}
        onOpenSummaries={() => {
          setDirectSummaryMode(false);
          setSummaryModalOpen(true);
        }}
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
      />

      {/* 2. Center Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          currentSection={activeNav}
          conversationName={activeConversation}
          insightsPanelOpen={insightsPanelOpen}
          onToggleInsights={() => setInsightsPanelOpen((prev) => !prev)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenHelp={() => setHelpModalOpen(true)}
          onResetDemo={handleResetDemo}
        />

        {/* Scrollable Main Container */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8">
          {activeNav === 'Search' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Search Input Section */}
              <SearchHeader
                query={query}
                setQuery={setQuery}
                onSearch={handleSearch}
                loading={searchLoading}
                activeSearchQuery={activeSearchQuery}
                onSelectExample={handleSelectExample}
                conversation={activeConversation}
              />

              {/* Filter Pills */}
              <SearchFilters
                conversation={activeConversation}
                setConversation={handleSelectConversation}
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

              {/* Restore Insights Floating Indicator when panel is hidden */}
              {!insightsPanelOpen && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 text-xs">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-medium">Search Insights panel is hidden</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInsightsPanelOpen(true)}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    Show Insights &rarr;
                  </button>
                </div>
              )}

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
                onSwitchConversation={handleSelectConversation}
                activeSearchQuery={activeSearchQuery}
                onSelectQuery={(q) => {
                  setQuery(q);
                  handleSearch(q);
                }}
              />
            </div>
          )}

          {activeNav === 'Conversations' && (
            <ConversationsView
              onSelectAndSearch={(convName, q) => {
                handleSelectConversation(convName);
                if (q) {
                  setQuery(q);
                  handleSearch(q, convName);
                }
                setActiveNav('Search');
              }}
            />
          )}

          {activeNav === 'Saved Searches' && (
            <SavedSearchesView
              onRunSearch={(savedQuery, savedChannel) => {
                handleSelectConversation(savedChannel);
                setQuery(savedQuery);
                handleSearch(savedQuery, savedChannel);
                setActiveNav('Search');
              }}
            />
          )}
        </main>
      </div>

      {/* 3. Right Search Insights Panel */}
      {insightsPanelOpen && activeNav === 'Search' && (
        <SearchInsightsPanel
          searchResults={searchResults}
          onClose={() => setInsightsPanelOpen(false)}
          onSummarizeTopic={(topic) => {
            setSummaryTopic(topic);
            setDirectSummaryMode(true);
            setSummaryModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <ContextModal
        messageId={activeContextMessageId}
        onClose={() => setActiveContextMessageId(null)}
      />

      <SummaryModal
        isOpen={summaryModalOpen}
        initialTopic={summaryTopic}
        directMode={directSummaryMode}
        onClose={() => setSummaryModalOpen(false)}
        onOpenContext={(id) => {
          setSummaryModalOpen(false);
          setActiveContextMessageId(id);
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
}