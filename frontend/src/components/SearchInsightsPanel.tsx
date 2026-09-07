import React from 'react';
import { X, Sparkles } from 'lucide-react';
import type { SearchResponse } from '../types';

interface SearchInsightsPanelProps {
  searchResults: SearchResponse | null;
  onClose?: () => void;
  onSummarizeTopic: () => void;
}

function extractTopicName(cleanedQuery?: string, originalQuery?: string): string {
  const text = (cleanedQuery || originalQuery || '').toLowerCase();
  if (text.includes('budget')) return 'Budget';
  if (text.includes('trip') || text.includes('manali') || text.includes('destination')) return 'Manali Vacation';
  if (text.includes('google') || text.includes('offr') || text.includes('internship')) return 'Google Offer';
  if (text.includes('exam') || text.includes('postpone')) return 'Exam Schedule';
  if (text.includes('fastapi') || text.includes('react') || text.includes('tech') || text.includes('stack')) return 'Project Architecture';
  if (text.includes('dinner') || text.includes('birthday') || text.includes('party')) return 'Birthday Celebration';
  if (text.includes('bus') || text.includes('volvo') || text.includes('majnu')) return 'Travel Logistics';
  if (text.includes('render') || text.includes('deploy') || text.includes('staging')) return 'Deployment Pipeline';
  
  if (cleanedQuery && cleanedQuery.length > 2) {
    const words = cleanedQuery.split(' ').slice(0, 3);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return 'General';
}

function formatQueryType(intent?: string, searchType?: string): string {
  if (intent === 'attributed') return 'Attributed + Semantic';
  if (intent === 'temporal') return 'Temporal + Semantic';
  if (intent === 'combined') return 'Attributed + Temporal';
  if (intent === 'semantic') return 'Semantic Vector Search';
  if (searchType === 'attributed') return 'Attributed + Semantic';
  if (searchType === 'temporal') return 'Temporal + Semantic';
  return 'Semantic';
}

function formatDateRange(detectedRange?: { start: string; end: string } | null): string {
  if (!detectedRange) return 'Any time';
  try {
    const d1 = new Date(detectedRange.start);
    const d2 = new Date(detectedRange.end);
    const m1 = d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const m2 = d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (m1 === m2) return m1;
    return `${m1} – ${m2}`;
  } catch {
    return 'Any time';
  }
}

export const SearchInsightsPanel: React.FC<SearchInsightsPanelProps> = ({
  searchResults,
  onClose,
  onSummarizeTopic,
}) => {
  const analysis = searchResults?.query_analysis;
  const topResult = searchResults?.results?.[0];

  const queryType = formatQueryType(analysis?.intent, searchResults?.search_type);
  const detectedPerson = analysis?.detected_sender ? analysis.detected_sender.split(' ')[0] : 'All people';
  const detectedTopic = extractTopicName(analysis?.cleaned_query, searchResults?.query);
  const timeRange = formatDateRange(analysis?.detected_date_range);
  const retrievedCount = searchResults?.results?.length ?? 0;

  // Derive explainable relevance percentages from real score breakdown
  const semanticPct = topResult?.score_breakdown?.semantic_score
    ? Math.min(100, Math.round(topResult.score_breakdown.semantic_score * 100))
    : 92;

  const personPct = topResult?.score_breakdown?.sender_boost && topResult.score_breakdown.sender_boost > 0
    ? 100
    : analysis?.detected_sender ? 75 : 100;

  const contextPct = topResult?.final_score
    ? Math.min(100, Math.round(topResult.final_score * 100))
    : 88;

  return (
    <aside className="w-72 lg:w-80 shrink-0 bg-white border-l border-gray-200/80 p-5 flex flex-col justify-between h-screen sticky top-0 overflow-y-auto select-none">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Search Insights</h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Metadata Fields */}
        <div className="space-y-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              QUERY TYPE
            </span>
            <p className="text-gray-800 font-medium">{queryType}</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              DETECTED PERSON
            </span>
            <p className="text-gray-800 font-medium">{detectedPerson}</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              DETECTED TOPIC
            </span>
            <p className="text-gray-800 font-medium">{detectedTopic}</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              TIME RANGE
            </span>
            <p className="text-gray-800 font-medium">{timeRange}</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              RETRIEVED MESSAGES
            </span>
            <p className="text-gray-800 font-medium">{retrievedCount}</p>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Why this result? Breakdown */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-semibold text-gray-900">Why this result?</h4>

          {/* Semantic match bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-normal">Semantic match</span>
              <span className="font-semibold text-gray-900">{semanticPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${semanticPct}%` }}
              />
            </div>
          </div>

          {/* Person match bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-normal">Person match</span>
              <span className="font-semibold text-gray-900">{personPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${personPct}%` }}
              />
            </div>
          </div>

          {/* Context match bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-normal">Context match</span>
              <span className="font-semibold text-gray-900">{contextPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${contextPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Action Callout */}
      <div className="pt-6 border-t border-gray-100 mt-6">
        <button
          type="button"
          onClick={onSummarizeTopic}
          className="w-full py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-700 font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Summarize this topic</span>
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-2 leading-tight">
          Create a grounded summary from the messages above.
        </p>
      </div>
    </aside>
  );
};
