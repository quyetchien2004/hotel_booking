import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError('');
    try {
      await login(form);
    } catch (err) {
      setError(err?.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <span className="brand-badge">Hotel Booking</span>
        <div>
          <h1>Quản lý đặt phòng nhanh và chuyên nghiệp</h1>
          <p>Đăng nhập để theo dõi phòng trống, quản lý lịch đặt và cập nhật trạng thái khách hàng theo thời gian thực.</p>
        </div>
        <p className="auth-note">Bảo mật tài khoản bằng chuẩn mã hóa BCrypt và xác thực người dùng.</p>
      </section>

      <section className="auth-panel">
        <h2>Đăng nhập</h2>
        <p className="sub">Chào mừng bạn quay trở lại hệ thống khách sạn.</p>

        {error && <div className="flash error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="field"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              className="field"
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={pending}>
            {pending ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="switch-link">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </section>
    </main>
  );
}
