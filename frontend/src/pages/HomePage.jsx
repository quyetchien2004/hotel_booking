import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const stack = [
  'React 19 + Vite 5',
  'React Router 7',
  'Axios + Socket.IO client',
  'Express + Mongoose + JWT',
];

export default function HomePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState('Dang kiem tra backend...');

  useEffect(() => {
    let mounted = true;

    async function fetchHealth() {
      try {
        const response = await api.get('/health');
        if (mounted) {
          setHealth(response.data.message);
        }
      } catch {
        if (mounted) {
          setHealth('Chua ket noi duoc backend. Hay chay backend o cong 5000.');
        }
      }
    }

    fetchHealth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <article className="card-surface p-6 sm:p-8">
        <span className="inline-flex rounded-full bg-brand-clay/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-clay">
          Project bootstrap
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-ink sm:text-5xl">
          Moi truong da san sang de bat dau phat trien.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          Frontend da co router, context, service layer va global styles. Backend da co Express app,
          health check, Socket.IO wiring va diem dau de ket noi MongoDB.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {stack.map((item) => (
            <div key={item} className="rounded-2xl bg-brand-sand p-4 text-sm font-medium text-brand-ink">
              {item}
            </div>
          ))}
        </div>
        {!user ? (
          <div className="mt-8">
            <Link
              to="/auth"
              className="inline-flex rounded-xl bg-brand-ink px-5 py-3 text-sm font-semibold text-white no-underline transition hover:opacity-90"
            >
              Dang nhap / Dang ky de dat phong
            </Link>
          </div>
        ) : null}
      </article>

      <aside className="card-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-brand-ink">Trang thai nhanh</h2>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-slate-500">Nguoi dung mac dinh</dt>
            <dd className="mt-1 text-base text-slate-800">{user?.name ?? 'Guest'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Backend</dt>
            <dd className="mt-1 text-base text-slate-800">{health}</dd>
          </div>
          <div id="api">
            <dt className="font-semibold text-slate-500">Base API</dt>
            <dd className="mt-1 break-all text-base text-slate-800">{api.defaults.baseURL}</dd>
          </div>
        </dl>
      </aside>
    </section>
  );
}
