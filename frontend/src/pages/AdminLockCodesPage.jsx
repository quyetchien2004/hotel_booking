import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

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

const LOCK_STATUS_OPTIONS = ['', 'ACTIVE', 'LOCKED', 'DISABLED', 'EXPIRED', 'PENDING'];

export default function AdminLockCodesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState('');

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  function load() {
    setLoading(true);
    api
      .get('/admin/lock-codes', { params: status ? { status } : {} })
      .then((response) => setItems(response.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải danh sách mã mở khóa.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status]);

  async function handleLock(item) {
    try {
      setBusyId(String(item.bookingId));
      await api.post(`/admin/lock-codes/${item.bookingId}/lock`, {
        reason: 'Admin khóa mã mở khóa chủ động',
      });
      setMessage('Đã khóa mã mở khóa thành công.');
      setError('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể khóa mã mở khóa.');
    } finally {
      setBusyId('');
    }
  }

  const activeCount = items.filter((item) => item.electronicLockStatus === 'ACTIVE').length;

  return (
    <SiteLayout activePage="lock-codes" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Quản trị mã mở khóa phòng</h2>
          <p className="text-muted mb-0">Theo dõi mã mở khóa điện tử theo từng booking, thời gian hiệu lực và khóa ngay các mã đang active khi cần.</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="mini-stat">
              <div className="mini-stat-label">Tổng mã mở khóa</div>
              <div className="mini-stat-value">{items.length}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="mini-stat">
              <div className="mini-stat-label">Đang active</div>
              <div className="mini-stat-value">{activeCount}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <label className="form-label small fw-semibold">Lọc theo trạng thái</label>
                <select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                  {LOCK_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item || 'Tất cả'}</option>)}
                </select>
              </div>
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
                    <th>Booking</th>
                    <th>Khách hàng</th>
                    <th>Phòng</th>
                    <th>Mã mở khóa</th>
                    <th>Hiệu lực</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={7} className="text-muted">Chưa có mã mở khóa nào phù hợp bộ lọc.</td></tr>
                  )}
                  {items.map((item) => {
                    const isBusy = busyId === String(item.bookingId);
                    return (
                      <tr key={item.bookingId}>
                        <td>
                          <div className="fw-semibold">#{item.bookingId}</div>
                          <small className="text-muted">{fmtDate(item.createdAt)}</small>
                        </td>
                        <td>
                          <div>{item.customerFullName}</div>
                          <small className="text-muted">{item.email || item.username || '-'}</small>
                        </td>
                        <td>
                          <div>{item.branchName}</div>
                          <small className="text-muted">Phòng {item.roomNumber}</small>
                        </td>
                        <td>
                          <div className="fw-bold">{item.electronicLockCode || '-'}</div>
                          <small className="text-muted">Gửi mail: {fmtDate(item.electronicLockDeliveredAt)}</small>
                        </td>
                        <td>
                          <div>{fmtDate(item.electronicLockValidFrom)}</div>
                          <small className="text-muted">{fmtDate(item.electronicLockValidUntil)}</small>
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${item.electronicLockStatus === 'ACTIVE' ? 'bg-success' : item.electronicLockStatus === 'LOCKED' ? 'bg-danger' : 'bg-secondary'}`}>
                            {item.electronicLockStatus}
                          </span>
                          <div className="small text-muted mt-1">{item.electronicLockDisabledReason || item.workflowStatus}</div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={item.electronicLockStatus !== 'ACTIVE' || isBusy}
                            onClick={() => handleLock(item)}
                          >
                            {isBusy ? 'Đang khóa...' : 'Khóa mã'}
                          </button>
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