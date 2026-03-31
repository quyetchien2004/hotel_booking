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
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get('/admin/bookings/pending')
      .then(r => setBookings(r.data || []))
      .catch(e => setError(e.response?.data?.message || 'Không thể tải danh sách.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id, action) {
    try {
      await api.post(`/admin/bookings/${id}/${action}`);
      setMessage(action === 'approve' ? 'Đã duyệt đơn thành công.' : 'Đã từ chối đơn.');
      load();
    } catch (e) {
      setError(e.response?.data?.message || `Thao tác ${action} thất bại.`);
    }
  }

  return (
    <SiteLayout activePage="admin" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Duyệt đặt cọc 30%</h2>
          <p className="text-muted mb-0">Danh sách đơn đã thanh toán cọc và đang chờ admin xác nhận.</p>
        </div>

        {message && <div className="alert alert-success alert-dismissible">{message}<button type="button" className="btn-close" onClick={() => setMessage('')} /></div>}
        {error && <div className="alert alert-danger alert-dismissible">{error}<button type="button" className="btn-close" onClick={() => setError('')} /></div>}

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
                    <th>Tổng tiền</th>
                    <th>Đã cọc</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 && (
                    <tr><td colSpan={8} className="text-muted">Hiện không có đơn đặt cọc nào cần duyệt.</td></tr>
                  )}
                  {bookings.map(b => (
                    <tr key={b.id || b.bookingId}>
                      <td>{b.id || b.bookingId}</td>
                      <td>
                        <div className="fw-semibold">{b.customerFullName}</div>
                        <small className="text-muted">{b.username || b.user?.username || 'Khách vãng lai'}</small>
                      </td>
                      <td>
                        <div>{b.branchName || b.room?.branch?.name || '-'}</div>
                        <small className="text-muted">Phòng {b.roomNumber || b.room?.roomNumber || '-'}</small>
                      </td>
                      <td>
                        <div>{fmtDate(b.checkInAt)}</div>
                        <small className="text-muted">{fmtDate(b.checkOutAt)}</small>
                      </td>
                      <td>{fmt(b.totalPrice)}</td>
                      <td>{fmt(b.paidAmount)}</td>
                      <td>
                        <span className="badge rounded-pill bg-warning text-dark">
                          {b.workflowStatus || 'Chờ duyệt'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          <button className="btn btn-sm btn-success" onClick={() => handleAction(b.id || b.bookingId, 'approve')}>
                            <i className="fa-solid fa-check" /> Duyệt
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleAction(b.id || b.bookingId, 'reject')}>
                            <i className="fa-solid fa-xmark" /> Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
