import React from 'react';
import {
  Users,
  Hash,
  MessageCircle,
  Search,
  ArrowRight,
  Sparkles,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface ConversationsViewProps {
  onSelectAndSearch: (conversationName: string, query?: string) => void;
}

const CHANNELS = [
  {
    name: 'College Friends',
    icon: Users,
    iconBg: 'bg-blue-100 text-blue-600',
    count: '4,300+ messages',
    period: 'Jan – Aug 2026',
    description:
      'Active group chat discussing college graduation trip to Manali, semester exams, hackathon projects, and Priya’s birthday surprise.',
    tags: ['Manali Trip', 'Budget Planning', 'Exams', 'Google Offer', 'Birthday Party'],
    participants: [
      { name: 'Rahul Sharma', color: 'bg-blue-100 text-blue-700' },
      { name: 'Priya Patel', color: 'bg-purple-100 text-purple-700' },
      { name: 'Aman Verma', color: 'bg-sky-100 text-sky-700' },
      { name: 'Sneha Rao', color: 'bg-pink-100 text-pink-700' },
      { name: 'Vikram Singh', color: 'bg-amber-100 text-amber-700' },
      { name: 'Neha Gupta', color: 'bg-emerald-100 text-emerald-700' },
      { name: 'Rohan Mehta', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Ananya Joshi', color: 'bg-rose-100 text-rose-700' },
    ],
    sampleQueries: [
      'What did Priya say about the budget?',
      'When did we decide on the trip destination?',
      'whn did aman gt the google offr?',
      'Where did Aman deploy the staging build?',
    ],
  },
  {
    name: 'Project Team',
    icon: Hash,
    iconBg: 'bg-amber-100 text-amber-600',
    count: '20 messages',
    period: 'April – May 2026',
    description:
      'Sprint channel for the engineering hackathon MVP covering FastAPI backend, React 19 frontend, Docker setup, and staging deployments.',
    tags: ['FastAPI Backend', 'React 19', 'FAISS Vector Search', 'Docker Compose', 'Hackathon MVP'],
    participants: [
      { name: 'Aman Verma', color: 'bg-sky-100 text-sky-700' },
      { name: 'Sneha Rao', color: 'bg-pink-100 text-pink-700' },
      { name: 'Rohan Mehta', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Ananya Joshi', color: 'bg-rose-100 text-rose-700' },
    ],
    sampleQueries: [
      'What is our tech stack for the project?',
      'FastAPI backend setup',
      'Docker containerization setup',
      'When is the hackathon MVP deadline?',
    ],
  },
  {
    name: 'Rahul & Priya',
    icon: MessageCircle,
    iconBg: 'bg-purple-100 text-purple-600',
    count: '14 messages',
    period: 'August 2026',
    description:
      'Direct one-on-one conversation discussing Olive Bistro dinner reservation, weekend plans, system design books, and movie timings.',
    tags: ['Olive Bistro', 'Dinner Plans', 'System Design Book', 'Sunday Movie'],
    participants: [
      { name: 'Rahul Sharma', color: 'bg-blue-100 text-blue-700' },
      { name: 'Priya Patel', color: 'bg-purple-100 text-purple-700' },
    ],
    sampleQueries: [
      'What are our weekend dinner plans?',
      'Did we confirm Olive Bistro reservation?',
      'System design book recommendations',
    ],
  },
  {
    name: 'Family Chat',
    icon: Users,
    iconBg: 'bg-emerald-100 text-emerald-600',
    count: '14 messages',
    period: 'Sept – Oct 2026',
    description:
      'Family group discussing festive travel logistics, Shatabdi train tickets for Diwali, traditional sweets preparation, and Sunday dinner.',
    tags: ['Diwali 2026', 'Shatabdi Train Tickets', 'Festive Sweets', 'Sunday Dinner'],
    participants: [
      { name: 'Rahul Sharma', color: 'bg-blue-100 text-blue-700' },
      { name: 'Anita Sharma', color: 'bg-emerald-100 text-emerald-700' },
      { name: 'Rajesh Sharma', color: 'bg-cyan-100 text-cyan-700' },
      { name: 'Pooja Sharma', color: 'bg-fuchsia-100 text-fuchsia-700' },
    ],
    sampleQueries: [
      'What are the updates on Diwali train tickets?',
      'When is Sunday family dinner?',
      'Did Rahul book the Shatabdi tickets?',
    ],
  },
];

export const ConversationsView: React.FC<ConversationsViewProps> = ({ onSelectAndSearch }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>Active Datasets</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
          Conversations Directory
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-normal">
          Browse indexed channels, inspect participants, and launch conversational searches.
        </p>
      </div>

      {/* Grid of Conversation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CHANNELS.map((ch) => {
          const Icon = ch.icon;
          return (
            <div
              key={ch.name}
              className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${ch.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 leading-snug">{ch.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                        <span className="font-medium text-gray-600">{ch.count}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{ch.period}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-semibold tracking-wide">
                    Indexed
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed font-normal mb-4">
                  {ch.description}
                </p>

                {/* Participants Pills */}
                <div className="mb-4">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Participants ({ch.participants.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ch.participants.map((p) => (
                      <span
                        key={p.name}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${p.color}`}
                      >
                        {p.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Key Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ch.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] text-gray-500 bg-gray-100/70 border border-gray-200/60 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button & Sample Queries */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <button
                  type="button"
                  onClick={() => onSelectAndSearch(ch.name, ch.sampleQueries[0])}
                  className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Open & Search {ch.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Quick query chips */}
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-gray-400 block">
                    Quick search ideas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ch.sampleQueries.slice(0, 2).map((sq) => (
                      <button
                        key={sq}
                        type="button"
                        onClick={() => onSelectAndSearch(ch.name, sq)}
                        className="text-left text-[11px] text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/60 px-2 py-1 rounded-lg border border-gray-200/70 bg-gray-50/50 transition cursor-pointer truncate max-w-full"
                      >
                        &ldquo;{sq}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Callout */}
      <div className="p-5 rounded-3xl bg-indigo-50/40 border border-indigo-100 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-indigo-900/80 space-y-1">
          <h4 className="font-semibold text-indigo-950">Multi-Channel Neural Vector Indexing</h4>
          <p className="leading-relaxed">
            All 4 channels are dynamically partitioned and indexed using <span className="font-mono text-indigo-900 font-medium">multilingual-e5-small</span> (384 dimensions) in a FAISS <span className="font-mono text-indigo-900 font-medium">IndexFlatIP</span> store. You can search across individual channels or filter by sender, date range, and topics with instant AI answering.
          </p>
        </div>
      </div>
    </div>
  );
};