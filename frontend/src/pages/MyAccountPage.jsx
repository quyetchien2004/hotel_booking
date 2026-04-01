import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import { getMe, resetPasswordWithOtp, sendPasswordResetOtp, verifyCccd } from '../services/api';

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MyAccountPage() {
  const { user } = useAuth();

  const [accountUser, setAccountUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cccdNumber, setCccdNumber] = useState('');
  const [cccdFile, setCccdFile] = useState(null);
  const [cccdPreview, setCccdPreview] = useState('');
  const [verifyMsg, setVerifyMsg] = useState({ type: '', text: '' });
  const [verifying, setVerifying] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getMe()
      .then((data) => {
        const profile = data?.user || null;
        setAccountUser(profile);
        setResetEmail(profile?.email || '');
        setCccdNumber(profile?.cccdNumber || '');
        setCccdPreview(profile?.cccdImageDataUrl || '');
      })
      .catch(() => {
        setPassMsg({ type: 'danger', text: 'Khong tai duoc thong tin tai khoan.' });
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  async function handleVerifySubmit(e) {
    e.preventDefault();
    if (!cccdNumber.trim()) {
      setVerifyMsg({ type: 'danger', text: 'Vui long nhap so CCCD.' });
      return;
    }

    if (!cccdFile && !cccdPreview) {
      setVerifyMsg({ type: 'danger', text: 'Vui long chon anh CCCD.' });
      return;
    }

    setVerifying(true);
    try {
      const cccdImageDataUrl = cccdFile ? await fileToDataUrl(cccdFile) : cccdPreview;
      const d = await verifyCccd({ cccdNumber: cccdNumber.trim(), cccdImageDataUrl });
      setVerifyMsg({
        type: 'success',
        text: `${d.message}. Ho ten quet duoc: ${d.extractedName}. Trust hien tai: ${d.trustScore}%`,
      });
      setAccountUser((prev) => prev ? ({
        ...prev,
        cccdNumber: d.cccdNumber,
        cccdImageDataUrl: d.cccdImageDataUrl,
        isCccdVerified: true,
        idCardVerifiedAt: d.verifiedAt,
        trustScore: d.trustScore,
      }) : prev);
      setCccdPreview(d.cccdImageDataUrl);
      setCccdFile(null);
    } catch (err) {
      setVerifyMsg({ type: 'danger', text: err.response?.data?.message || err.message || 'Xac minh that bai' });
    } finally {
      setVerifying(false);
    }
  }

  async function handleSendOtp() {
    setPassMsg({ type: '', text: '' });
    if (!resetEmail.trim()) {
      setPassMsg({ type: 'danger', text: 'Vui long nhap email de nhan OTP.' });
      return;
    }

    try {
      setSendingOtp(true);
      const res = await sendPasswordResetOtp({ email: resetEmail.trim() });
      setPassMsg({ type: 'success', text: `${res.message}. OTP co hieu luc ${res.expiresInMinutes} phut.` });
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.response?.data?.message || err.message || 'Gui OTP that bai.' });
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResetPassword() {
    setPassMsg({ type: '', text: '' });

    if (!resetEmail.trim() || !otp.trim() || !newPassword) {
      setPassMsg({ type: 'danger', text: 'Vui long nhap day du Email, OTP va mat khau moi.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'danger', text: 'Mat khau xac nhan khong khop.' });
      return;
    }

    try {
      setResettingPassword(true);
      const res = await resetPasswordWithOtp({
        email: resetEmail.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setPassMsg({ type: 'success', text: res.message + '. Dang chuyen ve trang dang nhap...' });
      setTimeout(() => {
        window.location.href = '/login?passwordReset=true';
      }, 1400);
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.response?.data?.message || err.message || 'Dat lai mat khau that bai.' });
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <SiteLayout activePage="my-account" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Tai khoan cua ban</h2>
          <p className="text-muted mb-0">Quan ly bao mat, upload anh CCCD de tang do tin cay va dat lai mat khau bang ma OTP Gmail.</p>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}

        {accountUser && (
          <div className="card card-body mb-3">
            <div className="row g-3">
              <div className="col-md-6">
                <div><strong>Tai khoan:</strong> {accountUser.username || '-'}</div>
                <div><strong>Ho ten:</strong> {accountUser.fullName || accountUser.name}</div>
                <div><strong>Email:</strong> {accountUser.email}</div>
                <div><strong>SDT:</strong> {accountUser.phone || '-'}</div>
              </div>
              <div className="col-md-6">
                <div><strong>Do tin cay:</strong> {accountUser.trustScore}%</div>
                <div><strong>Trang thai xac minh:</strong> {accountUser.isCccdVerified ? 'Da xac minh CCCD' : 'Chua xac minh CCCD'}</div>
                <div><strong>So CCCD:</strong> {accountUser.cccdNumber || '-'}</div>
                <div><strong>Xac minh luc:</strong> {fmtDate(accountUser.idCardVerifiedAt)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="card card-body mb-3">
          <h5>Upload anh CCCD de tang do tin cay</h5>
          <p className="text-muted small">Tai len anh CCCD de he thong quet Ho va ten. Khi ten tren CCCD trung voi ten tai khoan, trust score se tang len 80%.</p>
          <form onSubmit={handleVerifySubmit}>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label">So CCCD</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhap so CCCD (9-12 chu so)"
                  value={cccdNumber}
                  onChange={(e) => setCccdNumber(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Anh CCCD</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="form-control"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCccdFile(file);
                    if (file) {
                      const localUrl = URL.createObjectURL(file);
                      setCccdPreview(localUrl);
                    }
                  }}
                />
              </div>
              {cccdPreview && (
                <div className="col-12">
                  <div className="border rounded-3 p-2 d-inline-block bg-light">
                    <img src={cccdPreview} alt="CCCD preview" style={{ maxWidth: 320, width: '100%', borderRadius: 12 }} />
                  </div>
                </div>
              )}
              <div className="col-12">
                <button className="btn btn-brand" type="submit" disabled={verifying}>
                  {verifying ? 'Dang xac minh...' : 'Tai len va xac minh CCCD'}
                </button>
              </div>
            </div>
          </form>
          {verifyMsg.text && <div className={`alert alert-${verifyMsg.type} mb-0 mt-2`}>{verifyMsg.text}</div>}
        </div>

        <div className="card card-body mb-3" style={{ borderRadius: 16 }}>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 40, height: 40, borderRadius: '50%', flex: '0 0 40px', background: 'linear-gradient(135deg,#1e4fc2,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><polyline points="16 3 12 7 8 3" /></svg>
            </div>
            <div>
              <h5 className="mb-0" style={{ fontSize: '1rem' }}>Doi mat khau bang ma OTP Gmail</h5>
              <small className="text-muted">Nhap email, gui OTP, sau do xac nhan mat khau moi.</small>
            </div>
          </div>

          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold small mb-1">Email dang ky</label>
              <input className="form-control" placeholder="example@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-primary w-100" type="button" onClick={handleSendOtp} disabled={sendingOtp}>
                {sendingOtp ? 'Dang gui...' : 'Gui OTP'}
              </button>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small mb-1">Ma OTP</label>
              <input className="form-control" placeholder="6 chu so" value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small mb-1">Mat khau moi</label>
              <input type="password" className="form-control" placeholder="Toi thieu 6 ky tu" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small mb-1">Xac nhan MK</label>
              <input type="password" className="form-control" placeholder="Nhap lai" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="col-12">
              <button className="btn btn-brand btn-sm" type="button" onClick={handleResetPassword} disabled={resettingPassword}>
                {resettingPassword ? 'Dang dat lai...' : 'Xac nhan doi mat khau'}
              </button>
            </div>
          </div>

          {passMsg.text && <div className={`alert alert-${passMsg.type} mb-0 mt-2`}>{passMsg.text}</div>}
        </div>
      </div>
    </SiteLayout>
  );
}
