import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FAMILY', 'SUITE', 'DELUXE'];
const ROOM_STATUSES = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE'];
const VOUCHER_AUDIENCES = ['ALL', 'NEW_USER', 'LOYAL', 'FREQUENT'];

function fmt(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('vi-VN') + ' VND';
}

const emptyBranch = { id: '', name: '', province: '', address: '', latitude: '', longitude: '', totalFloors: '', roomsPerFloor: '' };
const emptyRoom = {
  id: '',
  branchId: '',
  floorNumber: '',
  roomNumber: '',
  roomType: 'SINGLE',
  capacity: '',
  hourlyRate: '',
  dailyRate: '',
  area: '',
  description: '',
  amenities: '',
  imageUrls: '',
  hasNiceView: false,
  status: 'AVAILABLE',
};
const emptyVoucher = { id: '', code: '', name: '', audience: 'ALL', discountPercent: '', active: true, validFrom: '', validTo: '' };

export default function AdminManagePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(searchParams.get('branchId') || '');
  const [branchForm, setBranchForm] = useState(emptyBranch);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [voucherForm, setVoucherForm] = useState(emptyVoucher);
  const [msg, setMsg] = useState({ type: '', text: '' });

  function showMsg(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  }

  function loadBranches() {
    api.get('/admin/branches').then((r) => setBranches(r.data || [])).catch(() => {});
  }

  function loadRooms(branchId) {
    if (!branchId) {
      setRooms([]);
      return;
    }
    api.get('/admin/rooms', { params: { branchId } }).then((r) => setRooms(r.data || [])).catch(() => {});
  }

  function loadVouchers() {
    api.get('/admin/vouchers').then((r) => setVouchers(r.data || [])).catch(() => {});
  }

  function loadDashboard() {
    api.get('/admin/dashboard').then((r) => setDashboard(r.data)).catch(() => {});
    api.get('/admin/reports/overview').then((r) => setReport(r.data)).catch(() => {});
  }

  useEffect(() => {
    loadBranches();
    loadVouchers();
    loadDashboard();
  }, []);

  useEffect(() => {
    loadRooms(selectedBranchId);
  }, [selectedBranchId]);

  async function saveBranch(e) {
    e.preventDefault();
    try {
      await api.post('/admin/branches/save', branchForm);
      showMsg('success', 'Chi nhanh da duoc luu.');
      setBranchForm(emptyBranch);
      loadBranches();
      loadDashboard();
    } catch (err) {
      showMsg('danger', err.response?.data?.message || 'Luu that bai.');
    }
  }

  async function deleteBranch(id) {
    if (!window.confirm('Xoa chi nhanh nay?')) return;
    try {
      await api.post(`/admin/branches/${id}/delete`);
      loadBranches();
      if (String(selectedBranchId) === String(id)) setSelectedBranchId('');
      loadDashboard();
    } catch {
      showMsg('danger', 'Xoa that bai.');
    }
  }

  async function saveRoom(e) {
    e.preventDefault();
    try {
      await api.post('/admin/rooms/save', { ...roomForm, branchId: roomForm.branchId || selectedBranchId });
      showMsg('success', 'Phong da duoc luu.');
      setRoomForm(emptyRoom);
      loadRooms(selectedBranchId);
      loadDashboard();
    } catch (err) {
      showMsg('danger', err.response?.data?.message || 'Luu that bai.');
    }
  }

  async function deleteRoom(id) {
    if (!window.confirm('Xoa phong nay?')) return;
    try {
      await api.post(`/admin/rooms/${id}/delete`);
      loadRooms(selectedBranchId);
      loadDashboard();
    } catch {
      showMsg('danger', 'Xoa that bai.');
    }
  }

  async function saveVoucher(e) {
    e.preventDefault();
    try {
      await api.post('/admin/vouchers/save', voucherForm);
      showMsg('success', 'Voucher da duoc luu.');
      setVoucherForm(emptyVoucher);
      loadVouchers();
    } catch (err) {
      showMsg('danger', err.response?.data?.message || 'Luu that bai.');
    }
  }

  async function deleteVoucher(id) {
    if (!window.confirm('Xoa voucher nay?')) return;
    try {
      await api.post(`/admin/vouchers/${id}/delete`);
      loadVouchers();
    } catch {
      showMsg('danger', 'Xoa that bai.');
    }
  }

  return (
    <SiteLayout activePage="admin" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Admin Dashboard & Management</h2>
          <p className="text-muted mb-0">Theo doi KPI, doanh thu, trang thai phong va quan tri du lieu he thong khach san.</p>
        </div>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {dashboard && (
          <div className="row g-3 mb-4">
            <div className="col-md-3"><div className="mini-stat"><div className="mini-stat-label">Tong doanh thu</div><div className="mini-stat-value">{fmt(dashboard.stats.totalRevenue)}</div></div></div>
            <div className="col-md-3"><div className="mini-stat"><div className="mini-stat-label">Doanh thu thang nay</div><div className="mini-stat-value">{fmt(dashboard.stats.monthlyRevenue)}</div></div></div>
            <div className="col-md-3"><div className="mini-stat"><div className="mini-stat-label">Phong trong / occupied</div><div className="mini-stat-value">{dashboard.stats.availableRooms} / {dashboard.stats.occupiedRooms}</div></div></div>
            <div className="col-md-3"><div className="mini-stat"><div className="mini-stat-label">Booking / user active</div><div className="mini-stat-value">{dashboard.stats.totalBookings} / {dashboard.stats.activeUsers}</div></div></div>
          </div>
        )}

        {(dashboard || report) && (
          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header fw-bold">Top chi nhanh theo doanh thu</div>
                <div className="card-body table-responsive">
                  <table className="table table-sm table-striped mb-0">
                    <thead><tr><th>Chi nhanh</th><th>Bookings</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {(dashboard?.topBranches || []).map((item) => (
                        <tr key={item.branchId || item.branchName}>
                          <td>{item.branchName}</td>
                          <td>{item.bookings}</td>
                          <td>{fmt(item.revenue)}</td>
                        </tr>
                      ))}
                      {(dashboard?.topBranches || []).length === 0 && <tr><td colSpan={3} className="text-muted">Chua co du lieu.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header fw-bold">Bao cao 6 thang gan nhat</div>
                <div className="card-body table-responsive">
                  <table className="table table-sm table-striped mb-0">
                    <thead><tr><th>Thang</th><th>Bookings</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {(report?.monthlySeries || []).map((item) => (
                        <tr key={item.label}>
                          <td>{item.label}</td>
                          <td>{item.bookings}</td>
                          <td>{fmt(item.revenue)}</td>
                        </tr>
                      ))}
                      {(report?.monthlySeries || []).length === 0 && <tr><td colSpan={3} className="text-muted">Chua co du lieu.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">1. Them / cap nhat chi nhanh</div>
              <div className="card-body">
                <form onSubmit={saveBranch}>
                  {[
                    { id: 'name', name: 'name', placeholder: 'Ten chi nhanh', required: true },
                    { id: 'province', name: 'province', placeholder: 'Tinh/Thanh', required: true },
                    { id: 'address', name: 'address', placeholder: 'Dia chi', required: true },
                    { id: 'latitude', name: 'latitude', placeholder: 'Latitude', type: 'number', step: '0.000001', required: true },
                    { id: 'longitude', name: 'longitude', placeholder: 'Longitude', type: 'number', step: '0.000001', required: true },
                    { id: 'totalFloors', name: 'totalFloors', placeholder: 'So tang', type: 'number', min: '1', required: true },
                    { id: 'roomsPerFloor', name: 'roomsPerFloor', placeholder: 'Phong/tang', type: 'number', min: '1', required: true },
                  ].map((f) => (
                    <input
                      key={f.id}
                      className="form-control mb-2"
                      {...f}
                      value={branchForm[f.name] ?? ''}
                      onChange={(e) => setBranchForm((p) => ({ ...p, [f.name]: e.target.value }))}
                    />
                  ))}
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand w-100" type="submit">Luu chi nhanh</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setBranchForm(emptyBranch)}>Moi</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header fw-bold">Danh sach chi nhanh</div>
              <div className="card-body table-responsive">
                <table className="table table-sm table-striped">
                  <thead><tr><th>Ten</th><th>Tinh</th><th>Dia chi</th><th>Thao tac</th></tr></thead>
                  <tbody>
                    {branches.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <button
                            className="btn btn-link p-0"
                            onClick={() => {
                              setSelectedBranchId(String(item.id));
                              setRoomForm((prev) => ({ ...prev, branchId: String(item.id) }));
                            }}
                          >
                            {item.name}
                          </button>
                        </td>
                        <td>{item.province}</td>
                        <td>{item.address}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setBranchForm(item)}>Sua</button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteBranch(item.id)}>Xoa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {branches.length === 0 && <tr><td colSpan={4} className="text-muted">Chua co chi nhanh.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">2. Them / cap nhat phong</div>
              <div className="card-body">
                <form onSubmit={saveRoom}>
                  <input className="form-control mb-2" placeholder="Branch ID" value={roomForm.branchId || selectedBranchId} onChange={(e) => setRoomForm((p) => ({ ...p, branchId: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="So phong" value={roomForm.roomNumber} onChange={(e) => setRoomForm((p) => ({ ...p, roomNumber: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Tang" type="number" min="1" value={roomForm.floorNumber} onChange={(e) => setRoomForm((p) => ({ ...p, floorNumber: e.target.value }))} required />
                  <select className="form-select mb-2" value={roomForm.roomType} onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))}>{ROOM_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
                  <select className="form-select mb-2" value={roomForm.status} onChange={(e) => setRoomForm((p) => ({ ...p, status: e.target.value }))}>{ROOM_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
                  <input className="form-control mb-2" placeholder="Suc chua" type="number" min="1" value={roomForm.capacity} onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Dien tich" type="number" min="0" value={roomForm.area} onChange={(e) => setRoomForm((p) => ({ ...p, area: e.target.value }))} />
                  <input className="form-control mb-2" placeholder="Gia gio" type="number" min="0" step="1000" value={roomForm.hourlyRate} onChange={(e) => setRoomForm((p) => ({ ...p, hourlyRate: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Gia ngay" type="number" min="0" step="1000" value={roomForm.dailyRate} onChange={(e) => setRoomForm((p) => ({ ...p, dailyRate: e.target.value }))} required />
                  <textarea className="form-control mb-2" rows={2} placeholder="Mo ta phong" value={roomForm.description} onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))} />
                  <input className="form-control mb-2" placeholder="Amenities, ngan cach boi dau phay" value={roomForm.amenities} onChange={(e) => setRoomForm((p) => ({ ...p, amenities: e.target.value }))} />
                  <input className="form-control mb-2" placeholder="Image URLs, ngan cach boi dau phay" value={roomForm.imageUrls} onChange={(e) => setRoomForm((p) => ({ ...p, imageUrls: e.target.value }))} />
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="roomHasNiceView" checked={roomForm.hasNiceView} onChange={(e) => setRoomForm((p) => ({ ...p, hasNiceView: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="roomHasNiceView">Phong view dep</label>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand w-100" type="submit">Luu phong</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setRoomForm(emptyRoom)}>Moi</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header fw-bold">Danh sach phong{selectedBranchId ? ` - Chi nhanh #${selectedBranchId}` : ''}</div>
              <div className="card-body table-responsive">
                <table className="table table-sm table-striped">
                  <thead><tr><th>Phong</th><th>Loai</th><th>Status</th><th>Gia ngay</th><th>Thao tac</th></tr></thead>
                  <tbody>
                    {rooms.length === 0 && <tr><td colSpan={5} className="text-muted">Khong co phong nao.</td></tr>}
                    {rooms.map((item) => (
                      <tr key={item.id}>
                        <td>{item.roomNumber} (Tang {item.floorNumber})</td>
                        <td>{item.roomType}</td>
                        <td><span className="badge rounded-pill bg-secondary">{item.status}</span></td>
                        <td>{fmt(item.dailyRate)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              type="button"
                              onClick={() =>
                                setRoomForm({
                                  id: item.id,
                                  branchId: item.branchId || item.branch?.id || selectedBranchId,
                                  floorNumber: item.floorNumber,
                                  roomNumber: item.roomNumber,
                                  roomType: item.roomType,
                                  status: item.status || 'AVAILABLE',
                                  capacity: item.capacity,
                                  hourlyRate: item.hourlyRate,
                                  dailyRate: item.dailyRate,
                                  area: item.area || '',
                                  description: item.description || '',
                                  amenities: (item.amenities || []).join(', '),
                                  imageUrls: (item.imageUrls || []).join(', '),
                                  hasNiceView: item.hasNiceView,
                                })
                              }
                            >
                              Sua
                            </button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteRoom(item.id)}>Xoa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">3. Them / cap nhat voucher</div>
              <div className="card-body">
                <form onSubmit={saveVoucher}>
                  <input className="form-control mb-2" placeholder="Ma voucher" value={voucherForm.code} onChange={(e) => setVoucherForm((p) => ({ ...p, code: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Ten voucher" value={voucherForm.name} onChange={(e) => setVoucherForm((p) => ({ ...p, name: e.target.value }))} required />
                  <select className="form-select mb-2" value={voucherForm.audience} onChange={(e) => setVoucherForm((p) => ({ ...p, audience: e.target.value }))}>{VOUCHER_AUDIENCES.map((item) => <option key={item}>{item}</option>)}</select>
                  <input className="form-control mb-2" placeholder="% giam" type="number" min="0" max="100" step="0.01" value={voucherForm.discountPercent} onChange={(e) => setVoucherForm((p) => ({ ...p, discountPercent: e.target.value }))} required />
                  <label className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={voucherForm.active} onChange={(e) => setVoucherForm((p) => ({ ...p, active: e.target.checked }))} />
                    <span className="form-check-label">Voucher dang hoat dong</span>
                  </label>
                  <input className="form-control mb-2" type="datetime-local" value={voucherForm.validFrom} onChange={(e) => setVoucherForm((p) => ({ ...p, validFrom: e.target.value }))} />
                  <input className="form-control mb-2" type="datetime-local" value={voucherForm.validTo} onChange={(e) => setVoucherForm((p) => ({ ...p, validTo: e.target.value }))} />
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand w-100" type="submit">Luu voucher</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setVoucherForm(emptyVoucher)}>Moi</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header fw-bold">Danh sach voucher</div>
              <div className="card-body table-responsive">
                <table className="table table-sm table-striped">
                  <thead><tr><th>Code</th><th>Doi tuong</th><th>%</th><th>Trang thai</th><th>Thao tac</th></tr></thead>
                  <tbody>
                    {vouchers.length === 0 && <tr><td colSpan={5} className="text-muted">Chua co voucher nao.</td></tr>}
                    {vouchers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.code}</td>
                        <td>{item.audience}</td>
                        <td>{item.discountPercent}</td>
                        <td>{item.active ? 'ON' : 'OFF'}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setVoucherForm({ ...item, validFrom: item.validFrom || '', validTo: item.validTo || '' })}>Sua</button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteVoucher(item.id)}>Xoa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
