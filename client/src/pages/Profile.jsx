import { useEffect, useState } from 'react';
import { UserCircle2, Users, MessageSquare } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/users/profile').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const collaboratorCount = new Set((stats?.recentConversations || []).map((c) => c.meetingId)).size;

  return (
    <div className="min-h-screen bg-obsidian text-pearl">
      <TopBar />
      <main className="px-6 py-10 max-w-2xl mx-auto">
        <div className="glass-panel rounded-xl2 p-8 shadow-panel">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet/20 border border-violet/40 flex items-center justify-center text-xl font-bold text-violet">
              {user?.name
                ?.split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{user?.name}</h1>
              <p className="text-sm text-pearl/50">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-graphite/60 rounded-xl p-4 flex items-center gap-3">
              <UserCircle2 size={20} className="text-coral" />
              <div>
                <p className="text-lg font-bold">{stats?.meetingsCompleted ?? '—'}</p>
                <p className="text-xs text-pearl/50">Meetings completed</p>
              </div>
            </div>
            <div className="bg-graphite/60 rounded-xl p-4 flex items-center gap-3">
              <Users size={20} className="text-lime" />
              <div>
                <p className="text-lg font-bold">{collaboratorCount || '—'}</p>
                <p className="text-xs text-pearl/50">Collaborators</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-pearl/40 font-semibold mb-3">
              <MessageSquare size={14} /> Recent conversations
            </div>
            <ul className="space-y-2">
              {(stats?.recentConversations || []).length === 0 && (
                <li className="text-sm text-pearl/40">No conversations yet.</li>
              )}
              {(stats?.recentConversations || []).map((c, i) => (
                <li key={i} className="bg-graphite/50 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                  <span>{c.title}</span>
                  <span className="text-pearl/40 text-xs">{new Date(c.joinedAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
