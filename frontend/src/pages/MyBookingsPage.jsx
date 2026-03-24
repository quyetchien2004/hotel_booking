import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function fmt(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('vi-VN') + ' VND';
}
function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_MAP = {
  SUCCESS: { cls: 'bg-success', label: 'SUCCESS' },
  CANCELLED: { cls: 'bg-danger', label: 'CANCELLED' },
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    api.get('/bookings/my')
      .then(r => setBookings(r.data || []))
      .catch(e => setError(e.response?.data?.message || 'Không thể tải đơn đặt phòng.'))
      .finally(() => setLoading(false));
  }, []);

  const total = bookings.length;
  const withVoucher = bookings.filter(b => b.appliedVoucherCode).length;
  const pending = bookings.filter(b => b.paymentStatus === 'PENDING').length;

  return (
    <SiteLayout activePage="my-bookings" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Đơn đặt phòng của tôi</h2>
          <p className="text-muted mb-0">Theo dõi lịch sử đặt phòng, voucher đã áp dụng và tổng thanh toán mỗi đơn.</p>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && bookings.length > 0 && (
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <div className="mini-stat">
                <div className="mini-stat-label">Tổng số đơn đã đặt</div>
                <div className="mini-stat-value">{total}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mini-stat">
                <div className="mini-stat-label">Đơn đã dùng voucher</div>
                <div className="mini-stat-value">{withVoucher}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mini-stat">
                <div className="mini-stat-label">Đơn đang chờ xác nhận</div>
                <div className="mini-stat-value">{pending}</div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="alert alert-info">
            Bạn chưa có đơn đặt phòng nào.{' '}
            <Link to="/booking">Nhấn đây để đặt phòng mới.</Link>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="table-responsive card card-body p-0">
            <table className="table table-hover align-middle mb-0 booking-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Thông tin phòng</th>
                  <th>Thời gian</th>
                  <th>Tài chính</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const st = STATUS_MAP[b.paymentStatus] || { cls: 'bg-warning text-dark', label: 'PENDING' };
                  return (
                    <tr key={b.bookingId}>
                      <td>
                        <div className="fw-bold">#{b.bookingId}</div>
                        <small className="text-muted">{b.rentalMode === 'DAILY' ? 'Theo ngày' : 'Theo giờ'}</small>
                      </td>
                      <td>
                        <div className="fw-semibold">{b.branchName}</div>
                        <small className="text-muted">Phòng {b.roomNumber}</small>
                      </td>
                      <td>
                        <div>{fmtDate(b.checkInAt)}</div>
                        <small className="text-muted">{fmtDate(b.checkOutAt)}</small>
                      </td>
                      <td>
                        <div className="text-muted small">Giá gốc: {fmt(b.originalPrice)}</div>
                        <div className="text-muted small">Giảm: {fmt(b.discountAmount)}</div>
                        <div className="text-muted small">Voucher: {b.appliedVoucherCode || '-'}</div>
                        <div className="text-muted small">
                          Thanh toán: {b.paymentOption || '-'}, đã thanh toán {fmt(b.paidAmount)}
                        </div>
                        <div className="text-muted small">Hóa đơn: {b.invoiceNumber || 'Chưa phát hành'}</div>
                        <div className="fw-bold text-success">{fmt(b.totalPrice)}</div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${st.cls}`}>{st.label}</span>
                        <div><small className="text-muted">{b.workflowStatus}</small></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
