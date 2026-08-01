import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back');
      navigate('/workspace');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-pearl flex flex-col items-center justify-center px-6">
      <Link to="/" className="mb-10">
        <Logo />
      </Link>

      <div className="w-full max-w-sm glass-panel rounded-xl2 p-8 shadow-panel">
        <h1 className="text-xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-pearl/50 mb-6">Log in to continue your conversations.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-pearl/50 mb-1 block">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-coral transition-colors"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="text-xs text-pearl/50 mb-1 block">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-coral transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-coral text-obsidian font-semibold hover:brightness-110 transition disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-pearl/50">
          Don't have an account?{' '}
          <Link to="/register" className="text-coral hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
