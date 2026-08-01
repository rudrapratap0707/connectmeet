import { Link, useNavigate } from 'react-router-dom';
import { User, History, LogOut } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-pearl/5">
      <Link to="/workspace">
        <Logo size="sm" />
      </Link>
      {user && (
        <nav className="flex items-center gap-2">
          <Link
            to="/history"
            className="p-2 rounded-lg text-pearl/70 hover:text-pearl hover:bg-graphite transition-colors"
            title="Meeting history"
          >
            <History size={18} />
          </Link>
          <Link
            to="/profile"
            className="p-2 rounded-lg text-pearl/70 hover:text-pearl hover:bg-graphite transition-colors"
            title="Profile"
          >
            <User size={18} />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-pearl/70 hover:text-coral hover:bg-graphite transition-colors"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </nav>
      )}
    </header>
  );
}
