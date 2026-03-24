import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MyAccountPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const [accountUser, setAccountUser] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  // CCCD verification state
  const [cccdFile, setCccdFile] = useState(null);
  const [cccdPreview, setCccdPreview] = useState(null);
  const [verifyMsg, setVerifyMsg] = useState({ type: '', text: '' });
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifying, setVerifying] = useState(false);

  // OTP / password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    Promise.all([
      api.get('/account/me').then(r => setAccountUser(r.data)).catch(() => {}),
      api.get('/account/vouchers').then(r => setVouchers(r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (accountUser?.email) setResetEmail(accountUser.email);
  }, [accountUser]);

  function handleFileChange(e) {
    setVerifyMsg({ type: '', text: '' });
    setVerifyProgress(0);
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png'];
    const ext = file.name.toLowerCase();
    if (!allowed.includes(file.type) || (!ext.endsWith('.jpg') && !ext.endsWith('.jpeg') && !ext.endsWith('.png'))) {
      setVerifyMsg({ type: 'danger', text: 'Chỉ chấp nhận file ảnh JPG, JPEG hoặc PNG.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setVerifyMsg({ type: 'danger', text: 'Dung lượng ảnh phải nhỏ hơn 5MB.' });
      return;
    }
    setCccdFile(file);
    const reader = new FileReader();
    reader.onload = ev => setCccdPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleVerifySubmit(e) {
    e.preventDefault();
    if (!cccdFile) { setVerifyMsg({ type: 'danger', text: 'Vui lòng chọn ảnh CCCD.' }); return; }
    const formData = new FormData();
    formData.append('cccdImage', cccdFile);
    setVerifying(true);
    setVerifyProgress(0);
    try {
      const res = await api.post('/account/verify-idcard', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress(pe) {
          if (pe.total) setVerifyProgress(Math.round((pe.loaded * 100) / pe.total));
        },
      });
      const d = res.data || {};
      setVerifyMsg({ type: 'success', text: `${d.message}. Trust hiện tại: ${d.trustScore}%` });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setVerifyMsg({ type: 'danger', text: err.response?.data?.error || err.message || 'Xác minh thất bại' });
    } finally {
      setVerifying(false);
    }
  }

  async function handleRequestOtp() {
    setPassMsg({ type: '', text: '' });
    try {
      const res = await api.post('/account/request-password-otp', { email: resetEmail });
      setPassMsg({ type: 'success', text: res.data.message });
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    }
  }

  async function handleResetPassword() {
    setPassMsg({ type: '', text: '' });
    try {
      const res = await api.post('/account/reset-password', { email: resetEmail, otpCode, newPassword });
      setPassMsg({ type: 'success', text: res.data.message + '. Đang chuyển về trang đăng nhập...' });
      setTimeout(() => window.location.href = '/login?passwordReset=true', 1400);
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.response?.data?.error || err.message });
    }
  }

  return (
    <SiteLayout activePage="my-account" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Tài khoản của bạn</h2>
          <p className="text-muted mb-0">Quản lý bảo mật, xác minh CCCD và theo dõi độ tin cậy tài khoản.</p>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}

        {accountUser && (
          <div className="card card-body mb-3">
            <div className="row g-3">
              <div className="col-md-6">
                <div><strong>Tài khoản:</strong> {accountUser.username}</div>
                <div><strong>Họ tên:</strong> {accountUser.fullName}</div>
                <div><strong>Email:</strong> {accountUser.email}</div>
                <div><strong>SĐT:</strong> {accountUser.phone}</div>
              </div>
              <div className="col-md-6">
                <div><strong>Độ tin cậy:</strong> {accountUser.trustScore}%</div>
                <div><strong>Trạng thái xác minh:</strong> {accountUser.accountVerificationStatus}</div>
                <div><strong>Xác minh CCCD lúc:</strong> {fmtDate(accountUser.idCardVerifiedAt)}</div>
              </div>
            </div>
          </div>
        )}

        {/* CCCD Verification */}
        <div className="card card-body mb-3">
          <h5>Xác minh CCCD</h5>
          <p className="text-muted small">Upload ảnh CCCD để xác minh tên tài khoản. Sau khi xác minh đúng, độ tin cậy tăng lên 80%.</p>
          <form onSubmit={handleVerifySubmit}>
            <input
              type="file"
              className="form-control mb-2"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleFileChange}
              required
            />
            {cccdPreview && (
              <div className="mb-2">
                <img src={cccdPreview} alt="Preview CCCD" style={{ maxWidth: 320, width: '100%', borderRadius: 10, border: '1px solid #e2d1bb' }} />
              </div>
            )}
            {verifying && (
              <div className="progress mb-2" style={{ height: 14 }}>
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${verifyProgress}%` }}>
                  {verifyProgress}%
                </div>
              </div>
            )}
            <button className="btn btn-brand" type="submit" disabled={verifying}>
              {verifying ? 'Đang upload...' : 'Upload và xác minh'}
            </button>
          </form>
          {verifyMsg.text && (
            <div className={`alert alert-${verifyMsg.type} mb-0 mt-2`}>{verifyMsg.text}</div>
          )}
        </div>

        {/* OTP Password Reset */}
        <div className="card card-body mb-3" style={{ borderRadius: 16 }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 40, height: 40, borderRadius: '50%', flex: '0 0 40px', background: 'linear-gradient(135deg,#1e4fc2,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><polyline points="16 3 12 7 8 3" /></svg>
            </div>
            <div>
              <h5 className="mb-0" style={{ fontSize: '1rem' }}>Đổi mật khẩu qua OTP email</h5>
              <small className="text-muted">Email → nhận OTP → đặt mật khẩu mới</small>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-end">
            <div style={{ flex: 2, minWidth: 200 }}>
              <label className="form-label fw-semibold small mb-1">Email đăng ký</label>
              <div className="input-group input-group-sm">
                <input className="form-control" placeholder="example@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                <button className="btn btn-outline-primary" type="button" style={{ whiteSpace: 'nowrap' }} onClick={handleRequestOtp}>Gửi OTP</button>
              </div>
            </div>
            <div style={{ flex: '0 0 110px' }}>
              <label className="form-label fw-semibold small mb-1">Mã OTP</label>
              <input className="form-control form-control-sm" placeholder="6 chữ số" maxLength="6" style={{ letterSpacing: 3, fontWeight: 600 }} value={otpCode} onChange={e => setOtpCode(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="form-label fw-semibold small mb-1">Mật khẩu mới</label>
              <input type="password" className="form-control form-control-sm" placeholder="Tối thiểu 6 ký tự" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <button className="btn btn-brand btn-sm" type="button" style={{ whiteSpace: 'nowrap' }} onClick={handleResetPassword}>Xác nhận đổi</button>
            </div>
          </div>
          {passMsg.text && (
            <div className={`alert alert-${passMsg.type} mb-0 mt-2`}>{passMsg.text}</div>
          )}
        </div>

        {/* User Vouchers */}
        {vouchers.length > 0 && (
          <div className="card card-body">
            <h5>Voucher của bạn</h5>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr><th>Mã</th><th>Giảm</th><th>Lý do</th><th>Hạn dùng</th><th>Trạng thái</th></tr>
                </thead>
                <tbody>
                  {vouchers.map((v, i) => {
                    const expired = v.validTo && new Date(v.validTo) < new Date();
                    const status = v.usedAt ? 'Đã dùng' : expired ? 'Hết hạn' : 'Còn hạn';
                    return (
                      <tr key={i}>
                        <td>{v.code}</td>
                        <td>{v.discountPercent}%</td>
                        <td>{v.reason}</td>
                        <td>{fmtDate(v.validTo)}</td>
                        <td>{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
