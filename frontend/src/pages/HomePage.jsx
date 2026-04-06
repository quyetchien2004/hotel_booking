import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/js/home-modern.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { try { document.body.removeChild(script); } catch {} };
  }, []);

  return (
    <>
      <header className="site-header">
        <SiteHeader activePage="home" variant="dark" />
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="hero-tag">LUXURY STAY . SMART BOOKING . REAL-TIME SUPPORT</p>
              <h1>Nâng tầm trải nghiệm lưu trú cùng CCT Hotels Company</h1>
              <p className="hero-sub">
                Nền tảng đặt phòng thế hệ mới: tìm phòng theo khu vực, thời gian,
                ngân sách, voucher và hoàn tất thanh toán nhanh chóng chỉ trong vài bước.
              </p>
              <div className="hero-cta">
                <Link className="btn btn-brand btn-lg" to="/booking">Đặt phòng ngay</Link>
                <Link className="btn btn-light btn-lg hero-btn-light" to="/services">Khám phá dịch vụ</Link>
                {user && <Link className="btn btn-outline-light btn-lg" to="/my-bookings">Xem đơn của tôi</Link>}
              </div>
              <div className="hero-trustbar">
                <div className="trust-item"><strong>4.9/5</strong><span>Đánh giá khách lưu trú</span></div>
                <div className="trust-item"><strong>24/7</strong><span>AI Concierge hỗ trợ</span></div>
                <div className="trust-item"><strong>100%</strong><span>Thanh toán bảo mật VNPAY</span></div>
              </div>
            </div>

            <aside className="quick-search-card">
              <div className="card-head">
                <h2>Tìm phòng nhanh</h2>
                <p>Kết quả lấy từ API hệ thống trong thời gian thực.</p>
              </div>
              <form id="homeSearchForm" className="quick-search-form">
                <div className="row g-2">
                  <div className="col-7">
                    <label htmlFor="province" className="form-label">Tỉnh/Thành phố</label>
                    <input id="province" className="form-control" placeholder="VD: Da Nang" />
                  </div>
                  <div className="col-5">
                    <label htmlFor="rentalMode" className="form-label">Kiểu thuê</label>
                    <select id="rentalMode" className="form-select" required>
                      <option value="DAILY">Theo ngày</option>
                      <option value="HOURLY">Theo giờ</option>
                    </select>
                  </div>
                </div>
                <div className="row g-2 mt-1">
                  <div className="col-6">
                    <label htmlFor="maxPrice" className="form-label">Giá tối đa</label>
                    <input id="maxPrice" type="number" className="form-control" min="0" step="1000" placeholder="1000000" />
                  </div>
                  <div className="col-6">
                    <label htmlFor="voucherCode" className="form-label">Voucher</label>
                    <input id="voucherCode" className="form-control" placeholder="WELCOME10" />
                  </div>
                </div>
                <div id="dailyFields" className="row g-2 mt-1">
                  <div className="col-6">
                    <label htmlFor="startDate" className="form-label">Nhận phòng</label>
                    <input id="startDate" type="date" className="form-control" />
                  </div>
                  <div className="col-6">
                    <label htmlFor="endDate" className="form-label">Trả phòng</label>
                    <input id="endDate" type="date" className="form-control" />
                  </div>
                </div>
                <div id="hourlyFields" className="row g-2 mt-1 d-none">
                  <div className="col-6">
                    <label htmlFor="startDateTime" className="form-label">Bắt đầu</label>
                    <input id="startDateTime" type="datetime-local" className="form-control" />
                  </div>
                  <div className="col-6">
                    <label htmlFor="endDateTime" className="form-label">Kết thúc</label>
                    <input id="endDateTime" type="datetime-local" className="form-control" />
                  </div>
                </div>
                <div className="d-grid mt-3">
                  <button id="searchBtn" type="submit" className="btn btn-dark btn-lg">Kiểm tra phòng trống</button>
                </div>
              </form>
              <div id="searchResult" className="search-result">Sẵn sàng tìm phòng.</div>
              <div className="d-grid mt-2">
                <Link id="goBookingLink" className="btn btn-outline-dark" to="/booking">Mở trang đặt phòng chi tiết</Link>
              </div>
            </aside>
          </div>
        </section>
      </header>

      <main>
        <section className="feature-strip">
          <div className="container">
            <div className="section-head section-head--light">
              <p className="eyebrow">TRẢI NGHIỆM THEO NHU CẦU</p>
              <h2>Không gian phù hợp cho mọi chuyến đi</h2>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <article className="feature-item">
                  <i className="fa-solid fa-briefcase"></i>
                  <h3>Business Stay</h3>
                  <p>Ưu tiên vị trí trung tâm, check-in nhanh và không gian làm việc yên tĩnh.</p>
                </article>
              </div>
              <div className="col-md-4">
                <article className="feature-item">
                  <i className="fa-solid fa-heart"></i>
                  <h3>Couple Retreat</h3>
                  <p>Phòng thiết kế ấm cúng, khung cảnh sang trọng cho kỳ nghỉ riêng tư.</p>
                </article>
              </div>
              <div className="col-md-4">
                <article className="feature-item">
                  <i className="fa-solid fa-people-roof"></i>
                  <h3>Family Comfort</h3>
                  <p>Diện tích rộng, tiện nghi đa dạng và dịch vụ linh hoạt cho gia đình.</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="featured-room-section">
          <div className="container">
            <div className="section-head d-flex justify-content-between align-items-end flex-wrap gap-2">
              <div>
                <p className="eyebrow">PHÒNG NỔI BẬT</p>
                <h2>Gợi ý phòng cao cấp trong hôm nay</h2>
              </div>
              <Link className="btn btn-sm btn-outline-primary" to="/booking">Xem tất cả phòng</Link>
            </div>
            <div className="row g-3">
              {[
                { img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', badge: 'Đặt nhiều', price: 'Từ 1.250.000đ', name: 'Deluxe City View', desc: 'Không gian tinh tế, tầm nhìn trung tâm thành phố, phù hợp công tác và nghỉ dưỡng.', tags: ['2 khách', 'Wi-Fi', 'Breakfast'] },
                { img: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80', badge: 'Premium', badgeMod: 'room-badge--gold', price: 'Từ 1.950.000đ', name: 'Executive Suite', desc: 'Suite cao cấp với khu vực tiếp khách riêng, nội thất hiện đại và đầy đủ tiện nghi.', tags: ['3 khách', 'Bathtub', 'Lounge'] },
                { img: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1200&q=80', badge: 'Giá tốt hôm nay', badgeMod: 'room-badge--green', price: 'Từ 1.490.000đ', name: 'Family Garden Room', desc: 'Thiết kế rộng rãi, thuận tiện cho gia đình có trẻ nhỏ với khu vực thư giãn thoải mái.', tags: ['4 khách', 'Garden', 'Free cancel'] },
              ].map((room) => (
                <div className="col-lg-4 col-md-6" key={room.name}>
                  <article className="card featured-room-card h-100">
                    <img src={room.img} className="card-img-top" alt={room.name} />
                    <div className="card-body d-flex flex-column">
                      <div className="room-topline">
                        <span className={`room-badge ${room.badgeMod || ''}`}>{room.badge}</span>
                        <span className="room-price">{room.price}</span>
                      </div>
                      <h3>{room.name}</h3>
                      <p>{room.desc}</p>
                      <div className="room-tags">{room.tags.map(t => <span key={t}>{t}</span>)}</div>
                      <Link className="btn btn-brand btn-sm mt-auto align-self-start" to="/booking">Xem chi tiết</Link>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="voucher-journey">
          <div className="container">
            <div className="journey-shell card">
              <div className="card-body">
                <div className="section-head mb-3">
                  <p className="eyebrow">ƯU ĐÃI THÔNG MINH</p>
                  <h2>Hành trình nhận voucher theo cấp độ khách hàng</h2>
                </div>
                <div className="row g-3">
                  {[
                    { no: '01', code: 'WELCOME10', desc: 'Đăng ký tài khoản mới nhận ngay ưu đãi giảm 10%.' },
                    { no: '02', code: 'FREQUENT25', desc: 'Xác minh CCCD và hoàn tất booking đầu tiên để đạt trust 100, sau đó nhận ưu đãi giảm 25%.' },
                    { no: '03', code: 'LOYAL10', desc: 'Hoàn tất booking thành công lần thứ 2 để mở thêm voucher giảm 10%.' },
                  ].map(v => (
                    <div className="col-lg-4" key={v.no}>
                      <div className="journey-step">
                        <span className="step-no">{v.no}</span>
                        <h4>{v.code}</h4>
                        <p>{v.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="modules-section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">HỆ THỐNG CHỨC NĂNG</p>
              <h2>Di chuyển nhanh đến các module</h2>
            </div>
            <div className="row g-3">
              <div className="col-lg-3 col-md-6">
                <Link className="module-card" to="/booking">
                  <h4>Đặt phòng</h4>
                  <p>Tìm phòng, xem kết quả, tạo booking.</p>
                  <span>Đi tới trang đặt phòng</span>
                </Link>
              </div>
              {user && (
                <div className="col-lg-3 col-md-6">
                  <Link className="module-card" to="/my-bookings">
                    <h4>Đơn của tôi</h4>
                    <p>Theo dõi trạng thái và tổng thanh toán.</p>
                    <span>Xem lịch sử đặt phòng</span>
                  </Link>
                </div>
              )}
              {isAdmin && (
                <div className="col-lg-3 col-md-6">
                  <Link className="module-card" to="/admin/manage">
                    <h4>Quản trị</h4>
                    <p>Quản lý chi nhánh, phòng và voucher.</p>
                    <span>Mở bảng quản trị</span>
                  </Link>
                </div>
              )}
              {isAdmin && (
                <div className="col-lg-3 col-md-6">
                  <Link className="module-card" to="/users">
                    <h4>Người dùng</h4>
                    <p>Quản lý danh sách tài khoản hệ thống.</p>
                    <span>Mở trang users</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="social-proof-section">
          <div className="container">
            <div className="row g-3">
              <div className="col-lg-7">
                <div className="card testimonial-shell h-100">
                  <div className="card-body">
                    <div className="section-head mb-3">
                      <p className="eyebrow">ĐÁNH GIÁ KHÁCH HÀNG</p>
                      <h2>Trải nghiệm thực tế từ khách lưu trú</h2>
                    </div>
                    <div className="testimonial-item">
                      <p>"Giao diện đặt phòng rất dễ dùng, tốc độ nhanh và thông tin phòng rõ ràng."</p>
                      <div className="testimonial-meta"><strong>Anh Khang</strong><span>Khách công tác tại Đà Nẵng</span></div>
                    </div>
                    <div className="testimonial-item mt-3">
                      <p>"Voucher hiển thị minh bạch theo từng mốc và chatbot hỗ trợ rất tốt khi cần tra cứu nhanh."</p>
                      <div className="testimonial-meta"><strong>Chị Trâm</strong><span>Khách gia đình tại TP.HCM</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card blog-teaser h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="section-head mb-2">
                      <p className="eyebrow">TỪ BLOG CCT</p>
                      <h2 className="h4 mb-0">Mẹo lưu trú thông minh</h2>
                    </div>
                    <ul className="blog-mini-list">
                      <li><Link to="/blog/1">Mẹo đặt phòng vào mùa cao điểm</Link></li>
                      <li><Link to="/blog/3">Cách dùng voucher đúng thời điểm</Link></li>
                      <li><Link to="/blog/6">Checklist đặt phòng không lỗi cho người mới</Link></li>
                    </ul>
                    <Link className="btn btn-outline-primary btn-sm mt-auto align-self-start" to="/blog">Đọc tất cả bài viết</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
