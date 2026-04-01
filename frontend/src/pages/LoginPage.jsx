import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthExperienceLayout from '../components/AuthExperienceLayout';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const registered = searchParams.get('registered') === 'true';

  if (loading) {
    return (
      <AuthExperienceLayout
        mode="login"
        panelTitle="Đăng nhập"
        panelSubtitle="Đang tải thông tin phiên làm việc."
        eyebrow="SIGN IN TO CONTINUE"
        title="Quay lại bảng điều khiển đặt phòng với giao diện quen thuộc của CCT Hotels."
        description="Từ một điểm truy cập duy nhất, bạn có thể theo dõi phòng trống, lịch lưu trú và yêu cầu hỗ trợ mà không rời khỏi hệ sinh thái website."
        note="Phiên đăng nhập được đồng bộ với hệ thống đặt phòng, thanh toán và hồ sơ khách hàng."
        highlights={['Theo dõi booking theo thời gian thực', 'Đồng bộ hồ sơ khách lưu trú', 'Truy cập nhanh chatbot và hỗ trợ']}
        footerText="Chưa có tài khoản?"
        footerLinkTo="/register"
        footerLinkLabel="Đăng ký ngay"
      >
        <div className="flash success">Đang chuẩn bị biểu mẫu đăng nhập...</div>
      </AuthExperienceLayout>
    );
  }
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
    <AuthExperienceLayout
      mode="login"
      panelTitle="Đăng nhập"
      panelSubtitle="Chào mừng bạn quay trở lại hệ thống khách sạn."
      eyebrow="SIGN IN TO CONTINUE"
      title="Quản lý đặt phòng nhanh và chuyên nghiệp trong cùng giao diện của website."
      description="Đăng nhập để theo dõi phòng trống, lịch đặt, trạng thái thanh toán và tương tác hỗ trợ từ một không gian trực quan, thống nhất với toàn bộ trải nghiệm web."
      note="Bảo mật tài khoản bằng chuẩn mã hóa BCrypt và xác thực người dùng nhiều lớp trong backend."
      highlights={['Truy cập lịch đặt và hóa đơn của bạn', 'Nhận hỗ trợ trực tiếp từ chatbot AI', 'Đồng bộ dữ liệu với MongoDB theo thời gian thực']}
      formMessage={
        <>
          {registered ? <div className="flash success">Đăng ký thành công. Bạn có thể đăng nhập ngay.</div> : null}
          {error ? <div className="flash error">{error}</div> : null}
        </>
      }
      footerText="Chưa có tài khoản?"
      footerLinkTo="/register"
      footerLinkLabel="Đăng ký ngay"
    >
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
    </AuthExperienceLayout>
  );
}
