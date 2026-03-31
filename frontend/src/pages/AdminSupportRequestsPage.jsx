import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const STATUS_OPTIONS = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

function fmtDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminSupportRequestsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  function load() {
    setLoading(true);
    api
      .get('/admin/support-requests')
      .then((response) => setItems(response.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải danh sách yêu cầu hỗ trợ.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(id, status) {
    try {
      setUpdatingId(String(id));
      await api.patch(`/admin/support-requests/${id}/status`, { status });
      setMessage('Cập nhật trạng thái hỗ trợ thành công.');
      setError('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái hỗ trợ.');
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <SiteLayout activePage="admin" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Quản trị yêu cầu hỗ trợ</h2>
          <p className="text-muted mb-0">Admin xem danh sách và đổi trạng thái xử lý: NEW / IN_PROGRESS / RESOLVED.</p>
        </div>

        {message && (
          <div className="alert alert-success alert-dismissible">
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage('')} />
          </div>
        )}
        {error && (
          <div className="alert alert-danger alert-dismissible">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        )}

        {!loading && (
          <div className="card">
            <div className="card-body table-responsive">
              <table className="table table-sm table-striped align-middle">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Liên hệ</th>
                    <th>Chủ đề</th>
                    <th>Nội dung</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-muted">
                        Chưa có yêu cầu hỗ trợ nào.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.topic}</td>
                      <td style={{ minWidth: 260 }}>{item.message}</td>
                      <td>{fmtDate(item.createdAt)}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={item.status}
                          disabled={updatingId === String(item.id)}
                          onChange={(event) => handleStatusChange(item.id, event.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
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
