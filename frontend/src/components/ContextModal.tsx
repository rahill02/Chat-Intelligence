import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Loader2, Sparkles, Sliders } from 'lucide-react';
import { getMessageContext } from '../services/api';
import type { MessageWithContext } from '../types';

interface ContextModalProps {
  messageId: string | null;
  onClose: () => void;
}

export const ContextModal: React.FC<ContextModalProps> = ({ messageId, onClose }) => {
  const [contextData, setContextData] = useState<MessageWithContext | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!messageId) {
      setContextData(null);
      return;
    }

    const fetchContext = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMessageContext(messageId, windowSize);
        setContextData(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch conversation context');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [messageId, windowSize]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!messageId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Conversational Thread Context</span>
                <span className="text-xs font-mono text-slate-500">[{messageId}]</span>
              </h2>
              <p className="text-xs text-slate-400">
                Displaying surrounding messages to provide conversational continuity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Window Size Slider */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-800">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Context: ±{windowSize}</span>
              <input
                type="range"
                min={1}
                max={8}
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                className="w-16 accent-indigo-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
              <span>Hydrating surrounding chat history...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-xs">{error}</div>
          ) : contextData ? (
            <div className="space-y-3">
              {/* Messages Before */}
              {contextData.before.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs opacity-75 hover:opacity-100 transition"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-300">{msg.sender_name}</span>
                    <span>#{msg.sequence_num} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{msg.content}</p>
                </div>
              ))}

              {/* Target Message Spotlight */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border-2 border-indigo-500/80 shadow-lg shadow-indigo-500/10 text-xs relative my-4">
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3" />
                  <span>Target Search Match</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-medium mb-1.5 mt-1">
                  <span className="font-bold text-slate-100 text-sm">{contextData.target_message.sender_name}</span>
                  <span>#{contextData.target_message.sequence_num} • {new Date(contextData.target_message.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-white text-sm font-medium leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-indigo-500/30">
                  {contextData.target_message.content}
                </p>
              </div>

              {/* Messages After */}
              {contextData.after.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs opacity-75 hover:opacity-100 transition"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-300">{msg.sender_name}</span>
                    <span>#{msg.sequence_num} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Press ESC or click close to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
