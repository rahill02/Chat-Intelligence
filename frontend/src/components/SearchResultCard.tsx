import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { SearchResultItem } from '../types';

interface SearchResultCardProps {
  item: SearchResultItem;
  onOpenContext: (messageId: string) => void;
}

const SENDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Rahul Sharma': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'Priya Patel': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  'Aman Verma': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  'Sneha Rao': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Vikram Singh': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Neha Gupta': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Rohan Mehta': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Ananya Joshi': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
};

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ item, onOpenContext }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { message, final_score, rank, score_breakdown, highlights } = item;

  const senderStyle = SENDER_COLORS[message.sender_name] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  };

  const formattedDate = new Date(message.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Render text with matched keyword highlighting
  const renderHighlightedContent = (text: string, kwList: string[]) => {
    if (!kwList || kwList.length === 0) return text;

    // Build regex of escaped keywords
    const regexPattern = new RegExp(`(${kwList.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regexPattern);

    return parts.map((part, index) => {
      const isMatch = kwList.some((k) => k.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark
            key={index}
            className="bg-amber-400/20 text-amber-200 border-b border-amber-400/40 px-0.5 rounded font-medium"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition p-5 shadow-lg relative group">
      {/* Header: Sender, Timestamp, Score Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar / Initials */}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${senderStyle.bg} ${senderStyle.text} ${senderStyle.border}`}
          >
            {message.sender_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100">{message.sender_name}</span>
              <span className="text-[10px] text-slate-500 font-mono">#{message.sequence_num}</span>
              {message.is_code_mixed && (
                <span className="px-1.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px]">
                  Hinglish
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Score & Rank Badges */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-[11px] font-medium text-indigo-300 cursor-pointer transition"
          >
            <span>Match: {Math.round(final_score * 100)}%</span>
            {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-800/60 text-slate-400 border border-slate-800 font-mono">
            Rank #{rank}
          </span>
        </div>
      </div>

      {/* Message Content */}
      <div className="text-sm text-slate-200 leading-relaxed font-normal bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
        {renderHighlightedContent(message.content, highlights)}
      </div>

      {/* Scoring Breakdown Details Dropdown */}
      {showBreakdown && score_breakdown && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/20 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between font-semibold text-slate-300 pb-1 border-b border-slate-800">
            <span>Explainable Scoring Audit</span>
            <span className="text-indigo-400">Total: {final_score}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">Vector Cosine:</span>
              <strong className="text-sky-300">{score_breakdown.semantic_score}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Sender Boost:</span>
              <strong className="text-emerald-300">+{score_breakdown.sender_boost}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Temporal Boost:</span>
              <strong className="text-purple-300">+{score_breakdown.temporal_boost}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Keyword Overlap:</span>
              <strong className="text-amber-300">+{score_breakdown.keyword_boost}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Card Action Footer */}
      <div className="mt-3.5 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          {highlights.length > 0 && (
            <span>
              Keywords: <strong className="text-slate-400">{highlights.join(', ')}</strong>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenContext(message.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-medium transition cursor-pointer active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>View Thread Context (±3)</span>
        </button>
      </div>
    </div>
  );
};
