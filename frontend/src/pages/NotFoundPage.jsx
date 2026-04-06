import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="card-surface p-10 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-clay">404</p>
      <h1 className="mt-3 text-3xl font-bold text-brand-ink">Không tìm thấy trang</h1>
      <p className="mt-3 text-slate-600">Route này chưa được định nghĩa trong bộ khung hiện tại.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-sand no-underline"
      >
        Về trang chủ
      </Link>
    </section>
  );
}
