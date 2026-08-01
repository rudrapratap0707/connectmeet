import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Loader2 } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';

const extractMeetingId = (input) => {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || trimmed;
  } catch {
    return trimmed;
  }
};

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!input.trim()) {
      toast.error('Enter a meeting ID or link');
      return;
    }
    setLoading(true);
    const id = extractMeetingId(input);
    navigate(`/meeting/${id}`);
  };

  return (
    <div className="min-h-screen bg-obsidian text-pearl">
      <TopBar />
      <main className="px-6 py-10 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <LogIn size={20} className="text-violet" />
          <h1 className="text-2xl font-bold">Join a meeting</h1>
        </div>

        <form onSubmit={handleJoin} className="glass-panel rounded-xl2 p-6 space-y-4 shadow-panel">
          <div>
            <label className="text-xs text-pearl/50 mb-1 block">Meeting ID or link</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="abc-defg-hij or https://connectmeet.app/meeting/abc-defg-hij"
              className="w-full bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet text-pearl font-semibold hover:brightness-110 transition disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Continue
          </button>
        </form>
      </main>
    </div>
  );
}
