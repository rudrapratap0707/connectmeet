import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian text-pearl">
        <div className="animate-pulse text-sm tracking-wide text-pearl/60">Loading ConnectMeet…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
