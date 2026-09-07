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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span>Conversational Thread Context</span>
                <span className="text-xs font-mono text-gray-400">[{messageId}]</span>
              </h2>
              <p className="text-xs text-gray-500 font-normal">
                Displaying surrounding messages to provide conversational continuity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Window Size Slider */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Context: ±{windowSize}</span>
              <input
                type="range"
                min={1}
                max={8}
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                className="w-16 accent-indigo-600 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
              <span>Hydrating surrounding chat history...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-600 text-xs">{error}</div>
          ) : contextData ? (
            <div className="space-y-3">
              {/* Messages Before */}
              {contextData.before.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/60 text-xs opacity-80 hover:opacity-100 transition"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span className="font-semibold text-gray-800">{msg.sender_name}</span>
                    <span>#{msg.sequence_num} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-normal">{msg.content}</p>
                </div>
              ))}

              {/* Target Message Spotlight */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border-2 border-blue-400 shadow-sm text-xs relative my-4">
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3" />
                  <span>Target Search Match</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-blue-800 font-medium mb-1.5 mt-1">
                  <span className="font-bold text-gray-900 text-sm">{contextData.target_message.sender_name}</span>
                  <span>#{contextData.target_message.sequence_num} • {new Date(contextData.target_message.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-gray-900 text-sm font-medium leading-relaxed bg-white p-3 rounded-xl border border-blue-200">
                  {contextData.target_message.content}
                </p>
              </div>

              {/* Messages After */}
              {contextData.after.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/60 text-xs opacity-80 hover:opacity-100 transition"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span className="font-semibold text-gray-800">{msg.sender_name}</span>
                    <span>#{msg.sequence_num} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-normal">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-mono text-[10px]">Esc</kbd> to close</span>
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
