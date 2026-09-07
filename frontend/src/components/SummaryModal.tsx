import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  ListTodo,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { getSummary, getSuggestedTopics } from '../services/api';
import type { SummaryResponse } from '../types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContext: (messageId: string) => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  onOpenContext,
}) => {
  const [topic, setTopic] = useState<string>('Trip to Manali');
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadTopics = async () => {
      try {
        const topics = await getSuggestedTopics();
        setSuggestedTopics(topics);
      } catch (err) {
        console.error('Failed to load topics', err);
      }
    };

    loadTopics();
  }, [isOpen]);

  const handleGenerateSummary = async (targetTopic?: string) => {
    const activeTopic = targetTopic ?? topic;
    if (!activeTopic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getSummary({
        topic: activeTopic,
        max_messages: 35,
      });
      setSummaryData(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate summary');
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial summary on first open if empty
  useEffect(() => {
    if (isOpen && !summaryData && !loading) {
      handleGenerateSummary('Trip to Manali');
    }
  }, [isOpen]);

  // Handle ESC dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span>AI Conversation Summarizer</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  Structured Insights
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-normal">
                Extracts key decisions, action items, and timelines across conversation threads.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic Input & Suggested Chips */}
        <div className="px-6 py-3 bg-gray-50/30 border-b border-gray-100 space-y-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic to summarize (e.g. 'Trip to Manali', 'DSA exam', 'Hackathon')..."
              className="flex-1 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => handleGenerateSummary()}
              disabled={loading || !topic.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Summarize</span>
            </button>
          </div>

          {/* Quick Topic Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 no-scrollbar">
            <span className="text-gray-400 font-medium shrink-0">Suggested Topics:</span>
            {suggestedTopics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTopic(t);
                  handleGenerateSummary(t);
                }}
                className={`shrink-0 px-2.5 py-1 rounded-lg border transition cursor-pointer active:scale-95 ${
                  topic === t
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-gray-400 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <span>Analyzing chat dialogue and extracting key decisions...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-600 text-xs bg-rose-50 p-4 rounded-xl border border-rose-200">
              {error}
            </div>
          ) : summaryData ? (
            <div className="space-y-6">
              {/* Overview Card */}
              <div className="rounded-2xl bg-gray-50/70 border border-gray-200/80 p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span>Executive Overview:</span>
                    <span className="text-blue-600 font-semibold">{summaryData.topic}</span>
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{summaryData.message_count} messages sampled</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {summaryData.latency_ms}ms
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed font-normal">
                  {summaryData.overview}
                </p>
              </div>

              {/* Two Column Grid: Decisions & Action Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Key Decisions */}
                <div className="rounded-2xl bg-white border border-gray-200/80 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 pb-2 border-b border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Key Decisions Made ({summaryData.key_decisions.length})</span>
                  </div>

                  <div className="space-y-2.5">
                    {summaryData.key_decisions.map((d, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs space-y-1.5"
                      >
                        <p className="text-gray-800 font-medium">{d.decision}</p>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span className="text-emerald-700 font-medium">By: {d.decided_by}</span>
                          {d.message_id && (
                            <button
                              type="button"
                              onClick={() => onOpenContext(d.message_id!)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono cursor-pointer"
                            >
                              <span>[{d.message_id}]</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items */}
                <div className="rounded-2xl bg-white border border-gray-200/80 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 pb-2 border-b border-gray-100">
                    <ListTodo className="w-4 h-4 text-blue-600" />
                    <span>Action Items ({summaryData.action_items.length})</span>
                  </div>

                  <div className="space-y-2.5">
                    {summaryData.action_items.map((a, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs space-y-1.5"
                      >
                        <p className="text-gray-800 font-medium">{a.task}</p>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span className="text-blue-700 font-medium">
                            Assignee: {a.assignee || 'Unassigned'}
                          </span>
                          {a.deadline && (
                            <span className="text-purple-600">Due: {a.deadline}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline Dates */}
              {summaryData.timeline_dates.length > 0 && (
                <div className="rounded-2xl bg-white border border-gray-200/80 p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>Key Dates Mentioned in Thread:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summaryData.timeline_dates.map((date, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <span>AI summaries automatically cluster topic messages and extract decisions</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
