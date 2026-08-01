import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created');
      navigate('/workspace');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
        <h1 className="text-xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-pearl/50 mb-6">Every conversation, remembered.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-pearl/50 mb-1 block">Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-coral transition-colors"
              placeholder="Rudra Pratap"
            />
          </div>
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
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-coral text-obsidian font-semibold hover:brightness-110 transition disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-pearl/50">
          Already have an account?{' '}
          <Link to="/login" className="text-coral hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
