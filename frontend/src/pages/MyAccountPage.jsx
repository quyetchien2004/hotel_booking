import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import { changePasswordByCccd, getMe, verifyCccd } from '../services/api';

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MyAccountPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const [accountUser, setAccountUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // CCCD verification state
  const [cccdNumber, setCccdNumber] = useState('');
  const [verifyMsg, setVerifyMsg] = useState({ type: '', text: '' });
  const [verifying, setVerifying] = useState(false);

  // Password change by CCCD state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCccd, setResetCccd] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    getMe()
      .then((data) => {
        const profile = data?.user || null;
        setAccountUser(profile);
        setResetEmail(profile?.email || '');
        setResetCccd(profile?.cccdNumber || '');
        setCccdNumber(profile?.cccdNumber || '');
      })
      .catch(() => {
        setPassMsg({ type: 'danger', text: 'Không tải được thông tin tài khoản.' });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleVerifySubmit(e) {
    e.preventDefault();
    if (!cccdNumber.trim()) {
      setVerifyMsg({ type: 'danger', text: 'Vui lòng nhập số CCCD.' });
      return;
    }

    setVerifying(true);
    try {
      const d = await verifyCccd({ cccdNumber: cccdNumber.trim() });
      setVerifyMsg({ type: 'success', text: `${d.message}. Trust hiện tại: ${d.trustScore}%` });
      setAccountUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cccdNumber: d.cccdNumber,
          isCccdVerified: true,
          idCardVerifiedAt: d.verifiedAt,
          trustScore: d.trustScore,
        };
      });
      setResetCccd(cccdNumber.trim());
    } catch (err) {
      setVerifyMsg({ type: 'danger', text: err.response?.data?.message || err.message || 'Xác minh thất bại' });
    } finally {
      setVerifying(false);
    }
  }

  async function handleResetPassword() {
    setPassMsg({ type: '', text: '' });

    if (!resetEmail.trim() || !resetCccd.trim() || !newPassword) {
      setPassMsg({ type: 'danger', text: 'Vui lòng nhập đầy đủ Email, CCCD và mật khẩu mới.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'danger', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    try {
      const res = await changePasswordByCccd({
        email: resetEmail.trim(),
        cccdNumber: resetCccd.trim(),
        newPassword,
      });
      setPassMsg({ type: 'success', text: res.message + '. Đang chuyển về trang đăng nhập...' });
      setTimeout(() => window.location.href = '/login?passwordReset=true', 1400);
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.response?.data?.message || err.message });
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
                <div><strong>Tài khoản:</strong> {accountUser.username || '-'}</div>
                <div><strong>Họ tên:</strong> {accountUser.fullName || accountUser.name}</div>
                <div><strong>Email:</strong> {accountUser.email}</div>
                <div><strong>SĐT:</strong> {accountUser.phone || '-'}</div>
              </div>
              <div className="col-md-6">
                <div><strong>Độ tin cậy:</strong> {accountUser.trustScore}%</div>
                <div><strong>Trạng thái xác minh:</strong> {accountUser.isCccdVerified ? 'Đã xác minh CCCD' : 'Chưa xác minh CCCD'}</div>
                <div><strong>Số CCCD:</strong> {accountUser.cccdNumber || '-'}</div>
                <div><strong>Xác minh CCCD lúc:</strong> {fmtDate(accountUser.idCardVerifiedAt)}</div>
              </div>
            </div>
          </div>
        )}

        {/* CCCD Verification */}
        <div className="card card-body mb-3">
          <h5>Xác minh CCCD</h5>
          <p className="text-muted small">Nhập số CCCD để xác minh tài khoản. Sau khi xác minh thành công, độ tin cậy được nâng lên 80%.</p>
          <form onSubmit={handleVerifySubmit}>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Nhập số CCCD (9-12 chữ số)"
              value={cccdNumber}
              onChange={(e) => setCccdNumber(e.target.value)}
              required
            />
            <button className="btn btn-brand" type="submit" disabled={verifying}>
              {verifying ? 'Đang xác minh...' : 'Xác minh CCCD'}
            </button>
          </form>
          {verifyMsg.text && (
            <div className={`alert alert-${verifyMsg.type} mb-0 mt-2`}>{verifyMsg.text}</div>
          )}
        </div>

        {/* Password Reset By CCCD */}
        <div className="card card-body mb-3" style={{ borderRadius: 16 }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 40, height: 40, borderRadius: '50%', flex: '0 0 40px', background: 'linear-gradient(135deg,#1e4fc2,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><polyline points="16 3 12 7 8 3" /></svg>
            </div>
            <div>
              <h5 className="mb-0" style={{ fontSize: '1rem' }}>Đổi mật khẩu qua xác thực CCCD</h5>
              <small className="text-muted">Email + CCCD đã xác minh → đặt mật khẩu mới</small>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-end">
            <div style={{ flex: 2, minWidth: 220 }}>
              <label className="form-label fw-semibold small mb-1">Email đăng ký</label>
              <input className="form-control form-control-sm" placeholder="example@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 170 }}>
              <label className="form-label fw-semibold small mb-1">Số CCCD</label>
              <input className="form-control form-control-sm" placeholder="9-12 chữ số" value={resetCccd} onChange={e => setResetCccd(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="form-label fw-semibold small mb-1">Mật khẩu mới</label>
              <input type="password" className="form-control form-control-sm" placeholder="Tối thiểu 6 ký tự" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="form-label fw-semibold small mb-1">Xác nhận mật khẩu</label>
              <input type="password" className="form-control form-control-sm" placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <button className="btn btn-brand btn-sm" type="button" style={{ whiteSpace: 'nowrap' }} onClick={handleResetPassword}>Xác nhận đổi</button>
            </div>
          </div>
          {passMsg.text && (
            <div className={`alert alert-${passMsg.type} mb-0 mt-2`}>{passMsg.text}</div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
