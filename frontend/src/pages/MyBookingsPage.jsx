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

const STAY_STATUS_MAP = {
  RESERVED: 'Da giu cho',
  CHECKED_IN: 'Da check-in',
  CHECKED_OUT: 'Da check-out',
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

  if (!user) return <Navigate to="/login" replace />;

  function loadBookings() {
    setLoading(true);
    api
      .get('/bookings/my')
      .then((r) => setBookings(r.data || []))
      .catch((e) => setError(e.response?.data?.message || 'Khong the tai don dat phong.'))
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
    const reason = window.prompt('Ly do huy booking (co the bo trong):', 'Khach hang thay doi ke hoach');
    if (reason === null) return;

    try {
      setPendingActionId(String(bookingId));
      await api.post(`/bookings/${bookingId}/cancel`, { reason });
      setMessage('Da huy booking thanh cong.');
      loadBookings();
    } catch (e) {
      setError(e.response?.data?.message || 'Khong the huy booking.');
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
      setMessage('Da doi lich booking thanh cong.');
      setRescheduleForm(initialReschedule);
      loadBookings();
    } catch (e) {
      setError(e.response?.data?.message || 'Khong the doi lich booking.');
    } finally {
      setPendingActionId('');
    }
  }

  return (
    <SiteLayout activePage="my-bookings" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Don dat phong cua toi</h2>
          <p className="text-muted mb-0">Theo doi don dat, doi lich, huy lich va tra cuu hoa don tren cung mot man hinh.</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}

        {!loading && !error && bookings.length > 0 && (
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <div className="mini-stat">
                <div className="mini-stat-label">Tong so don</div>
                <div className="mini-stat-value">{total}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mini-stat">
                <div className="mini-stat-label">Don da dung voucher</div>
                <div className="mini-stat-value">{withVoucher}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mini-stat">
                <div className="mini-stat-label">Cho xac nhan</div>
                <div className="mini-stat-value">{pending}</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="mini-stat">
                <div className="mini-stat-label">Dang luu tru</div>
                <div className="mini-stat-value">{checkedInCount}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="card card-body">
                <div className="row g-3">
                  <div className="col-lg-6">
                    <label className="form-label small fw-semibold">Kiem tra hoa don dat phong</label>
                    <input
                      className="form-control"
                      placeholder="Nhap so hoa don hoac ma don"
                      value={invoiceQuery}
                      onChange={(event) => setInvoiceQuery(event.target.value)}
                    />
                    <div className="mt-2 small">
                      {!invoiceQuery.trim() && <span className="text-muted">Nhap ma de tra cuu nhanh trang thai thanh toan.</span>}
                      {invoiceQuery.trim() && !invoiceMatch && <span className="text-danger">Khong tim thay hoa don hoac ma don tuong ung.</span>}
                      {invoiceMatch && (
                        <span>
                          <span className="fw-semibold">Tim thay:</span> Don #{invoiceMatch.bookingId} • Hoa don {invoiceMatch.invoiceNumber || 'Chua phat hanh'} • Thanh toan {invoiceMatch.paymentStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <label className="form-label small fw-semibold">Doi lich booking</label>
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
                          <option value="">Chon booking</option>
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
                          Cap nhat lich dat
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
            Ban chua co don dat phong nao. <Link to="/booking">Nhan day de dat phong moi.</Link>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="table-responsive card card-body p-0">
            <table className="table table-hover align-middle mb-0 booking-table">
              <thead>
                <tr>
                  <th>Ma don</th>
                  <th>Thong tin phong</th>
                  <th>Thoi gian</th>
                  <th>Tai chinh</th>
                  <th>Trang thai</th>
                  <th>Hanh dong</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const paymentBadge = PAYMENT_STATUS_MAP[b.paymentStatus] || { cls: 'bg-warning text-dark', label: 'PENDING' };
                  const isBusy = pendingActionId === String(b.bookingId);

                  return (
                    <tr key={b.bookingId}>
                      <td>
                        <div className="fw-bold">#{b.bookingId}</div>
                        <small className="text-muted">{b.rentalMode === 'DAILY' ? 'Theo ngay' : 'Theo gio'}</small>
                      </td>
                      <td>
                        <div className="fw-semibold">{b.branchName}</div>
                        <small className="text-muted">Phong {b.roomNumber}</small>
                      </td>
                      <td>
                        <div>{fmtDate(b.checkInAt)}</div>
                        <small className="text-muted">{fmtDate(b.checkOutAt)}</small>
                        <div className="text-muted small mt-1">Luu tru: {STAY_STATUS_MAP[b.stayStatus] || b.stayStatus}</div>
                      </td>
                      <td>
                        <div className="text-muted small">Gia goc: {fmt(b.originalPrice)}</div>
                        <div className="text-muted small">Giam: {fmt(b.discountAmount)}</div>
                        <div className="text-muted small">Voucher: {b.appliedVoucherCode || '-'}</div>
                        <div className="text-muted small">Da thanh toan {fmt(b.paidAmount)}</div>
                        <div className="text-muted small">Hoa don: {b.invoiceNumber || 'Chua phat hanh'}</div>
                        <div className="fw-bold text-success mt-1">{fmt(b.totalPrice)}</div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${paymentBadge.cls}`}>{paymentBadge.label}</span>
                        <div><small className="text-muted">{b.workflowStatus}</small></div>
                        {b.cancelledAt && <div><small className="text-danger">Huy luc {fmtDate(b.cancelledAt)}</small></div>}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-2">
                          <Link className="btn btn-outline-primary btn-sm" to={`/invoice/${encodeURIComponent(b.invoiceNumber || b.bookingId)}`}>
                            Xem hoa don
                          </Link>
                          {b.canReschedule && (
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              type="button"
                              onClick={() => openReschedule(b)}
                            >
                              Dien vao form doi lich
                            </button>
                          )}
                          {b.canCancel && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleCancel(b.bookingId)}
                            >
                              {isBusy ? 'Dang xu ly...' : 'Huy booking'}
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
      </div>
    </SiteLayout>
  );
}
