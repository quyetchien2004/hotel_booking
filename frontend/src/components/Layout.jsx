import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Trang chu', to: '/' },
  { label: 'Tai khoan', to: '/auth' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="page-shell">
      <header className="card-surface mb-6 overflow-hidden">
        <div className="flex flex-col gap-4 bg-brand-ink px-6 py-6 text-brand-sand sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="text-2xl font-bold tracking-tight text-brand-sand no-underline">
              NhomCanChienThan
            </Link>
            <p className="mt-2 max-w-2xl text-sm text-brand-sand/80">
              Bo khung React 19 + Express + Socket.IO duoc tao san de tiep tuc phat trien.
            </p>
          </div>
          <nav className="flex gap-3 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className="rounded-full border border-brand-sand/30 px-4 py-2 text-brand-sand no-underline transition hover:bg-brand-sand hover:text-brand-ink"
              >
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-brand-sand/30 px-4 py-2 text-brand-sand transition hover:bg-brand-sand hover:text-brand-ink"
              >
                Dang xuat
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
