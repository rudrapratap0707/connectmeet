import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, StickyNote, CheckCircle2, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ACTIVITY_FEED = ['Sarah joined', 'Decision saved', 'Task created', 'Alex joined', 'Note pinned'];

export default function Landing() {
  const { user } = useAuth();
  const [activityIndex, setActivityIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActivityIndex((i) => (i + 1) % ACTIVITY_FEED.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-obsidian text-pearl flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-10 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/workspace"
              className="px-4 py-2 rounded-lg bg-graphite text-pearl text-sm font-medium hover:bg-pearl/10 transition-colors"
            >
              Go to workspace
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm text-pearl/70 hover:text-pearl transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-coral text-obsidian text-sm font-semibold hover:brightness-110 transition"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
        <p className="uppercase tracking-[0.3em] text-xs text-violet font-semibold mb-6">
          A meeting intelligence workspace
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl">
          Meetings are not rooms.
          <br />
          <span className="text-coral">They are moments.</span>
        </h1>
        <p className="mt-6 max-w-xl text-pearl/60 text-lg">
          Connect, collaborate, and remember every important conversation.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3">
          <Link
            to={user ? '/create' : '/register'}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-coral text-obsidian font-semibold hover:brightness-110 transition"
          >
            Start Meeting <ArrowRight size={18} />
          </Link>
          <Link
            to={user ? '/join' : '/register'}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-pearl/15 text-pearl font-semibold hover:bg-graphite transition"
          >
            Join Meeting
          </Link>
        </div>

        {/* Realistic product preview */}
        <div className="mt-16 w-full max-w-4xl">
          <div className="glass-panel rounded-xl2 p-6 md:p-8 text-left shadow-panel relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-pearl/40 uppercase tracking-widest">Now in session</p>
                <h3 className="text-xl font-bold mt-1">Product Strategy Room</h3>
              </div>
              <span className="flex items-center gap-2 text-xs text-lime font-medium">
                <span className="w-2 h-2 rounded-full bg-lime speaking-ring" /> Live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-graphite/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-pearl/50 text-xs font-semibold uppercase tracking-wide mb-3">
                  <Users size={14} /> Live People
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-coral" /> Sarah</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-lime" /> Alex</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet" /> Rudra</li>
                </ul>
              </div>
              <div className="bg-graphite/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-pearl/50 text-xs font-semibold uppercase tracking-wide mb-3">
                  <StickyNote size={14} /> Important Notes
                </div>
                <ul className="space-y-2 text-sm text-pearl/80">
                  <li>API architecture approved</li>
                  <li>MongoDB selected</li>
                </ul>
              </div>
              <div className="bg-graphite/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-pearl/50 text-xs font-semibold uppercase tracking-wide mb-3">
                  <CheckCircle2 size={14} /> Next Actions
                </div>
                <ul className="space-y-2 text-sm text-pearl/80">
                  <li>Create backend API</li>
                  <li>Complete UI</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-pearl/40">
              <span className="w-1.5 h-1.5 rounded-full bg-coral" />
              <span key={activityIndex} className="transition-opacity">
                {ACTIVITY_FEED[activityIndex]}
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-pearl/30 py-8">
        © {new Date().getFullYear()} ConnectMeet. Built for teams who remember what matters.
      </footer>
    </div>
  );
}
