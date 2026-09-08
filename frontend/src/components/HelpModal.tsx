import React, { useEffect } from 'react';
import {
  X,
  HelpCircle,
  Search,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Help & Documentation</h3>
              <p className="text-[11px] text-gray-400">
                Guide to conversational search, keyboard shortcuts, and intelligence features
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. How Search Intelligence Works */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2.5">
              Search Intelligence Capabilities
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attributed Queries</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Find what specific people said: <span className="font-mono text-gray-700 font-medium">"What did Priya say about budget?"</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Semantic Vector Match</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Finds meaning despite typos: <span className="font-mono text-gray-700 font-medium">"whn did aman gt google offr"</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  <span>Temporal Extraction</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Detects natural dates like <span className="font-mono text-gray-700 font-medium">"March 2026"</span>, <span className="font-mono text-gray-700 font-medium">"Diwali"</span>, or custom filters.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Anti-Hallucination</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Answers only from retrieved evidence. Explicitly refuses when confidence is below threshold (&lt; 0.35).
                </p>
              </div>
            </div>
          </div>

          {/* 2. Keyboard Shortcuts */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2.5">
              Keyboard Shortcuts
            </span>
            <div className="rounded-2xl border border-gray-200/70 overflow-hidden text-xs divide-y divide-gray-100">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50/50">
                <span className="text-gray-700 font-medium">Focus Search Input</span>
                <kbd className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-500 font-mono text-[11px] shadow-2xs">
                  Cmd / Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-white">
                <span className="text-gray-700 font-medium">Execute Search</span>
                <kbd className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-500 font-mono text-[11px] shadow-2xs">
                  Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50/50">
                <span className="text-gray-700 font-medium">Close Modal / Popover</span>
                <kbd className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-500 font-mono text-[11px] shadow-2xs">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          {/* 3. API & Architecture */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2.5">
              System Architecture & API
            </span>
            <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-950">FastAPI REST Endpoints</span>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  <span>Interactive Swagger Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-indigo-900/70 leading-relaxed">
                Direct endpoints available for <span className="font-mono">/api/search</span>, <span className="font-mono">/api/answer</span>, <span className="font-mono">/api/summary</span>, and <span className="font-mono">/api/context</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400">Press Esc to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-medium transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};