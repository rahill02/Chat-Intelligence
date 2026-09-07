import React from 'react';
import { Sparkles, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import type { AnswerResponse } from '../types';

interface AIAnswerCardProps {
  answerData: AnswerResponse | null;
  loading: boolean;
  totalSourcesCount?: number;
  onViewSources?: () => void;
}

export const AIAnswerCard: React.FC<AIAnswerCardProps> = ({
  answerData,
  loading,
  totalSourcesCount = 4,
  onViewSources,
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Synthesizing grounded answer from conversation history...</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-md w-3/4 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded-md w-1/2 animate-pulse" />
      </div>
    );
  }

  if (!answerData) return null;

  const { answer, confidence, has_sufficient_evidence, citations } = answerData;
  const count = citations?.length || totalSourcesCount || 4;
  const relevancePct = Math.round(confidence * 100);

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold text-gray-900">AI Answer</span>
        </div>

        {has_sufficient_evidence ? (
          <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {relevancePct > 0 ? `${relevancePct}% relevance` : 'High relevance'}
          </span>
        ) : (
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            <span>Anti-Hallucination Refusal</span>
          </span>
        )}
      </div>

      {/* Answer Content */}
      <div className="mt-3.5 text-base text-gray-800 font-normal leading-relaxed">
        {answer}
      </div>

      {/* Footer / Citations */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-400">
          Based on {count} relevant {count === 1 ? 'message' : 'messages'}
        </span>

        {has_sufficient_evidence && onViewSources && (
          <button
            type="button"
            onClick={onViewSources}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition cursor-pointer"
          >
            <span>View sources</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
