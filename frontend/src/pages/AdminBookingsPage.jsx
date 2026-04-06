import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
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

const WORKFLOW_OPTIONS = ['', 'PENDING_DEPOSIT_APPROVAL', 'APPROVED', 'CANCELLED', 'REJECTED'];
const STAY_OPTIONS = ['', 'RESERVED', 'CHECKED_IN', 'CHECKED_OUT'];

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ workflowStatus: '', stayStatus: '' });
  const [pendingActionId, setPendingActionId] = useState('');

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  function load() {
    setLoading(true);
    api
      .get('/admin/bookings', { params: filters })
      .then((r) => setBookings(r.data || []))
      .catch((e) => setError(e.response?.data?.message || 'Không thể tải danh sách booking.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [filters.workflowStatus, filters.stayStatus]);

  async function handleAction(id, action) {
    try {
      setPendingActionId(String(id));
      await api.post(`/admin/bookings/${id}/${action}`);
      setMessage(
        action === 'approve'
          ? 'Đã duyệt booking.'
          : action === 'reject'
            ? 'Đã từ chối booking.'
            : action === 'check-in'
              ? 'Đã check-in booking.'
              : action === 'check-out'
                ? 'Đã check-out booking.'
                : 'Đã hủy booking.',
      );
      setError('');
      load();
    } catch (e) {
      setError(e.response?.data?.message || `Thao tác ${action} thất bại.`);
    } finally {
      setPendingActionId('');
    }
  }

  const pendingApprovals = bookings.filter((item) => item.workflowStatus === 'PENDING_DEPOSIT_APPROVAL').length;
  const checkedIn = bookings.filter((item) => item.stayStatus === 'CHECKED_IN').length;

  return (
    <SiteLayout activePage="admin" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Booking Operations</h2>
          <p className="text-muted mb-0">Duyệt cọc, hủy booking, check-in/check-out và giám sát vòng đời đơn đặt phòng.</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="mini-stat">
              <div className="mini-stat-label">Tổng booking</div>
              <div className="mini-stat-value">{bookings.length}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="mini-stat">
              <div className="mini-stat-label">Chờ duyệt cọc</div>
              <div className="mini-stat-value">{pendingApprovals}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="mini-stat">
              <div className="mini-stat-label">Đang check-in</div>
              <div className="mini-stat-value">{checkedIn}</div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Trạng thái workflow</label>
              <select
                className="form-select"
                value={filters.workflowStatus}
                onChange={(event) => setFilters((prev) => ({ ...prev, workflowStatus: event.target.value }))}
              >
                {WORKFLOW_OPTIONS.map((item) => <option key={item} value={item}>{item || 'Tất cả'}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Trạng thái lưu trú</label>
              <select
                className="form-select"
                value={filters.stayStatus}
                onChange={(event) => setFilters((prev) => ({ ...prev, stayStatus: event.target.value }))}
              >
                {STAY_OPTIONS.map((item) => <option key={item} value={item}>{item || 'Tất cả'}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setFilters({ workflowStatus: '', stayStatus: '' })}>
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}

        {!loading && (
          <div className="card">
            <div className="card-body table-responsive">
              <table className="table table-sm table-striped align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Chi nhánh / Phòng</th>
                    <th>Thời gian</th>
                    <th>Tài chính</th>
                    <th>Vận hành</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 && (
                    <tr><td colSpan={7} className="text-muted">Không có booking nào phù hợp bộ lọc.</td></tr>
                  )}
                  {bookings.map((b) => {
                    const isBusy = pendingActionId === String(b.id || b.bookingId);
                    return (
                      <tr key={b.id || b.bookingId}>
                        <td>{b.id || b.bookingId}</td>
                        <td>
                          <div className="fw-semibold">{b.customerFullName}</div>
                          <small className="text-muted">{b.username || 'Khách vãng lai'}</small>
                        </td>
                        <td>
                          <div>{b.branchName || '-'}</div>
                          <small className="text-muted">Phòng {b.roomNumber || '-'} • {b.roomStatus || '-'}</small>
                        </td>
                        <td>
                          <div>{fmtDate(b.checkInAt)}</div>
                          <small className="text-muted">{fmtDate(b.checkOutAt)}</small>
                          <div className="small text-muted mt-1">In/Out thực tế: {fmtDate(b.checkedInAtActual)} / {fmtDate(b.checkedOutAtActual)}</div>
                        </td>
                        <td>
                          <div>{fmt(b.totalPrice)}</div>
                          <small className="text-muted">Cần TT: {fmt(b.requiredPaymentAmount)}</small>
                          <div><small className="text-muted">Đã TT: {fmt(b.paidAmount)}</small></div>
                          <div><small className="text-muted">{b.paymentStatus}</small></div>
                          <div><small className="text-muted">Mã khóa: {b.electronicLockCode || '-'}</small></div>
                        </td>
                        <td>
                          <div><span className="badge rounded-pill bg-warning text-dark">{b.workflowStatus}</span></div>
                          <div className="mt-1"><span className="badge rounded-pill bg-info text-dark">{b.stayStatus}</span></div>
                          <div className="small text-muted mt-1">Lock: {b.electronicLockStatus || 'UNAVAILABLE'}</div>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {b.workflowStatus === 'PENDING_DEPOSIT_APPROVAL' && (
                              <>
                                <button className="btn btn-sm btn-success" disabled={isBusy} onClick={() => handleAction(b.id || b.bookingId, 'approve')}>Duyệt</button>
                                <button className="btn btn-sm btn-danger" disabled={isBusy} onClick={() => handleAction(b.id || b.bookingId, 'reject')}>Từ chối</button>
                              </>
                            )}
                            {b.workflowStatus === 'APPROVED' && b.stayStatus === 'RESERVED' && (
                              <button className="btn btn-sm btn-primary" disabled={isBusy} onClick={() => handleAction(b.id || b.bookingId, 'check-in')}>Check-in</button>
                            )}
                            {b.stayStatus === 'CHECKED_IN' && (
                              <button className="btn btn-sm btn-outline-primary" disabled={isBusy} onClick={() => handleAction(b.id || b.bookingId, 'check-out')}>Check-out</button>
                            )}
                            {['APPROVED', 'PENDING_DEPOSIT_APPROVAL', 'PENDING_PAYMENT'].includes(b.workflowStatus) && b.stayStatus === 'RESERVED' && (
                              <button className="btn btn-sm btn-outline-danger" disabled={isBusy} onClick={() => handleAction(b.id || b.bookingId, 'cancel')}>Hủy</button>
                            )}
                          </div>
                        </td>
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
