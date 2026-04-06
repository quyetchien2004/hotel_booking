import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const emptyForm = {
  id: '',
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: '',
  role: 'member',
  isActive: true,
};

function fmtDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
}

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  function load() {
    setLoading(true);
    api
      .get('/users')
      .then((r) => setUsers(r.data || []))
      .catch((e) => setError(e.response?.data?.message || 'Không thể tải danh sách user.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function startEdit(item) {
    setForm({
      id: item.id,
      username: item.username || '',
      password: '',
      fullName: item.fullName || item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      role: item.role || 'member',
      isActive: item.isActive !== false,
    });
    setFormMsg({ type: '', text: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    try {
      if (form.id) {
        await api.patch(`/users/${form.id}`, form);
        setFormMsg({ type: 'success', text: 'Cập nhật user thành công.' });
      } else {
        await api.post('/users', form);
        setFormMsg({ type: 'success', text: 'Thêm user thành công.' });
      }

      setForm(emptyForm);
      load();
    } catch (err) {
      setFormMsg({ type: 'danger', text: err.response?.data?.message || 'Lưu user thất bại.' });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Xóa user này?')) return;

    try {
      await api.post(`/users/${id}/delete`);
      setFormMsg({ type: 'success', text: 'Đã xóa user.' });
      if (String(form.id) === String(id)) {
        setForm(emptyForm);
      }
      load();
    } catch (err) {
      setFormMsg({ type: 'danger', text: err.response?.data?.message || 'Xóa user thất bại.' });
    }
  }

  const activeUsers = users.filter((item) => item.isActive !== false).length;
  const admins = users.filter((item) => String(item.role).toLowerCase() === 'admin').length;

  return (
    <SiteLayout activePage="users" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Quản lý người dùng</h2>
          <p className="text-muted mb-0">Thêm, sửa, khóa kích hoạt, đổi role và xóa tài khoản người dùng.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {formMsg.text && <div className={`alert alert-${formMsg.type}`}>{formMsg.text}</div>}

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="mini-stat">
              <div className="mini-stat-label">Tổng số user</div>
              <div className="mini-stat-value">{users.length}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="mini-stat">
              <div className="mini-stat-label">User đang hoạt động</div>
              <div className="mini-stat-value">{activeUsers}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="mini-stat">
              <div className="mini-stat-label">Số admin</div>
              <div className="mini-stat-value">{admins}</div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">{form.id ? 'Cập nhật user' : 'Thêm người dùng mới'}</div>
              <div className="card-body">
                <form onSubmit={handleSubmit} className="d-grid gap-2">
                  <input className="form-control" type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
                  <input className="form-control" type="password" name="password" placeholder={form.id ? 'Mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Password'} value={form.password} onChange={handleChange} />
                  <input className="form-control" type="text" name="fullName" placeholder="Họ và tên" value={form.fullName} onChange={handleChange} required />
                  <input className="form-control" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                  <input className="form-control" type="text" name="phone" placeholder="Số điện thoại" value={form.phone} onChange={handleChange} />
                  <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                  <label className="form-check">
                    <input className="form-check-input" type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                    <span className="form-check-label">Tài khoản đang hoạt động</span>
                  </label>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-brand flex-grow-1">{form.id ? 'Lưu thay đổi' : 'Thêm user'}</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(emptyForm)}>Mới</button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card">
              <div className="card-header fw-bold">Danh sách user</div>
              <div className="card-body table-responsive">
                {loading && <div className="text-center py-3"><div className="spinner-border text-primary" /></div>}
                {!loading && (
                  <table className="table table-sm table-striped align-middle mb-0 booking-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Thông tin</th>
                        <th>Role</th>
                        <th>Trust</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 && (
                        <tr><td colSpan={6}><div className="alert alert-info mb-0">Chưa có user nào.</div></td></tr>
                      )}
                      {users.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="fw-semibold">{item.username || '-'}</div>
                            <small className="text-muted">Tạo ngày {fmtDate(item.createdAt)}</small>
                          </td>
                          <td>
                            <div>{item.fullName || item.name}</div>
                            <small className="text-muted">{item.email}</small>
                            <div><small className="text-muted">{item.phone || '-'}</small></div>
                          </td>
                          <td>
                            <span className={`badge rounded-pill ${String(item.role).toLowerCase() === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                              {item.role}
                            </span>
                          </td>
                          <td>
                            <div>{item.trustScore}%</div>
                            <small className={`text-${item.isCccdVerified ? 'success' : 'muted'}`}>
                              {item.isCccdVerified ? 'Đã verify CCCD' : 'Chưa verify CCCD'}
                            </small>
                          </td>
                          <td>
                            <span className={`badge rounded-pill ${item.isActive ? 'bg-success' : 'bg-danger'}`}>
                              {item.isActive ? 'ACTIVE' : 'LOCKED'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => startEdit(item)}>Sửa</button>
                              <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handleDelete(item.id)}>Xóa</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
