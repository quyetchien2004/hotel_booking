import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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

function getVerificationBreakdown(userLike) {
  const fallback = {
    nameMatched: Boolean(userLike?.cccdNameMatched),
    faceMatched: Boolean(userLike?.faceMatched),
    faceSimilarityScore: Number(userLike?.faceMatchScore || 0),
    faceMatchThreshold: 50,
  };
  const breakdown = userLike?.verificationBreakdown || fallback;
  return {
    nameMatched: Boolean(breakdown.nameMatched),
    faceMatched: Boolean(breakdown.faceMatched),
    nameScore: Number(breakdown.nameScore ?? (breakdown.nameMatched ? 40 : 0)),
    faceScore: Number(breakdown.faceScore ?? (breakdown.faceMatched ? 40 : 0)),
    totalScore: Number(breakdown.totalScore ?? 0),
    faceSimilarityScore: Number((breakdown.faceSimilarityScore ?? userLike?.faceMatchScore) || 0),
    faceMatchThreshold: Number(breakdown.faceMatchThreshold || 50),
  };
}

function getTrustStatusText(accountUser, breakdown) {
  if (accountUser?.isLoyalGuest) {
    return 'Khách hàng thân thiết Premium, đã mở khóa đặt phòng thanh toán sau và đặc quyền ưu tiên.';
  }

  if (breakdown.totalScore >= 80) {
    return 'Bạn đã vượt mốc eKYC cơ bản. Hồ sơ có thể tiếp tục tăng trust score lên 100% sau các booking thành công.';
  }

  if (breakdown.nameScore >= 40) {
    return 'Họ tên tài khoản đã khớp với CCCD, nhưng khuôn mặt chưa đạt ngưỡng hoàn tất eKYC.';
  }

  return 'Hoàn tất đối chiếu CCCD và selfie để mở khóa mốc trust 80% cho tài khoản.';
}

export default function MyAccountPage() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const pendingCameraStreamRef = useRef(null);

  const [accountUser, setAccountUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cccdNumber, setCccdNumber] = useState('');
  const [cccdFile, setCccdFile] = useState(null);
  const [cccdPreview, setCccdPreview] = useState('');
  const [facePreview, setFacePreview] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [liveFaceCaptured, setLiveFaceCaptured] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState({ type: '', text: '' });
  const [verifying, setVerifying] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const trustTone = useMemo(() => {
    const trust = Number(accountUser?.trustScore || 0);
    if (trust >= 100) return 'trust-max';
    if (trust >= 80) return 'trust-high';
    if (trust >= 40) return 'trust-medium';
    return 'trust-low';
  }, [accountUser?.trustScore]);

  const verificationBreakdown = useMemo(
    () => getVerificationBreakdown(accountUser),
    [accountUser],
  );

  const premiumMode = useMemo(
    () => Boolean(accountUser?.isLoyalGuest || Number(accountUser?.trustScore || 0) >= 100),
    [accountUser?.isLoyalGuest, accountUser?.trustScore],
  );

  const verificationSteps = useMemo(
    () => [
      {
        key: 'name',
        title: 'Họ tên tài khoản',
        score: verificationBreakdown.nameScore,
        complete: verificationBreakdown.nameMatched,
        description: verificationBreakdown.nameMatched
          ? 'Họ tên trên CCCD khớp với thông tin tài khoản.'
          : 'Cần OCR được đúng họ tên trên CCCD và trùng với tài khoản.',
      },
      {
        key: 'face',
        title: 'Khuôn mặt selfie',
        score: verificationBreakdown.faceScore,
        complete: verificationBreakdown.faceMatched,
        description: verificationBreakdown.faceMatched
          ? `Độ tương đồng ${verificationBreakdown.faceSimilarityScore}% vượt ngưỡng ${verificationBreakdown.faceMatchThreshold}%.`
          : `Cần selfie trùng ảnh chân dung trên CCCD từ ${verificationBreakdown.faceMatchThreshold}% trở lên.`,
      },
    ],
    [verificationBreakdown],
  );

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
        setFacePreview(profile?.faceImageDataUrl || '');
        setLiveFaceCaptured(false);
      })
      .catch(() => {
        setPassMsg({ type: 'danger', text: 'Không tải được thông tin tài khoản.' });
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => () => {
    if (pendingCameraStreamRef.current) {
      pendingCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      pendingCameraStreamRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !pendingCameraStreamRef.current) {
      return undefined;
    }

    const videoElement = videoRef.current;
    const stream = pendingCameraStreamRef.current;
    pendingCameraStreamRef.current = null;
    cameraStreamRef.current = stream;
    videoElement.srcObject = stream;

    const startPlayback = async () => {
      try {
        await videoElement.play();
      } catch {
        setCameraError('Camera đã mở nhưng trình duyệt chưa thể phát preview. Hãy thử bấm mở camera lại.');
      }
    };

    startPlayback();

    return () => {
      if (videoElement.srcObject === stream) {
        videoElement.srcObject = null;
      }
    };
  }, [cameraActive]);

  if (!user) return <Navigate to="/login" replace />;

  function stopCamera() {
    if (pendingCameraStreamRef.current) {
      pendingCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      pendingCameraStreamRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setCameraReady(false);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Trình duyệt hiện tại không hỗ trợ mở camera trực tiếp.');
      return;
    }

    setCameraError('');
    setVerifyMsg({ type: '', text: '' });

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraReady(false);
      pendingCameraStreamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      stopCamera();
      setCameraError('Không thể truy cập camera. Hãy cấp quyền camera rồi thử lại.');
    }
  }

  function captureFaceSnapshot() {
    if (!videoRef.current || !canvasRef.current) {
      setCameraError('Không thể chụp ảnh từ camera lúc này.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera chưa sẵn sàng để chụp ảnh.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Không thể xử lý khung hình camera.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const snapshot = canvas.toDataURL('image/jpeg', 0.92);
    setFacePreview(snapshot);
    setLiveFaceCaptured(true);
    setCameraError('');
    stopCamera();
  }

  function persistAccountUser(nextUser) {
    setAccountUser(nextUser);
    setUser(nextUser);
    localStorage.setItem('authUser', JSON.stringify(nextUser));
  }

  async function handleVerifySubmit(e) {
    e.preventDefault();
    if (!cccdNumber.trim()) {
      setVerifyMsg({ type: 'danger', text: 'Vui lòng nhập số CCCD.' });
      return;
    }

    if (!cccdFile && !cccdPreview) {
      setVerifyMsg({ type: 'danger', text: 'Vui lòng chọn ảnh CCCD.' });
      return;
    }

    if (!liveFaceCaptured || !facePreview.startsWith('data:image/')) {
      setVerifyMsg({ type: 'danger', text: 'Vui lòng chụp ảnh khuôn mặt trực tiếp trong phiên hiện tại để đối sánh eKYC.' });
      return;
    }

    setVerifying(true);
    try {
      const payload = new FormData();
      payload.append('cccdNumber', cccdNumber.trim());
      if (cccdFile) {
        payload.append('cccdImage', cccdFile);
      } else if (cccdPreview.startsWith('data:image/')) {
        payload.append('cccdImageDataUrl', cccdPreview);
      }
      if (facePreview.startsWith('data:image/')) {
        payload.append('faceImageDataUrl', facePreview);
      }

      const d = await verifyCccd(payload);
      const nextUser = accountUser ? {
        ...accountUser,
        cccdNumber: d.cccdNumber,
        cccdImageDataUrl: d.cccdImageDataUrl,
        faceImageDataUrl: d.faceImageDataUrl,
        isCccdVerified: d.verificationBreakdown?.totalScore >= 80,
        cccdNameMatched: d.nameMatched,
        cccdNameVerifiedAt: d.cccdNameVerifiedAt,
        faceMatched: d.faceMatched,
        faceMatchScore: d.faceMatchScore,
        faceVerifiedAt: d.faceVerifiedAt,
        idCardVerifiedAt: d.verifiedAt,
        trustScore: d.trustScore,
        verificationBreakdown: d.verificationBreakdown,
      } : null;

      setVerifyMsg({
        type: d.verificationBreakdown?.totalScore >= 80 ? 'success' : 'warning',
        text: `${d.message}. Họ tên quét được: ${d.extractedName}. Điểm xác thực: ${d.verificationBreakdown?.nameScore || 0}% tên + ${d.verificationBreakdown?.faceScore || 0}% khuôn mặt. Độ tương đồng khuôn mặt: ${d.faceMatchScore || 0}%. Trust hiện tại: ${d.trustScore}%.`,
      });
      if (nextUser) {
        persistAccountUser(nextUser);
      }
      setCccdPreview(d.cccdImageDataUrl);
      setFacePreview(d.faceImageDataUrl);
      setCccdFile(null);
      setLiveFaceCaptured(false);
    } catch (err) {
      setVerifyMsg({ type: 'danger', text: err.response?.data?.message || err.message || 'Xác minh thất bại.' });
    } finally {
      setVerifying(false);
    }
  }

  async function handleSendOtp() {
    setPassMsg({ type: '', text: '' });
    if (!resetEmail.trim()) {
      setPassMsg({ type: 'danger', text: 'Vui lòng nhập email để nhận OTP.' });
      return;
    }

    try {
      setSendingOtp(true);
      const res = await sendPasswordResetOtp({ email: resetEmail.trim() });
      setPassMsg({ type: 'success', text: `${res.message}. OTP có hiệu lực ${res.expiresInMinutes} phút.` });
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.response?.data?.message || err.message || 'Gửi OTP thất bại.' });
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResetPassword() {
    setPassMsg({ type: '', text: '' });

    if (!resetEmail.trim() || !otp.trim() || !newPassword) {
      setPassMsg({ type: 'danger', text: 'Vui lòng nhập đầy đủ email, OTP và mật khẩu mới.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'danger', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    try {
      setResettingPassword(true);
      const res = await resetPasswordWithOtp({
        email: resetEmail.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setPassMsg({ type: 'success', text: res.message + '. Đang chuyển về trang đăng nhập...' });
      logout();
      setTimeout(() => {
        navigate('/login?passwordReset=true', { replace: true });
      }, 1400);
    } catch (err) {
      setPassMsg({ type: 'danger', text: err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại.' });
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <SiteLayout activePage="my-account" headerVariant={premiumMode ? 'dark' : 'light'}>
      <div className={`container py-4 my-account-shell${premiumMode ? ' is-premium' : ''}`}>
        <section className={`my-account-hero mb-4${premiumMode ? ' my-account-hero--premium' : ''}`}>
          <div className="my-account-hero__copy">
            <span className="my-account-kicker">MY ACCOUNT</span>
            {premiumMode ? <span className="my-account-premium-badge">PREMIUM MEMBER</span> : null}
            <h2>{premiumMode ? 'Trung tâm đặc quyền của bạn' : 'Tài khoản của bạn'}</h2>
            <p>
              {premiumMode
                ? 'Hồ sơ premium tổng hợp trust score, xác thực eKYC, lịch sử trung thành và các đặc quyền ưu tiên trong một không gian sang trọng hơn.'
                : 'Quản lý hồ sơ, hoàn tất eKYC bằng CCCD và selfie, đồng bộ trust score và đặt lại mật khẩu trong một giao diện hiện đại hơn.'}
            </p>
            <div className="my-account-status-pills">
              <span className="my-account-score-chip">Trust {Number(accountUser?.trustScore || 0)}%</span>
              <span className="my-account-score-chip">eKYC {verificationBreakdown.totalScore}%</span>
              <span className="my-account-score-chip">{accountUser?.successfulBookingCount || 0} booking thành công</span>
            </div>
          </div>
          <div className={`my-account-trust-card ${trustTone}`}>
            <span className="my-account-trust-card__label">Độ tin cậy tài khoản</span>
            <strong>{Number(accountUser?.trustScore || 0)}%</strong>
            <span>{getTrustStatusText(accountUser, verificationBreakdown)}</span>
            <div className="my-account-mini-stat-grid">
              <div className="my-account-mini-stat">
                <small>Họ tên</small>
                <strong>{verificationBreakdown.nameScore}%</strong>
              </div>
              <div className="my-account-mini-stat">
                <small>Khuôn mặt</small>
                <strong>{verificationBreakdown.faceScore}%</strong>
              </div>
              <div className="my-account-mini-stat">
                <small>Similarity</small>
                <strong>{verificationBreakdown.faceSimilarityScore}%</strong>
              </div>
            </div>
          </div>
        </section>

        {premiumMode && accountUser && (
          <section className="my-account-premium-strip mb-4">
            <div className="my-account-premium-strip__copy">
              <span className="my-account-kicker">LOYALTY TIERS</span>
              <h3>Trạng thái Premium đã được mở khóa</h3>
              <p>Bạn đã đủ điều kiện khách hàng thân thiết. Hệ thống ưu tiên xử lý hỗ trợ, giữ chân dung eKYC và mở khóa các đặc quyền đặt phòng linh hoạt.</p>
            </div>
            <div className="my-account-premium-strip__grid">
              <div><strong>Thanh toán sau</strong><span>Áp dụng với đơn đặt phòng theo chính sách loyal.</span></div>
              <div><strong>Hỗ trợ ưu tiên</strong><span>Yêu cầu của bạn được đẩy lên nhóm xử lý nhanh hơn.</span></div>
              <div><strong>Hồ sơ premium</strong><span>Trust score cao, eKYC đầy đủ và khả năng nhận ưu đãi tốt hơn.</span></div>
            </div>
          </section>
        )}

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}

        {accountUser && (
          <section className="row g-4 mb-4">
            <div className="col-lg-7">
              <div className="my-account-profile-card h-100">
                <div className="my-account-profile-card__head">
                  <div>
                    <span className="my-account-kicker">THÔNG TIN HỒ SƠ</span>
                    <h3>{accountUser.fullName || accountUser.name}</h3>
                    <p>{accountUser.email}</p>
                  </div>
                  <div className="my-account-avatar-badge">
                    {(accountUser.fullName || accountUser.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                </div>

                <div className="my-account-info-grid">
                  <div className="my-account-info-item"><span>Tài khoản</span><strong>{accountUser.username || '-'}</strong></div>
                  <div className="my-account-info-item"><span>Họ tên</span><strong>{accountUser.fullName || accountUser.name}</strong></div>
                  <div className="my-account-info-item"><span>Email</span><strong>{accountUser.email}</strong></div>
                  <div className="my-account-info-item"><span>Số điện thoại</span><strong>{accountUser.phone || '-'}</strong></div>
                </div>

                <div className="my-account-status-pills mt-3">
                  <span className="my-account-score-chip">{accountUser.isLoyalGuest ? 'Premium loyalty' : 'Standard member'}</span>
                  <span className="my-account-score-chip">{accountUser.isCccdVerified ? 'eKYC đầy đủ' : 'eKYC chưa hoàn tất'}</span>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="my-account-status-card h-100">
                <span className="my-account-kicker">TRẠNG THÁI XÁC THỰC</span>
                <h3>{accountUser.isCccdVerified ? 'Đã hoàn tất eKYC cơ bản' : 'Đang trong quá trình eKYC'}</h3>
                <div className="my-account-status-list">
                  <div><span>Độ tin cậy</span><strong>{accountUser.trustScore}%</strong></div>
                  <div><span>Điểm tên tài khoản</span><strong>{verificationBreakdown.nameScore}%</strong></div>
                  <div><span>Điểm đối sánh mặt</span><strong>{verificationBreakdown.faceScore}%</strong></div>
                  <div><span>Độ tương đồng khuôn mặt</span><strong>{verificationBreakdown.faceSimilarityScore}%</strong></div>
                  <div><span>Số CCCD</span><strong>{accountUser.cccdNumber || '-'}</strong></div>
                  <div><span>Thời điểm xác minh</span><strong>{fmtDate(accountUser.idCardVerifiedAt)}</strong></div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="my-account-step-grid mb-4">
          {verificationSteps.map((step) => (
            <article key={step.key} className={`my-account-step-card${step.complete ? ' is-complete' : ''}`}>
              <span className="my-account-kicker">{step.key === 'name' ? 'MATCH NAME' : 'MATCH FACE'}</span>
              <div className="my-account-step-card__head">
                <h4>{step.title}</h4>
                <strong>{step.score}%</strong>
              </div>
              <p>{step.description}</p>
            </article>
          ))}
        </section>

        <section className="row g-4">
          <div className="col-xl-7">
            <div className={`my-account-panel h-100${premiumMode ? ' my-account-panel--premium' : ''}`}>
              <div className="my-account-panel__head">
                <div>
                  <span className="my-account-kicker">eKYC CCCD + SELFIE</span>
                  <h5>Tải CCCD và chụp live khuôn mặt để mở khóa trust 80%</h5>
                  <p>
                    Hệ thống sẽ AI-check ảnh CCCD không phù hợp, OCR họ tên trên thẻ và đối chiếu ảnh chụp trực tiếp với ảnh chân dung trên CCCD.
                    Bạn nhận 40% khi họ tên trùng, thêm 40% nếu khuôn mặt đạt từ 50% trở lên.
                  </p>
                </div>
                <div className="my-account-tip-box">
                  <strong>Gợi ý eKYC</strong>
                  <span>CCCD mặt trước rõ nét, mở camera ở nơi đủ sáng, chỉ một khuôn mặt trong khung hình và nhìn thẳng khi chụp.</span>
                </div>
              </div>

              <form onSubmit={handleVerifySubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Số CCCD</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập số CCCD (9-12 chữ số)"
                      value={cccdNumber}
                      onChange={(e) => setCccdNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ảnh CCCD mặt trước</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="form-control"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setCccdFile(file);
                        setVerifyMsg({ type: '', text: '' });
                        if (file) {
                          const localUrl = URL.createObjectURL(file);
                          setCccdPreview(localUrl);
                        }
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Chụp khuôn mặt trực tiếp</label>
                    <div className="my-account-camera-box">
                      {cameraActive ? (
                        <video
                          ref={videoRef}
                          className={`my-account-camera-feed${cameraReady ? ' is-ready' : ''}`}
                          playsInline
                          muted
                          autoPlay
                          onLoadedMetadata={() => setCameraReady(true)}
                        />
                      ) : (
                        <div className="my-account-camera-placeholder">
                          {liveFaceCaptured
                            ? 'Ảnh live đã được chụp. Bạn có thể mở camera lại để chụp mới.'
                            : 'Mở camera và chụp trực tiếp để xác thực khuôn mặt.'}
                        </div>
                      )}
                      <canvas ref={canvasRef} className="d-none" />
                    </div>
                    <div className="my-account-camera-actions">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={startCamera}
                      >
                        {cameraActive ? 'Khởi động lại camera' : liveFaceCaptured ? 'Chụp lại khuôn mặt' : 'Mở camera'}
                      </button>
                      <button type="button" className="btn btn-brand btn-sm" onClick={captureFaceSnapshot} disabled={!cameraActive || !cameraReady}>
                        Chụp xác thực
                      </button>
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={stopCamera} disabled={!cameraActive}>
                        Tắt camera
                      </button>
                    </div>
                    {cameraError ? <div className="text-danger small mt-2">{cameraError}</div> : null}
                    {!liveFaceCaptured && !cameraActive ? <div className="text-muted small mt-2">Bạn cần mở camera và chụp trực tiếp trước khi bấm xác minh.</div> : null}
                  </div>
                  {(cccdPreview || facePreview) && (
                    <div className="col-12">
                      <div className="my-account-preview-grid">
                        {cccdPreview && (
                          <div className="my-account-preview-box my-account-preview-box--framed">
                            <span>Ảnh CCCD</span>
                            <img src={cccdPreview} alt="CCCD preview" className="my-account-preview-box__image" />
                          </div>
                        )}
                        {facePreview && (
                          <div className="my-account-preview-box my-account-preview-box--framed">
                            <span>{liveFaceCaptured ? 'Ảnh chụp live để đối sánh' : 'Ảnh khuôn mặt đã lưu gần nhất'}</span>
                            <img src={facePreview} alt="Face preview" className="my-account-preview-box__image" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="col-12 d-flex flex-wrap gap-2 align-items-center">
                    <button className="btn btn-brand" type="submit" disabled={verifying}>
                      {verifying ? 'Đang xác minh eKYC...' : 'Bắt đầu đối chiếu CCCD + live face'}
                    </button>
                    <span className="text-muted small">OCR và đối sánh AI có thể mất 20-60 giây tùy chất lượng ảnh. Ảnh khuôn mặt phải được chụp trực tiếp từ camera trong phiên hiện tại.</span>
                  </div>
                </div>
              </form>
              {verifyMsg.text && <div className={`alert alert-${verifyMsg.type} mb-0 mt-3`}>{verifyMsg.text}</div>}
            </div>
          </div>

          <div className="col-xl-5">
            <div className="my-account-panel h-100">
              <div className="my-account-panel__head compact">
                <div>
                  <span className="my-account-kicker">BẢO MẬT TÀI KHOẢN</span>
                  <h5>Đổi mật khẩu bằng mã OTP Gmail</h5>
                  <p>Nhập email, gửi OTP, sau đó xác nhận mật khẩu mới ngay tại đây. Trạng thái đăng nhập sẽ được làm mới sau khi đổi thành công.</p>
                </div>
              </div>

              <div className="row g-3 align-items-end">
                <div className="col-12">
                  <label className="form-label fw-semibold small mb-1">Email đăng ký</label>
                  <input className="form-control" placeholder="example@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                </div>
                <div className="col-12">
                  <button className="btn btn-outline-primary w-100" type="button" onClick={handleSendOtp} disabled={sendingOtp}>
                    {sendingOtp ? 'Đang gửi...' : 'Gửi OTP'}
                  </button>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small mb-1">Mã OTP</label>
                  <input className="form-control" placeholder="6 chữ số" value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small mb-1">Mật khẩu mới</label>
                  <input type="password" className="form-control" placeholder="Tối thiểu 6 ký tự" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small mb-1">Xác nhận mật khẩu</label>
                  <input type="password" className="form-control" placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div className="col-12">
                  <button className="btn btn-brand w-100" type="button" onClick={handleResetPassword} disabled={resettingPassword}>
                    {resettingPassword ? 'Đang đặt lại...' : 'Xác nhận đổi mật khẩu'}
                  </button>
                </div>
              </div>

              {passMsg.text && <div className={`alert alert-${passMsg.type} mb-0 mt-3`}>{passMsg.text}</div>}
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
