import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { register as registerApi } from '../services/api';
import AuthExperienceLayout from '../components/AuthExperienceLayout';

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

  if (loading) {
    return (
      <AuthExperienceLayout
        mode="register"
        panelTitle="Đăng ký"
        panelSubtitle="Đang tải thông tin phiên làm việc."
        eyebrow="CREATE YOUR ACCOUNT"
        title="Thiết lập tài khoản mới để vận hành đặt phòng trong cùng hệ giao diện CCT Hotels."
        description="Biểu mẫu đăng ký được gắn trực tiếp vào website thay vì một màn hình rời, giúp trải nghiệm xuyên suốt từ khám phá phòng đến quản lý tài khoản."
        note="Mọi thông tin đăng ký được kiểm tra hợp lệ và lưu trữ an toàn trong hệ thống."
        highlights={['Tạo tài khoản chỉ với vài bước', 'Kết nối ngay với trang đặt phòng', 'Dễ dàng chuyển sang hồ sơ cá nhân sau khi đăng nhập']}
        footerText="Đã có tài khoản?"
        footerLinkTo="/login"
        footerLinkLabel="Đăng nhập ngay"
      >
        <div className="flash success">Đang chuẩn bị biểu mẫu đăng ký...</div>
      </AuthExperienceLayout>
    );
  }
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
      await registerApi({
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      window.location.href = '/login?registered=true';
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setPending(false);
    }
  }

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  return (
    <AuthExperienceLayout
      mode="register"
      panelTitle="Đăng ký"
      panelSubtitle="Điền thông tin để tạo tài khoản mới cho hệ thống."
      eyebrow="CREATE YOUR ACCOUNT"
      title="Tạo tài khoản để bắt đầu quản lý đặt phòng trong không gian giao diện đồng bộ với toàn website."
      description="Thiết lập tài khoản nhân viên hoặc khách hàng để vận hành quy trình đặt phòng, theo dõi phòng trống và quản lý lịch lưu trú mà không bị tách khỏi header, footer và nền thương hiệu."
      note="Mọi thông tin đăng ký được kiểm tra hợp lệ và lưu trữ an toàn trước khi tạo tài khoản mới."
      highlights={['Khởi tạo hồ sơ khách lưu trú nhanh', 'Nhận ưu đãi và theo dõi booking dễ hơn', 'Liên thông ngay với trang thanh toán và hỗ trợ']}
      formMessage={error ? <div className="flash error">{error}</div> : null}
      footerText="Đã có tài khoản?"
      footerLinkTo="/login"
      footerLinkLabel="Đăng nhập ngay"
    >
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
            <input id="confirmPassword" className="field" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
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
    </AuthExperienceLayout>
  );
}
