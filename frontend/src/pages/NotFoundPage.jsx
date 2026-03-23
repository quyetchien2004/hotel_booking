import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="card-surface p-10 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-clay">404</p>
      <h1 className="mt-3 text-3xl font-bold text-brand-ink">Khong tim thay trang</h1>
      <p className="mt-3 text-slate-600">Route nay chua duoc dinh nghia trong bo khung hien tai.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-sand no-underline"
      >
        Ve trang chu
      </Link>
    </section>
  );
}
