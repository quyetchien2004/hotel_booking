import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', phone: '' });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  function load() {
    setLoading(true);
    api.get('/users')
      .then(r => setUsers(r.data || []))
      .catch(e => setError(e.response?.data?.message || 'Không thể tải danh sách user.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    try {
      await api.post('/users', form);
      setFormMsg({ type: 'success', text: 'Thêm user thành công.' });
      setForm({ username: '', password: '', fullName: '', email: '', phone: '' });
      load();
    } catch (err) {
      setFormMsg({ type: 'danger', text: err.response?.data?.message || 'Thêm user thất bại.' });
    }
  }

  return (
    <SiteLayout activePage="users" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Quản lý người dùng</h2>
          <p className="text-muted mb-0">Tạo nhanh tài khoản mới và xem danh sách user hiện có.</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">Thêm người dùng mới</div>
              <div className="card-body">
                <form onSubmit={handleAddUser} className="d-grid gap-2">
                  <input className="form-control" type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
                  <input className="form-control" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
                  <input className="form-control" type="text" name="fullName" placeholder="Họ và tên" value={form.fullName} onChange={handleChange} required />
                  <input className="form-control" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                  <input className="form-control" type="text" name="phone" placeholder="Số điện thoại" value={form.phone} onChange={handleChange} required />
                  <button type="submit" className="btn btn-brand">Thêm user</button>
                </form>
                {formMsg.text && <div className={`alert alert-${formMsg.type} mt-2 mb-0`}>{formMsg.text}</div>}
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
                      <tr><th>ID</th><th>Username</th><th>Họ tên</th><th>Email</th><th>Phone</th><th>Role</th></tr>
                    </thead>
                    <tbody>
                      {users.length === 0 && (
                        <tr><td colSpan={6}><div className="alert alert-info mb-0">Chưa có user nào. Hãy thêm user mới ở cột bên trái.</div></td></tr>
                      )}
                      {users.map(u => (
                        <tr key={u.id || u._id}>
                          <td>{u.id || u._id}</td>
                          <td>{u.username}</td>
                          <td>{u.fullName || u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.phone}</td>
                          <td><span className="badge rounded-pill bg-secondary">{u.role}</span></td>
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
