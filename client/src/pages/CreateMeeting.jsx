import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Copy, Loader2, Video } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import api from '../services/api.js';

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/meetings', { title, password: password || undefined });
      setCreated(data.meeting);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create meeting');
    } finally {
      setLoading(false);
    }
  };

  const meetingLink = created ? `${window.location.origin}/meeting/${created.meetingId}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    toast.success('Link copied');
  };

  return (
    <div className="min-h-screen bg-obsidian text-pearl">
      <TopBar />
      <main className="px-6 py-10 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Video size={20} className="text-coral" />
          <h1 className="text-2xl font-bold">Start a meeting</h1>
        </div>

        {!created ? (
          <form onSubmit={handleCreate} className="glass-panel rounded-xl2 p-6 space-y-4 shadow-panel">
            <div>
              <label className="text-xs text-pearl/50 mb-1 block">Meeting title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product Strategy Room"
                className="w-full bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-coral transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-pearl/50 mb-1 block">Password (optional)</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for an open room"
                className="w-full bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-coral transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-coral text-obsidian font-semibold hover:brightness-110 transition disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Generate meeting
            </button>
          </form>
        ) : (
          <div className="glass-panel rounded-xl2 p-6 shadow-panel space-y-4">
            <div>
              <p className="text-xs text-pearl/40 uppercase tracking-wide">Meeting ID</p>
              <p className="text-lg font-mono text-lime">{created.meetingId}</p>
            </div>
            <div>
              <p className="text-xs text-pearl/40 uppercase tracking-wide mb-1">Shareable link</p>
              <div className="flex items-center gap-2 bg-graphite/70 rounded-lg px-3 py-2.5 text-sm">
                <span className="truncate flex-1">{meetingLink}</span>
                <button onClick={copyLink} className="text-pearl/60 hover:text-pearl">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate(`/meeting/${created.meetingId}`)}
              className="w-full py-2.5 rounded-lg bg-coral text-obsidian font-semibold hover:brightness-110 transition"
            >
              Enter room
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
