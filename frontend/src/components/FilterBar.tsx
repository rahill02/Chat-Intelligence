import React from 'react';
import { User, Calendar, RotateCcw, Compass, SlidersHorizontal } from 'lucide-react';
import type { QueryAnalysis } from '../types';

interface FilterBarProps {
  sender: string;
  setSender: (s: string) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  topK: number;
  setTopK: (k: number) => void;
  queryAnalysis?: QueryAnalysis | null;
  onReset: () => void;
}

const PARTICIPANTS = [
  'Rahul Sharma',
  'Priya Patel',
  'Aman Verma',
  'Sneha Rao',
  'Vikram Singh',
  'Neha Gupta',
  'Rohan Mehta',
  'Ananya Joshi',
];

const MONTH_PRESETS = [
  { label: 'All Time', start: '', end: '' },
  { label: 'March 2026', start: '2026-03-01', end: '2026-03-31' },
  { label: 'April 2026', start: '2026-04-01', end: '2026-04-30' },
  { label: 'May 2026', start: '2026-05-01', end: '2026-05-31' },
  { label: 'June 2026', start: '2026-06-01', end: '2026-06-30' },
  { label: 'July 2026', start: '2026-07-01', end: '2026-07-31' },
  { label: 'August 2026', start: '2026-08-01', end: '2026-08-31' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  sender,
  setSender,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  topK,
  setTopK,
  queryAnalysis,
  onReset,
}) => {
  const hasActiveFilters = Boolean(sender || startDate || endDate || topK !== 10);

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 space-y-3 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sender Filter */}
          <div className="relative flex items-center">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="pl-8 pr-8 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
            >
              <option value="">All Speakers (8 participants)</option>
              {PARTICIPANTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Month Presets */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={
                MONTH_PRESETS.find((m) => m.start === startDate && m.end === endDate)?.label || 'Custom Range'
              }
              onChange={(e) => {
                const preset = MONTH_PRESETS.find((m) => m.label === e.target.value);
                if (preset) {
                  setStartDate(preset.start);
                  setEndDate(preset.end);
                }
              }}
              className="pl-8 pr-8 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
            >
              {MONTH_PRESETS.map((m) => (
                <option key={m.label} value={m.label}>
                  {m.label}
                </option>
              ))}
              {startDate && !MONTH_PRESETS.some((m) => m.start === startDate && m.end === endDate) && (
                <option value="Custom Range">Custom Range</option>
              )}
            </select>
          </div>

          {/* Top-K Selector */}
          <div className="relative flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="pl-8 pr-8 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
            >
              <option value={5}>Top 5 Results</option>
              <option value={10}>Top 10 Results</option>
              <option value={20}>Top 20 Results</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Auto-detected Query Intent Badge */}
        {queryAnalysis && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Mode:</span>
            <span className="font-semibold uppercase tracking-wider text-sky-300">
              {queryAnalysis.intent}
            </span>
            {queryAnalysis.detected_sender && (
              <span className="text-slate-400">
                • Speaker: <strong className="text-slate-200">{queryAnalysis.detected_sender}</strong>
              </span>
            )}
            {queryAnalysis.detected_date_range && (
              <span className="text-slate-400">
                • Range: <strong className="text-slate-200">{queryAnalysis.detected_date_range.start.split('T')[0]}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
