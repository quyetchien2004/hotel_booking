import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';

export default function BookingPage() {
  const { user } = useAuth();

  useEffect(() => {
    const modalElement = document.getElementById('bookingModal');
    const originalParent = modalElement?.parentElement || null;
    const originalNextSibling = modalElement?.nextSibling || null;

    // Move the modal to <body> so Bootstrap positions it against the viewport,
    // not against any page wrapper that may affect fixed positioning.
    if (modalElement && modalElement.parentElement !== document.body) {
      document.body.appendChild(modalElement);
    }

    // Load Leaflet CSS
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCss.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletCss.crossOrigin = '';
    document.head.appendChild(leafletCss);

    // Load Leaflet JS then booking-modern.js
    const leafletJs = document.createElement('script');
    leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletJs.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletJs.crossOrigin = '';
    leafletJs.onload = () => {
      const bookingScript = document.createElement('script');
      bookingScript.src = '/js/booking-modern.js';
      bookingScript.async = true;
      document.body.appendChild(bookingScript);
    };
    document.body.appendChild(leafletJs);

    return () => {
      if (modalElement && originalParent) {
        if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
          originalParent.insertBefore(modalElement, originalNextSibling);
        } else {
          originalParent.appendChild(modalElement);
        }
      }

      try { document.head.removeChild(leafletCss); } catch {}
      try { document.body.removeChild(leafletJs); } catch {}
      const bScript = document.querySelector('script[src="/js/booking-modern.js"]');
      if (bScript) try { document.body.removeChild(bScript); } catch {}
    };
  }, []);

  return (
    <SiteLayout activePage="booking" headerVariant="light">
      <main className="booking-shell">
        <div className="container">
          <section className="booking-hero">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <h1>Đặt phòng theo đúng nhu cầu</h1>
                <p>Chọn bộ lọc theo khu vực, thời gian, giá tiền, voucher. Kết quả và bản đồ sẽ cập nhật ngay sau khi tìm.</p>
                <Link className="btn btn-sm booking-gallery-btn" to="/single-rooms">
                  <svg style={{ width: 15, height: 15, verticalAlign: 'middle', marginRight: 5 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  Xem Bộ Ảnh Phòng Thực Tế
                </Link>
              </div>
              <div className="hero-steps">
                <span>1. Bộ lọc</span>
                <span>2. Chọn phòng</span>
                <span>3. Xác nhận</span>
              </div>
            </div>
          </section>

          <div className="result-summary mt-3">
            <div className="mini-stat"><div className="mini-stat-label">Chi nhánh phù hợp</div><div className="mini-stat-value" id="resultCount">0</div></div>
            <div className="mini-stat"><div className="mini-stat-label">Tổng số phòng trống</div><div className="mini-stat-value" id="roomCount">0</div></div>
            <div className="mini-stat"><div className="mini-stat-label">Giá tạm tính thấp nhất</div><div className="mini-stat-value" id="bestPrice">-</div></div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-xl-5">
              <section className="filter-panel h-100">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <h4 className="panel-title mb-0">Bộ lọc tìm phòng</h4>
                  <button type="button" className="btn btn-sm btn-outline-secondary" id="resetSearchBtn">Đặt lại</button>
                </div>
                <form id="searchForm">
                  <div className="row g-2">
                    <div className="col-md-7 col-xl-12">
                      <label className="form-label" htmlFor="province">Tỉnh/Thành phố</label>
                      <input className="form-control" id="province" placeholder="VD: Ha Noi, Da Nang..." />
                    </div>
                    <div className="col-md-5 col-xl-12">
                      <label className="form-label" htmlFor="rentalMode">Kiểu thuê</label>
                      <select className="form-select" id="rentalMode" required>
                        <option value="DAILY">Theo ngày</option>
                        <option value="HOURLY">Theo giờ</option>
                      </select>
                    </div>
                  </div>
                  <div className="row g-2 mt-1">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="maxPrice">Giá tối đa (VND)</label>
                      <input className="form-control" id="maxPrice" type="number" min="0" step="1000" placeholder="1000000" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="voucherCode">Voucher (nếu có)</label>
                      <input className="form-control" id="voucherCode" placeholder="WELCOME10" />
                    </div>
                  </div>
                  <div className="row g-2 mt-1">
                    <div className="col-5">
                      <label className="form-label" htmlFor="userLatitude">Vĩ độ</label>
                      <input className="form-control" id="userLatitude" type="number" step="0.000001" placeholder="10.776889" />
                    </div>
                    <div className="col-5">
                      <label className="form-label" htmlFor="userLongitude">Kinh độ</label>
                      <input className="form-control" id="userLongitude" type="number" step="0.000001" placeholder="106.700806" />
                    </div>
                    <div className="col-2 d-flex align-items-end">
                      <button type="button" className="btn btn-outline-secondary w-100" id="useLocationBtn" title="Lấy vị trí">GPS</button>
                    </div>
                  </div>
                  <div className="row g-2 mt-1" id="dailyFields">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="startDate">Nhận phòng</label>
                      <input className="form-control" id="startDate" type="date" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="endDate">Trả phòng</label>
                      <input className="form-control" id="endDate" type="date" />
                    </div>
                  </div>
                  <div className="row g-2 mt-1" id="hourlyFields" style={{ display: 'none' }}>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="startDateTime">Bắt đầu thuê</label>
                      <input className="form-control" id="startDateTime" type="datetime-local" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="endDateTime">Kết thúc thuê</label>
                      <input className="form-control" id="endDateTime" type="datetime-local" />
                    </div>
                  </div>
                  <div className="d-grid gap-2 mt-3">
                    <button type="submit" className="btn btn-brand btn-lg" id="searchBtn">Tìm phòng trống ngay</button>
                    {!user && (
                      <Link to="/login" className="btn btn-outline-dark">Đăng nhập để đặt phòng</Link>
                    )}
                  </div>
                  <div className="note-card mt-3">Thuê ngày: check-in 14:00, check-out 12:00. Ngày lễ/tết có phụ thu 80%.</div>
                  <div className="status-bar" id="statusBar">Sẵn sàng tìm phòng.</div>
                </form>
              </section>
            </div>

            <div className="col-xl-7">
              <section className="filter-panel h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h4 className="panel-title mb-0">Bản đồ chi nhánh</h4>
                  <small className="text-muted">Marker cập nhật theo kết quả tìm kiếm</small>
                </div>
                <div id="branchMap" style={{ flex: 1 }}></div>
              </section>
            </div>
          </div>

          <div id="bookingAlert"></div>

          <section className="results-wrap mt-4 pt-2">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <h4 className="panel-title mb-0">Danh sách phòng trống</h4>
              <span className="text-muted small">Chọn phòng và bấm Đặt phòng để gửi yêu cầu</span>
            </div>
            <section id="branchResults">
              <div className="note-card">Nhập bộ lọc và bấm Tìm phòng trống ngay để hiển kết quả.</div>
            </section>
          </section>
        </div>
      </main>

      {/* Booking Modal */}
      <div className="modal fade" id="bookingModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xác nhận đặt phòng</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <input type="hidden" id="selectedRoomId" />
              <div className="mb-2 text-muted" id="selectedRoomLabel"></div>
              <label className="form-label" htmlFor="customerFullName">Họ tên người đặt</label>
              <input className="form-control" id="customerFullName" placeholder="Nhập họ và tên" />
              <label className="form-label mt-2" htmlFor="paymentOption">Hình thức thanh toán</label>
              <select className="form-select" id="paymentOption">
                <option value="FULL_100">Thanh toán 100% giá trị đơn</option>
                <option value="DEPOSIT_30">Đặt cọc 30% để giữ phòng</option>
              </select>
              <small className="text-muted d-block mt-1">Đơn chỉ có hiệu lực sau khi chuyển sang VNPAY và thanh toán thành công.</small>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Đóng</button>
              <button type="button" className="btn btn-brand" id="confirmBookingBtn">Xác nhận đặt phòng</button>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
