import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const defaultRegister = {
  name: '',
  email: '',
  password: '',
};

const defaultLogin = {
  email: '',
  password: '',
};

export default function AuthPage() {
  const { user, login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <section className="card-surface p-6 sm:p-8">
        <p className="text-slate-700">Dang tai du lieu nguoi dung...</p>
      </section>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      await login(loginForm);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Dang nhap that bai');
    } finally {
      setPending(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      await register(registerForm);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Dang ky that bai');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl card-surface p-6 sm:p-8">
      <h1 className="text-3xl font-bold text-brand-ink">Tai khoan</h1>
      <p className="mt-2 text-slate-600">Dang nhap hoac tao tai khoan de dat phong khach san.</p>

      <div className="mt-6 flex rounded-full bg-brand-sand p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'login' ? 'bg-brand-clay text-white' : 'text-brand-ink'
          }`}
        >
          Dang nhap
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'register' ? 'bg-brand-clay text-white' : 'text-brand-ink'
          }`}
        >
          Dang ky
        </button>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

      {mode === 'login' ? (
        <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
          <label className="block text-sm text-slate-700">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-clay"
              value={loginForm.email}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label className="block text-sm text-slate-700">
            Mat khau
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-clay"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-brand-ink px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? 'Dang xu ly...' : 'Dang nhap'}
          </button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleRegisterSubmit}>
          <label className="block text-sm text-slate-700">
            Ho va ten
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-clay"
              value={registerForm.name}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label className="block text-sm text-slate-700">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-clay"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label className="block text-sm text-slate-700">
            Mat khau (toi thieu 6 ky tu)
            <input
              type="password"
              minLength={6}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-clay"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-brand-clay px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? 'Dang xu ly...' : 'Tao tai khoan'}
          </button>
        </form>
      )}
    </section>
  );
}
