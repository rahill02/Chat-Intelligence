import React from 'react';
import { ExternalLink, Search, Users, ArrowRight } from 'lucide-react';
import type { SearchResultItem } from '../types';

interface ConversationThreadProps {
  conversationName?: string;
  results: SearchResultItem[];
  onOpenContext: (messageId: string) => void;
  highlights?: string[];
  onSwitchConversation?: (conv: string) => void;
  activeSearchQuery?: string;
  onSelectQuery?: (q: string) => void;
}

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  'Rahul Sharma': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Priya Patel': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Aman Verma': { bg: 'bg-sky-100', text: 'text-sky-700' },
  'Sneha Rao': { bg: 'bg-pink-100', text: 'text-pink-700' },
  'Vikram Singh': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Neha Gupta': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Rohan Mehta': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Ananya Joshi': { bg: 'bg-rose-100', text: 'text-rose-700' },
  'Anita Sharma': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Rajesh Sharma': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Pooja Sharma': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
};

const SUGGESTED_QUERIES: Record<string, string[]> = {
  'College Friends': [
    'What did Priya say about the budget?',
    'When is the NeuralByte hackathon?',
    'Who received the Google offer?',
    'Where are we going for the trip?',
  ],
  'Project Team': [
    'FastAPI backend setup',
    'React frontend components',
    'Docker containerization',
    'API documentation endpoints',
  ],
  'Rahul & Priya': [
    'Dinner plans for tonight',
    'Weekend movie tickets',
    'Coffee meetup tomorrow',
    'Book recommendation',
  ],
  'Family Chat': [
    'Train tickets for Diwali',
    'Sunday family dinner',
    'Diwali sweets preparation',
    'Trip photos shared',
  ],
};

function formatMessageDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).replace(',', ' ·');
  } catch {
    return isoString;
  }
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  conversationName = 'College Friends',
  results,
  onOpenContext,
  onSwitchConversation,
  activeSearchQuery,
  onSelectQuery,
}) => {
  if (results.length === 0) {
    const suggestions = SUGGESTED_QUERIES[conversationName] || SUGGESTED_QUERIES['College Friends'];
    const isCollegeFriends = conversationName === 'College Friends';

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200/90 bg-white p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            No matching messages in &ldquo;{conversationName}&rdquo;
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            {activeSearchQuery ? (
              <>
                We couldn&apos;t find any messages matching{' '}
                <span className="font-semibold text-gray-700">&ldquo;{activeSearchQuery}&rdquo;</span> in this conversation thread.
              </>
            ) : (
              'Try entering a keyword or adjusting your filters to find relevant messages.'
            )}
          </p>

          {!isCollegeFriends && onSwitchConversation && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => onSwitchConversation('College Friends')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Search in College Friends (4,300+ msgs)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Suggestions for this channel */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2.5">
              Try suggested queries for {conversationName}
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => onSelectQuery?.(sug)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-xs font-medium text-gray-700 transition cursor-pointer"
                >
                  &ldquo;{sug}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine top date for header
  const firstDate = results[0]?.message.timestamp
    ? new Date(results[0].message.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  // Highlight keywords helper
  const renderHighlightedContent = (text: string, kwList: string[]) => {
    if (!kwList || kwList.length === 0) return text;
    const regexPattern = new RegExp(
      `(${kwList.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'gi'
    );
    const parts = text.split(regexPattern);
    return parts.map((part, idx) => {
      const isMatch = kwList.some((k) => k.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark key={idx} className="bg-amber-100 text-amber-900 px-0.5 rounded font-medium">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-900">Relevant conversation</h3>
        <span className="text-xs text-gray-400 font-normal">
          {conversationName} · {firstDate}
        </span>
      </div>

      {/* Conversation Container */}
      <div className="rounded-2xl border border-gray-200/90 bg-white divide-y divide-gray-100 overflow-hidden shadow-xs">
        {results.map((item, index) => {
          const { message, rank, highlights } = item;
          const senderFirst = message.sender_name.split(' ')[0];
          const avatarStyle = AVATAR_COLORS[message.sender_name] || {
            bg: 'bg-gray-100',
            text: 'text-gray-700',
          };
          const isBestMatch = rank === 1 || index === 0;

          return (
            <div
              key={message.id}
              className="p-4 hover:bg-gray-50/60 transition group flex items-start gap-3.5"
            >
              {/* Circular Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs ${avatarStyle.bg} ${avatarStyle.text}`}
              >
                {senderFirst[0]}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{senderFirst}</span>
                    <span className="text-xs text-gray-400 font-normal">
                      {formatMessageDate(message.timestamp)}
                    </span>
                    {isBestMatch && (
                      <span className="bg-blue-50 text-blue-600 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        Best match
                      </span>
                    )}
                  </div>

                  {/* Context trigger */}
                  <button
                    type="button"
                    onClick={() => onOpenContext(message.id)}
                    className="opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    title="View conversational thread context"
                  >
                    <span>View Context</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Message Body */}
                <p className="text-sm text-gray-700 leading-normal mt-1 break-words font-normal">
                  {renderHighlightedContent(message.content, highlights)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
