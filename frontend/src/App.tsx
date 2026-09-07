import { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  MessageSquare, 
  Sparkles, 
  Database, 
  Search, 
  Layers
} from 'lucide-react';
import { checkHealth } from './services/api';
import type { HealthStatus } from './types';

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reach backend API');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30 text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">
                Chat Intelligence
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                v0.1.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>API Gateway:</span>
              {loading ? (
                <span className="text-amber-400 font-medium">Checking...</span>
              ) : health?.status === 'healthy' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  Connected
                </span>
              ) : (
                <span className="text-rose-400 font-semibold">Offline</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero & System Status Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-850 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phase 1 — Project Foundation Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Conversational Search & Intelligence Platform
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
                Empowering semantic search, person attribution, temporal filters, and grounded AI synthesis over Hinglish and code-mixed conversations.
              </p>
            </div>

            <button
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition shadow-sm hover:shadow active:scale-95 text-xs font-medium self-start md:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              Check API Health
            </button>
          </div>

          {/* Foundation Health Card */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>FastAPI Backend</span>
                {health?.status === 'healthy' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {health?.status === 'healthy' ? 'Online & Healthy' : error ? 'Unreachable' : 'Connecting...'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {health?.version ? `v${health.version} (${health.environment})` : 'http://127.0.0.1:8000'}
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Frontend Stack</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-semibold text-slate-200">React 19 + Vite</div>
              <div className="text-[11px] text-slate-500 mt-0.5">TypeScript & Tailwind CSS</div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Embeddings & Vector</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-sm font-semibold text-slate-200">Multilingual E5 + FAISS</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Prepared for Phase 3</div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Data Storage</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-sm font-semibold text-slate-200">SQLite Architecture</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Prepared for Phase 2</div>
            </div>
          </div>
        </div>

        {/* Phase Workspace Preview Placeholder */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">Search Workspace Initialized</h3>
          <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
            Phase 1 foundation is operational. The conversation schema and synthetic 4,000+ Hinglish dataset pipeline will be activated in Phase 2.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        Chat Intelligence • Technical Assessment Platform
      </footer>
    </div>
  );
}
