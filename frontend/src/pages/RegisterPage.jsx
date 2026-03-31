import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { register as registerApi } from '../services/api';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setPending(true);
    setError('');

    try {
      await registerApi({ name: form.fullName, email: form.email, password: form.password });
      window.location.href = '/login?registered=true';
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setPending(false);
    }
  }

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <section className="auth-brand">
          <span className="brand-badge">Hotel Booking</span>
          <div>
            <h1>Tạo tài khoản để bắt đầu quản lý đặt phòng</h1>
            <p>Thiết lập tài khoản nhân viên để vận hành quy trình đặt phòng, kiểm tra phòng trống và cập nhật thông tin khách.</p>
          </div>
          <p className="auth-note">Mọi thông tin đăng ký được kiểm tra hợp lệ và lưu trữ an toàn.</p>
        </section>

        <section className="auth-panel">
          <h2>Đăng ký</h2>
          <p className="sub">Điền thông tin để tạo tài khoản mới cho hệ thống.</p>

          {error && <div className="flash error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="fullName">Họ và tên</label>
              <input id="fullName" className="field" type="text" value={form.fullName} onChange={set('fullName')} required />
            </div>

            <div className="grid-2">
              <div className="form-row">
                <label htmlFor="password">Mật khẩu</label>
                <input id="password" className="field" type="password" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div className="form-row">
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  className="field"
                  type="password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input id="email" className="field" type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-row">
                <label htmlFor="phone">Số điện thoại</label>
                <input id="phone" className="field" type="text" value={form.phone} onChange={set('phone')} />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={pending}>
              {pending ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
            </button>
          </form>

          <p className="switch-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
