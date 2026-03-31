import { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { createSupportRequest } from '../services/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: 'Đặt phòng & booking', message: '' });
  const [result, setResult] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSend() {
    if (!form.name || !form.email || !form.message) {
      setResult({ type: 'warning', text: 'Vui lòng điền đầy đủ thông tin.' });
      return;
    }

    try {
      setSubmitting(true);
      const data = await createSupportRequest(form);
      setResult({ type: 'success', text: data?.message || 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.' });
      setForm({ name: '', email: '', topic: 'Đặt phòng & booking', message: '' });
    } catch (error) {
      setResult({ type: 'danger', text: error?.response?.data?.message || 'Không gửi được yêu cầu hỗ trợ. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout activePage="contact" headerVariant="light">
      <style>{`
        .contact-hero{background:linear-gradient(135deg,#0f2655 0%,#1a3f8f 55%,#1e5ba8 100%);border-radius:22px;padding:52px 48px;color:#fff;position:relative;overflow:hidden;margin-bottom:28px}
        .contact-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(100,170,255,.18) 0%,transparent 55%),radial-gradient(circle at 10% 90%,rgba(60,120,220,.14) 0%,transparent 45%)}
        .contact-hero h1{font-size:clamp(1.6rem,3vw,2.2rem);font-weight:800;position:relative}
        .contact-hero p{opacity:.82;max-width:520px;position:relative;font-size:.97rem}
        .contact-kpi{display:flex;gap:28px;flex-wrap:wrap;margin-top:28px;position:relative}
        .contact-kpi-item strong{display:block;font-size:1.5rem;font-weight:800;line-height:1}
        .contact-kpi-item span{font-size:.8rem;opacity:.75;letter-spacing:.4px}
        .ci-card{border-radius:20px;border:1px solid #dde8ff;background:#fff;box-shadow:0 12px 28px rgba(20,50,110,.08);padding:28px 24px;height:100%;transition:transform .28s,box-shadow .28s}
        .ci-card:hover{transform:translateY(-4px);box-shadow:0 22px 40px rgba(20,50,110,.14)}
        .ci-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#2050c8,#3b82f6);display:flex;align-items:center;justify-content:center;margin-bottom:14px;color:#fff;font-size:1.1rem}
        .ci-card h5{font-size:.97rem;font-weight:700;color:#1d2a4f;margin-bottom:12px}
        .ci-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;font-size:.9rem;color:#3c4f72}
        .ci-row i{margin-top:2px;width:16px;text-align:center;color:#3b82f6}
        .contact-form-card{border-radius:20px;border:1px solid #dde8ff;background:linear-gradient(145deg,#f8faff 0%,#fff 100%);box-shadow:0 12px 28px rgba(20,50,110,.08);padding:32px}
        .contact-form-card h4{font-size:1.1rem;font-weight:700;color:#1d2a4f;margin-bottom:6px}
        .cta-strip{border-radius:18px;background:linear-gradient(120deg,#f0f5ff 0%,#e8f0fe 100%);border:1px solid #d1dfff;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-top:28px}
        .cta-strip h5{font-weight:700;color:#1d2a4f;margin:0}
        .cta-strip p{color:#5a6a8e;margin:4px 0 0;font-size:.9rem}
      `}</style>

      <main className="container py-4">
        <div className="contact-hero">
          <h1>Liên hệ &amp; Hỗ trợ</h1>
          <p>Chuyên viên tư vấn của CCT Hotels luôn sẵn sàng hỗ trợ bạn 24/7 — từ đặt phòng, thanh toán cho đến voucher và xác minh tài khoản.</p>
          <div className="contact-kpi">
            <div className="contact-kpi-item"><strong>24/7</strong><span>Hỗ trợ trực tuyến</span></div>
            <div className="contact-kpi-item"><strong>&lt; 2h</strong><span>Thời gian phản hồi</span></div>
            <div className="contact-kpi-item"><strong>3</strong><span>Chi nhánh toàn quốc</span></div>
          </div>
        </div>

        <div className="row g-3 mb-2">
          <div className="col-lg-4">
            <div className="ci-card">
              <div className="ci-icon"><i className="fa-solid fa-phone" /></div>
              <h5>Hotline hỗ trợ</h5>
              <div className="ci-row"><i className="fa-solid fa-phone" /><span><strong>0900 123 456</strong><br /><small className="text-muted">Thứ 2 – CN | 08:00 – 22:00</small></span></div>
              <div className="ci-row"><i className="fa-brands fa-line" /><span>LINE/Zalo: <strong>0900 123 456</strong></span></div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="ci-card">
              <div className="ci-icon"><i className="fa-solid fa-envelope" /></div>
              <h5>Email liên hệ</h5>
              <div className="ci-row"><i className="fa-solid fa-envelope" /><span>support@ccthotels.vn</span></div>
              <div className="ci-row"><i className="fa-solid fa-circle-info" /><span>Phản hồi trong vòng 2 giờ trong giờ hành chính.</span></div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="ci-card">
              <div className="ci-icon"><i className="fa-solid fa-location-dot" /></div>
              <h5>Văn phòng đại diện</h5>
              <div className="ci-row"><i className="fa-solid fa-location-dot" /><span>123 Nguyễn Huệ, Q1, TP.HCM</span></div>
              <div className="ci-row"><i className="fa-solid fa-location-dot" /><span>45 Bạch Đằng, Hải Châu, Đà Nẵng</span></div>
              <div className="ci-row"><i className="fa-solid fa-location-dot" /><span>88 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội</span></div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-7">
            <div className="contact-form-card">
              <h4>Gửi tin nhắn cho chúng tôi</h4>
              <p className="text-muted small mb-3">Hãy cho chúng tôi biết bạn cần hỗ trợ điều gì, đội ngũ sẽ liên hệ lại sớm nhất.</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Họ tên</label>
                  <input className="form-control" name="name" placeholder="Nguyễn Văn A" value={form.name} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Email</label>
                  <input className="form-control" name="email" type="email" placeholder="example@email.com" value={form.email} onChange={handleChange} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Chủ đề</label>
                  <select className="form-select" name="topic" value={form.topic} onChange={handleChange}>
                    <option>Đặt phòng &amp; booking</option>
                    <option>Thanh toán / VNPAY</option>
                    <option>Voucher &amp; khuyến mãi</option>
                    <option>Xác minh CCCD / tài khoản</option>
                    <option>Phản ánh khác</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Nội dung</label>
                  <textarea className="form-control" name="message" rows={4} placeholder="Mô tả vấn đề bạn đang gặp phải..." value={form.message} onChange={handleChange} />
                </div>
                <div className="col-12">
                  <button className="btn btn-brand" type="button" onClick={handleSend} disabled={submitting}>
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}
                  </button>
                </div>
                {result.text && (
                  <div className="col-12">
                    <div className={`alert alert-${result.type} mb-0`}>{result.text}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="ci-card d-flex flex-column gap-3">
              <div>
                <h5 style={{ fontSize: '.97rem' }}>Giờ làm việc</h5>
                <table className="table table-sm mb-0" style={{ fontSize: '.88rem' }}>
                  <tbody>
                    <tr><td>Thứ 2 – Thứ 6</td><td className="text-end fw-semibold">08:00 – 18:00</td></tr>
                    <tr><td>Thứ 7</td><td className="text-end fw-semibold">09:00 – 17:00</td></tr>
                    <tr><td>Chủ nhật</td><td className="text-end fw-semibold">10:00 – 15:00</td></tr>
                    <tr><td>Chat bot 24/7</td><td className="text-end fw-semibold">Mọi ngày</td></tr>
                  </tbody>
                </table>
              </div>
              <hr className="my-0" />
              <div>
                <h5 style={{ fontSize: '.97rem' }}>Điều hướng nhanh</h5>
                <div className="d-flex flex-wrap gap-2">
                  <Link className="btn btn-brand btn-sm" to="/booking">Đặt phòng</Link>
                  <Link className="btn btn-outline-secondary btn-sm" to="/my-bookings">Đơn của tôi</Link>
                  <Link className="btn btn-outline-secondary btn-sm" to="/chatbot">AI Chatbot</Link>
                  <Link className="btn btn-outline-secondary btn-sm" to="/my-account">Tài khoản</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-strip">
          <div>
            <h5>Bạn cần hỗ trợ ngay?</h5>
            <p>Truyện trực tiếp với AI chatbot — sẵn sàng hỗ trợ mọi lúc.</p>
          </div>
          <Link className="btn btn-brand" to="/chatbot">Mở Chat AI ngay</Link>
        </div>
      </main>
    </SiteLayout>
  );
}
