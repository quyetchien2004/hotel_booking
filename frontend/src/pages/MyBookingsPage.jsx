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
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAYMENT_STATUS_MAP = {
  SUCCESS: { cls: 'bg-success', label: 'SUCCESS' },
  CANCELLED: { cls: 'bg-danger', label: 'CANCELLED' },
};

const ELECTRONIC_LOCK_STATUS_MAP = {
  ACTIVE: { cls: 'success', label: 'Active' },
  LOCKED: { cls: 'danger', label: 'Đã bị khóa' },
  DISABLED: { cls: 'muted', label: 'Đã vô hiệu hóa' },
  EXPIRED: { cls: 'secondary', label: 'Hết hiệu lực' },
  PENDING: { cls: 'warning', label: 'Chờ phát hành' },
  UNAVAILABLE: { cls: 'muted', label: 'Chưa có mã' },
};

const STAY_STATUS_MAP = {
  RESERVED: 'Đã giữ chỗ',
  CHECKED_IN: 'Đã check-in',
  CHECKED_OUT: 'Đã check-out',
  NO_SHOW: 'No-show',
};

const initialReschedule = {
  bookingId: '',
  rentalMode: 'DAILY',
  startDate: '',
  endDate: '',
  startDateTime: '',
  endDateTime: '',
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingActionId, setPendingActionId] = useState('');
  const [rescheduleForm, setRescheduleForm] = useState(initialReschedule);
  const [selectedLockBooking, setSelectedLockBooking] = useState(null);

  if (!user) return <Navigate to="/login" replace />;

  function loadBookings() {
    setLoading(true);
    api
      .get('/bookings/my')
      .then((r) => setBookings(r.data || []))
      .catch((e) => setError(e.response?.data?.message || 'Không thể tải đơn đặt phòng.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const total = bookings.length;
  const withVoucher = bookings.filter((b) => b.appliedVoucherCode).length;
  const pending = bookings.filter((b) => b.paymentStatus === 'PENDING').length;
  const checkedInCount = bookings.filter((b) => b.stayStatus === 'CHECKED_IN').length;

  const invoiceMatch = bookings.find((item) => {
    const normalized = String(invoiceQuery || '').trim().toLowerCase();
    if (!normalized) return false;

    return (
      String(item.invoiceNumber || '').toLowerCase() === normalized ||
      String(item.bookingId || '').toLowerCase() === normalized.replace('#', '')
    );
  });

  function openReschedule(booking) {
    const checkIn = new Date(booking.checkInAt);
    const checkOut = new Date(booking.checkOutAt);
    setRescheduleForm({
      bookingId: booking.bookingId,
      rentalMode: booking.rentalMode,
      startDate: booking.rentalMode === 'DAILY' ? checkIn.toISOString().slice(0, 10) : '',
      endDate: booking.rentalMode === 'DAILY' ? checkOut.toISOString().slice(0, 10) : '',
      startDateTime: booking.rentalMode === 'HOURLY' ? new Date(checkIn.getTime() - checkIn.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      endDateTime: booking.rentalMode === 'HOURLY' ? new Date(checkOut.getTime() - checkOut.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
    });
    setMessage('');
    setError('');
  }

  async function handleCancel(bookingId) {
    const reason = window.prompt('Lý do hủy booking (có thể bỏ trống):', 'Khách hàng thay đổi kế hoạch');
    if (reason === null) return;

    try {
      setPendingActionId(String(bookingId));
      await api.post(`/bookings/${bookingId}/cancel`, { reason });
      setMessage('Đã hủy booking thành công.');
      loadBookings();
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể hủy booking.');
    } finally {
      setPendingActionId('');
    }
  }

  async function handleRescheduleSubmit(e) {
    e.preventDefault();
    if (!rescheduleForm.bookingId) return;

    const payload =
      rescheduleForm.rentalMode === 'DAILY'
        ? {
            rentalMode: 'DAILY',
            startDate: rescheduleForm.startDate,
            endDate: rescheduleForm.endDate,
          }
        : {
            rentalMode: 'HOURLY',
            startDateTime: rescheduleForm.startDateTime,
            endDateTime: rescheduleForm.endDateTime,
          };

    try {
      setPendingActionId(String(rescheduleForm.bookingId));
      await api.patch(`/bookings/${rescheduleForm.bookingId}/reschedule`, payload);
      setMessage('Đã đổi lịch booking thành công.');
      setRescheduleForm(initialReschedule);
      loadBookings();
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể đổi lịch booking.');
    } finally {
      setPendingActionId('');
    }
  }

  async function copyElectronicLockCode(code) {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setMessage('Đã sao chép mã mở khóa điện tử.');
      setError('');
    } catch {
      setError('Không thể sao chép mã mở khóa. Hãy sao chép thủ công.');
    }
  }

  return (
    <SiteLayout activePage="my-bookings" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Đơn đặt phòng của tôi</h2>
          <p className="text-muted mb-0">Theo dõi đơn đặt, đổi lịch, hủy lịch và tra cứu hóa đơn trên cùng một màn hình.</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}

        {!loading && !error && bookings.length > 0 && (
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <div className="mini-stat">
                <div className="mini-stat-label">Tổng số đơn</div>
                <div className="mini-stat-value">{total}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mini-stat">
                <div className="mini-stat-label">Đơn đã dùng voucher</div>
                <div className="mini-stat-value">{withVoucher}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mini-stat">
                <div className="mini-stat-label">Chờ xác nhận</div>
                <div className="mini-stat-value">{pending}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mini-stat">
                <div className="mini-stat-label">Đang lưu trú</div>
                <div className="mini-stat-value">{checkedInCount}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="card card-body">
                <div className="row g-3">
                  <div className="col-lg-6">
                    <label className="form-label small fw-semibold">Kiểm tra hóa đơn đặt phòng</label>
                    <input
                      className="form-control"
                      placeholder="Nhập số hóa đơn hoặc mã đơn"
                      value={invoiceQuery}
                      onChange={(event) => setInvoiceQuery(event.target.value)}
                    />
                    <div className="mt-2 small">
                      {!invoiceQuery.trim() && <span className="text-muted">Nhập mã để tra cứu nhanh trạng thái thanh toán.</span>}
                      {invoiceQuery.trim() && !invoiceMatch && <span className="text-danger">Không tìm thấy hóa đơn hoặc mã đơn tương ứng.</span>}
                      {invoiceMatch && (
                        <span>
                          <span className="fw-semibold">Tìm thấy:</span> Đơn #{invoiceMatch.bookingId} • Hóa đơn {invoiceMatch.invoiceNumber || 'Chưa phát hành'} • Thanh toán {invoiceMatch.paymentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <label className="form-label small fw-semibold">Đổi lịch booking</label>
                    <form onSubmit={handleRescheduleSubmit} className="row g-2">
                      <div className="col-md-4">
                        <select
                          className="form-select"
                          value={rescheduleForm.bookingId}
                          onChange={(event) => {
                            const booking = bookings.find((item) => String(item.bookingId) === event.target.value);
                            if (booking) {
                              openReschedule(booking);
                            } else {
                              setRescheduleForm(initialReschedule);
                            }
                          }}
                        >
                          <option value="">Chọn booking</option>
                          {bookings.filter((item) => item.canReschedule).map((item) => (
                            <option key={item.bookingId} value={item.bookingId}>
                              #{item.bookingId} - {item.branchName}
                            </option>
                          ))}
                        </select>
                      </div>
                      {rescheduleForm.rentalMode === 'DAILY' ? (
                        <>
                          <div className="col-md-4">
                            <input
                              className="form-control"
                              type="date"
                              value={rescheduleForm.startDate}
                              onChange={(event) => setRescheduleForm((prev) => ({ ...prev, startDate: event.target.value }))}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              className="form-control"
                              type="date"
                              value={rescheduleForm.endDate}
                              onChange={(event) => setRescheduleForm((prev) => ({ ...prev, endDate: event.target.value }))}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-md-4">
                            <input
                              className="form-control"
                              type="datetime-local"
                              value={rescheduleForm.startDateTime}
                              onChange={(event) => setRescheduleForm((prev) => ({ ...prev, startDateTime: event.target.value }))}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              className="form-control"
                              type="datetime-local"
                              value={rescheduleForm.endDateTime}
                              onChange={(event) => setRescheduleForm((prev) => ({ ...prev, endDateTime: event.target.value }))}
                            />
                          </div>
                        </>
                      )}
                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-outline-primary btn-sm"
                          disabled={!rescheduleForm.bookingId || pendingActionId === String(rescheduleForm.bookingId)}
                        >
                          Cập nhật lịch đặt
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="alert alert-info">
            Bạn chưa có đơn đặt phòng nào. <Link to="/booking">Nhấn đây để đặt phòng mới.</Link>
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
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const paymentBadge = PAYMENT_STATUS_MAP[b.paymentStatus] || { cls: 'bg-warning text-dark', label: 'PENDING' };
                  const lockBadge = ELECTRONIC_LOCK_STATUS_MAP[b.electronicLockStatus] || ELECTRONIC_LOCK_STATUS_MAP.UNAVAILABLE;
                  const isBusy = pendingActionId === String(b.bookingId);

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
                        <div className="text-muted small mt-1">Lưu trú: {STAY_STATUS_MAP[b.stayStatus] || b.stayStatus}</div>
                      </td>
                      <td>
                        <div className="text-muted small">Giá gốc: {fmt(b.originalPrice)}</div>
                        <div className="text-muted small">Giảm: {fmt(b.discountAmount)}</div>
                        <div className="text-muted small">Voucher: {b.appliedVoucherCode || '-'}</div>
                        <div className="text-muted small">Đã thanh toán {fmt(b.paidAmount)}</div>
                        <div className="text-muted small">Hóa đơn: {b.invoiceNumber || 'Chưa phát hành'}</div>
                        <div className="text-muted small">
                          Mã mở khóa điện tử: {b.electronicLockCode || '-'}
                          {b.electronicLockCode ? (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 ms-2 align-baseline"
                              onClick={() => setSelectedLockBooking(b)}
                            >
                              Xem chi tiết
                            </button>
                          ) : null}
                        </div>
                        <div className={`small text-${lockBadge.cls}`}>Trạng thái mã: {lockBadge.label}</div>
                        <div className="fw-bold text-success mt-1">{fmt(b.totalPrice)}</div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${paymentBadge.cls}`}>{paymentBadge.label}</span>
                        <div><small className="text-muted">{b.workflowStatus}</small></div>
                        {b.cancelledAt && <div><small className="text-danger">Hủy lúc {fmtDate(b.cancelledAt)}</small></div>}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-2">
                          <Link className="btn btn-outline-primary btn-sm" to={`/invoice/${encodeURIComponent(b.invoiceNumber || b.bookingId)}`}>
                            Xem hóa đơn
                          </Link>
                          {b.electronicLockCode && (
                            <button
                              className="btn btn-outline-dark btn-sm"
                              type="button"
                              onClick={() => setSelectedLockBooking(b)}
                            >
                              Mã mở khóa
                            </button>
                          )}
                          {b.canReschedule && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              type="button"
                              onClick={() => openReschedule(b)}
                            >
                              Điền vào form đổi lịch
                            </button>
                          )}
                          {b.canCancel && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleCancel(b.bookingId)}
                            >
                              {isBusy ? 'Đang xử lý...' : 'Hủy booking'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedLockBooking && (
          <div className="lock-pass-modal" role="dialog" aria-modal="true">
            <div className="lock-pass-modal__backdrop" onClick={() => setSelectedLockBooking(null)} />
            <div className="lock-pass-modal__card">
              <div className="lock-pass-modal__header">
                <div>
                  <div className="lock-pass-modal__eyebrow">Electronic Room Access</div>
                  <h3>Mã mở khóa điện tử</h3>
                  <p>
                    Phòng {selectedLockBooking.roomNumber} tại {selectedLockBooking.branchName}. Chỉ sử dụng trong đúng khung giờ booking của bạn.
                  </p>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setSelectedLockBooking(null)} />
              </div>

              <div className="lock-pass-modal__code-panel">
                <span>Mã mở khóa</span>
                <strong>{selectedLockBooking.electronicLockCode || 'Chưa phát hành'}</strong>
                <button type="button" className="btn btn-light btn-sm" onClick={() => copyElectronicLockCode(selectedLockBooking.electronicLockCode)}>
                  Sao chép mã
                </button>
              </div>

              <div className="lock-pass-modal__grid">
                <div className="lock-pass-modal__info-box">
                  <span>Phòng hợp lệ</span>
                  <strong>{selectedLockBooking.roomNumber}</strong>
                  <small>{selectedLockBooking.branchName}</small>
                </div>
                <div className="lock-pass-modal__info-box">
                  <span>Trạng thái</span>
                  <strong>{(ELECTRONIC_LOCK_STATUS_MAP[selectedLockBooking.electronicLockStatus] || ELECTRONIC_LOCK_STATUS_MAP.UNAVAILABLE).label}</strong>
                  <small>{selectedLockBooking.electronicLockUsable ? 'Có thể sử dụng ngay trong giờ lưu trú' : 'Tạm thời chưa thể sử dụng'}</small>
                </div>
                <div className="lock-pass-modal__info-box">
                  <span>Bắt đầu hiệu lực</span>
                  <strong>{fmtDate(selectedLockBooking.electronicLockValidFrom)}</strong>
                  <small>Thời gian nhận phòng</small>
                </div>
                <div className="lock-pass-modal__info-box">
                  <span>Kết thúc hiệu lực</span>
                  <strong>{fmtDate(selectedLockBooking.electronicLockValidUntil)}</strong>
                  <small>Thời gian trả phòng</small>
                </div>
              </div>

              <div className="lock-pass-modal__instructions">
                <h4>Hướng dẫn nhập mã phòng</h4>
                <ol>
                  <li>Đến đúng phòng {selectedLockBooking.roomNumber} đã ghi trên booking.</li>
                  <li>Đánh thức bàn phím điện tử trước cửa phòng.</li>
                  <li>Nhập mã {selectedLockBooking.electronicLockCode} rồi nhấn phím xác nhận.</li>
                  <li>Chỉ dùng mã trong khoảng {fmtDate(selectedLockBooking.electronicLockValidFrom)} đến {fmtDate(selectedLockBooking.electronicLockValidUntil)}.</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
