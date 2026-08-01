import { useEffect, useState } from 'react';
import { Clock, Users } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import api from '../services/api.js';

const formatDuration = (seconds) => {
  if (!seconds) return '—';
  const mins = Math.round(seconds / 60);
  return mins < 1 ? '<1 min' : `${mins} min`;
};

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/meetings/history/me')
      .then(({ data }) => setHistory(data.history))
      .finally(() => setLoading(false));
  }, []);

  const grouped = history.reduce((acc, item) => {
    const day = new Date(item.joinedAt).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
    });
    acc[day] = acc[day] || [];
    acc[day].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-obsidian text-pearl">
      <TopBar />
      <main className="px-6 py-10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Meeting history</h1>

        {loading && <p className="text-pearl/40 text-sm">Loading…</p>}
        {!loading && history.length === 0 && (
          <p className="text-pearl/40 text-sm">No meetings yet — your timeline will appear here.</p>
        )}

        <div className="space-y-8">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <p className="text-xs uppercase tracking-widest text-pearl/40 font-semibold mb-3">{day}</p>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item._id} className="glass-panel rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-pearl/40 mt-1">ID: {item.meetingId}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-pearl/50">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {formatDuration(item.durationSeconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={13} /> {item.participantCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
