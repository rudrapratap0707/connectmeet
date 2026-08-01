import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, StickyNote, CheckCircle2, Video, LogIn } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export default function Workspace() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api
      .get('/meetings/history/me')
      .then(({ data }) => setHistory(data.history.slice(0, 3)))
      .catch(() => {});
  }, []);

  const latest = history[0];

  return (
    <div className="min-h-screen bg-obsidian text-pearl">
      <TopBar />

      <main className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
        <p className="text-pearl/50 text-sm">Welcome back,</p>
        <h1 className="text-3xl font-extrabold mt-1">{user?.name}</h1>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/create"
            className="glass-panel rounded-xl2 p-6 hover:border-coral/40 border border-transparent transition-colors group"
          >
            <Video size={22} className="text-coral mb-3" />
            <h3 className="font-semibold text-lg">Start a meeting</h3>
            <p className="text-sm text-pearl/50 mt-1">Spin up a new room with its own link and memory.</p>
          </Link>
          <Link
            to="/join"
            className="glass-panel rounded-xl2 p-6 hover:border-violet/40 border border-transparent transition-colors group"
          >
            <LogIn size={22} className="text-violet mb-3" />
            <h3 className="font-semibold text-lg">Join a meeting</h3>
            <p className="text-sm text-pearl/50 mt-1">Enter a meeting ID or paste a link to hop in.</p>
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="text-sm uppercase tracking-widest text-pearl/40 font-semibold mb-4">
            {latest ? `Current context — ${latest.title}` : 'Your workspace'}
          </h2>

          <div className="glass-panel rounded-xl2 p-6 md:p-8 shadow-panel">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold">{latest ? latest.title : 'Product Strategy Room'}</h3>
              <p className="text-pearl/40 text-sm mt-1">
                {latest ? 'Your most recent conversation' : 'Nothing active — start or join a meeting to begin'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-graphite/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-pearl/50 text-xs font-semibold uppercase tracking-wide mb-3">
                  <Users size={14} /> Live People
                </div>
                <p className="text-sm text-pearl/60">Nobody here yet — invite your team.</p>
              </div>
              <div className="bg-graphite/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-pearl/50 text-xs font-semibold uppercase tracking-wide mb-3">
                  <StickyNote size={14} /> Important Notes
                </div>
                <p className="text-sm text-pearl/60">Notes captured during meetings will show up here.</p>
              </div>
              <div className="bg-graphite/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-pearl/50 text-xs font-semibold uppercase tracking-wide mb-3">
                  <CheckCircle2 size={14} /> Next Actions
                </div>
                <p className="text-sm text-pearl/60">Decisions and tasks from your meetings land here.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
