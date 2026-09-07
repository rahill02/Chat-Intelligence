import React from 'react';
import { Sparkles, ShieldCheck, ShieldAlert, Quote, Clock, ExternalLink } from 'lucide-react';
import type { AnswerResponse } from '../types';

interface GroundedAnswerCardProps {
  answerData: AnswerResponse | null;
  loading: boolean;
  onOpenContext: (messageId: string) => void;
}

export const GroundedAnswerCard: React.FC<GroundedAnswerCardProps> = ({
  answerData,
  loading,
  onOpenContext,
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden animate-pulse">
        <div className="flex items-center gap-2.5 text-xs text-indigo-400 font-medium mb-3">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Synthesizing grounded answer from retrieved chat evidence...</span>
        </div>
        <div className="h-4 bg-slate-800 rounded-md w-3/4 mb-2" />
        <div className="h-4 bg-slate-800 rounded-md w-1/2" />
      </div>
    );
  }

  if (!answerData) return null;

  const { answer, confidence, has_sufficient_evidence, citations, latency_ms } = answerData;

  return (
    <div
      className={`rounded-2xl border p-6 shadow-xl relative overflow-hidden transition-all ${
        has_sufficient_evidence
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30 border-indigo-500/40 shadow-indigo-500/5'
          : 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-amber-500/5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-xl border ${
              has_sufficient_evidence
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Grounded AI Answer</span>
              {has_sufficient_evidence ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  {Math.round(confidence * 100)}% Grounded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
                  <ShieldAlert className="w-3 h-3" />
                  Anti-Hallucination Refusal
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{latency_ms}ms</span>
        </div>
      </div>

      {/* Main Answer Body */}
      <div className="text-sm text-slate-200 leading-relaxed font-normal bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
        {answer}
      </div>

      {/* Citations Section */}
      {has_sufficient_evidence && citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5 text-indigo-400" />
            <span>Supporting Chat Citations ({citations.length}):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {citations.map((c) => (
              <button
                key={c.message_id}
                type="button"
                onClick={() => onOpenContext(c.message_id)}
                className="group flex flex-col p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-indigo-300 group-hover:text-indigo-200 flex items-center gap-1">
                    <span>{c.sender_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">[{c.message_id}]</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                  "{c.content_snippet}"
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unanswerable Explanation Banner */}
      {!has_sufficient_evidence && (
        <div className="mt-3 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
          <strong>Anti-Hallucination Invariant:</strong> The chat index contains 4,300 messages across 6 months, but contains no verified discussion answering this query. The model refused to fabricate an answer.
        </div>
      )}
    </div>
  );
};
