import React, { useEffect } from 'react';
import { X, Settings, Cpu, Database, ShieldCheck, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
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
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">System & Search Settings</h3>
              <p className="text-[11px] text-gray-400">Configure indexing, ranking parameters, and retrieval preferences</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Neural Vector Engine
            </span>
            <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="block text-xs font-semibold text-gray-800">Multilingual E5 Small</span>
                    <span className="block text-[10px] text-gray-400">384-dimensional dense semantic representations</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/40">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="block text-xs font-semibold text-gray-800">FAISS Vector Store</span>
                    <span className="block text-[10px] text-gray-400">IndexFlatIP · 4,348 vectors indexed</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-gray-500 font-medium">Exact Cosine</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Hybrid Ranking Weights
            </span>
            <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Dense Semantic Vector</span>
                <span className="font-semibold text-gray-900">70% base weight</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '70%' }} />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-600">Sender Attribution Match</span>
                <span className="font-semibold text-gray-900">+10% boost</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Temporal Date-Range Match</span>
                <span className="font-semibold text-gray-900">+8% boost</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Exact Keyword Overlap</span>
                <span className="font-semibold text-gray-900">+6% boost</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Grounded AI & Guardrails
            </span>
            <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="block text-xs font-semibold text-gray-800">100% Anti-Hallucination Guarantee</span>
                  <span className="block text-[10px] text-gray-400">Strict refusal when evidence is absent in conversation</span>
                </div>
              </div>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">All configurations applied to live session</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
