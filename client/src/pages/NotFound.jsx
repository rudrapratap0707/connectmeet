import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-obsidian text-pearl flex flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div>
        <h1 className="text-3xl font-extrabold">404</h1>
        <p className="text-pearl/50 mt-2">This moment doesn't exist.</p>
      </div>
      <Link to="/" className="px-5 py-2.5 rounded-lg bg-coral text-obsidian font-semibold hover:brightness-110 transition">
        Back home
      </Link>
    </div>
  );
}
