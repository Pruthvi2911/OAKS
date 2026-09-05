import Link from 'next/link';
import { Anchor, ShieldAlert, Users, LayoutDashboard, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-6">
        
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          <Anchor className="w-4 h-4" />
          Rural Ferry Staging & Boarding System
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Weight-Balanced Deck Staging & Safety Tool
        </h1>

        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          Operational control surface for rural ferry masters. Features a whole-deck primary control layout, pure JavaScript safety & rationale engine, driver self check-in, and offline real-time synchronization.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          
          {/* Master View */}
          <Link
            href="/master"
            className="group bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 p-6 rounded-2xl text-left transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="bg-sky-500/10 text-sky-400 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-sky-500/20 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1">Ferry Master Dashboard</h3>
              <p className="text-xs text-slate-400">
                Whole-deck control surface, 3-bay weight gauges, balance engine, and rationale panel.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-sky-400">
              Launch Dashboard <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Driver Check-In */}
          <Link
            href="/driver"
            className="group bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 p-6 rounded-2xl text-left transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="bg-emerald-500/10 text-emerald-400 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1">Driver Self Check-In</h3>
              <p className="text-xs text-slate-400">
                Mobile check-in for drivers. Generates check-in codes, ticket cards, and wait times.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-400">
              Driver Portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Public Queue Status */}
          <Link
            href="/queue"
            className="group bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-400 p-6 rounded-2xl text-left transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="bg-purple-500/10 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1">Public Queue Display</h3>
              <p className="text-xs text-slate-400">
                Live terminal status board showing active boarding run and queue positions.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-400">
              View Queue Board <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>

      </div>
    </div>
  );
}
