import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FAMILY', 'SUITE', 'DORM'];
const ROOM_STATUSES = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'UNAVAILABLE'];
const VOUCHER_AUDIENCES = ['ALL', 'NEW_USER', 'LOYAL', 'FREQUENT'];
const ROOMS_PER_PAGE = 10;

function fmt(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('vi-VN') + ' VND';
}

function roomTypeLabel(value) {
  switch (value) {
    case 'SINGLE': return 'Phòng đơn';
    case 'DOUBLE': return 'Phòng 2 người';
    case 'TRIPLE': return 'Phòng 3 người';
    case 'FAMILY': return 'Phòng gia đình';
    case 'SUITE': return 'Phòng 6 người';
    case 'DORM': return 'Phòng 10 người';
    default: return value;
  }
}

function roomStatusLabel(value) {
  switch (value) {
    case 'AVAILABLE': return 'Sẵn sàng';
    case 'OCCUPIED': return 'Đang có khách';
    case 'MAINTENANCE': return 'Bảo trì';
    case 'UNAVAILABLE': return 'Tạm khóa';
    default: return value;
  }
}

function voucherAudienceLabel(value) {
  switch (value) {
    case 'ALL': return 'Tất cả';
    case 'NEW_USER': return 'Khách mới';
    case 'LOYAL': return 'Khách thân thiết';
    case 'FREQUENT': return 'Khách tin cậy cao';
    default: return value;
  }
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
  const [roomPage, setRoomPage] = useState(1);

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
      setRoomPage(1);
      return;
    }
    api.get('/admin/rooms', { params: { branchId } }).then((r) => {
      setRooms(r.data || []);
      setRoomPage(1);
    }).catch(() => {});
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
      showMsg('success', 'Chi nhánh đã được lưu.');
      setBranchForm(emptyBranch);
      loadBranches();
      loadDashboard();
    } catch (err) {
      showMsg('danger', err.response?.data?.message || 'Lưu thất bại.');
    }
  }

  async function deleteBranch(id) {
    if (!window.confirm('Xóa chi nhánh này?')) return;
    try {
      await api.post(`/admin/branches/${id}/delete`);
      loadBranches();
      if (String(selectedBranchId) === String(id)) setSelectedBranchId('');
      loadDashboard();
    } catch {
      showMsg('danger', 'Xóa thất bại.');
    }
  }

  async function saveRoom(e) {
    e.preventDefault();
    try {
      await api.post('/admin/rooms/save', { ...roomForm, branchId: roomForm.branchId || selectedBranchId });
      showMsg('success', 'Phòng đã được lưu.');
      setRoomForm(emptyRoom);
      loadRooms(selectedBranchId);
      loadDashboard();
    } catch (err) {
      showMsg('danger', err.response?.data?.message || 'Lưu thất bại.');
    }
  }

  async function deleteRoom(id) {
    if (!window.confirm('Xóa phòng này?')) return;
    try {
      await api.post(`/admin/rooms/${id}/delete`);
      loadRooms(selectedBranchId);
      loadDashboard();
    } catch {
      showMsg('danger', 'Xóa thất bại.');
    }
  }

  async function saveVoucher(e) {
    e.preventDefault();
    try {
      await api.post('/admin/vouchers/save', voucherForm);
      showMsg('success', 'Voucher đã được lưu.');
      setVoucherForm(emptyVoucher);
      loadVouchers();
    } catch (err) {
      showMsg('danger', err.response?.data?.message || 'Lưu thất bại.');
    }
  }

  async function deleteVoucher(id) {
    if (!window.confirm('Xóa voucher này?')) return;
    try {
      await api.post(`/admin/vouchers/${id}/delete`);
      loadVouchers();
    } catch {
      showMsg('danger', 'Xóa thất bại.');
    }
  }

  const totalRoomPages = Math.max(1, Math.ceil(rooms.length / ROOMS_PER_PAGE));
  const pagedRooms = rooms.slice((roomPage - 1) * ROOMS_PER_PAGE, roomPage * ROOMS_PER_PAGE);

  return (
    <SiteLayout activePage="admin" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Bảng điều khiển quản trị</h2>
          <p className="text-muted mb-0">Theo dõi KPI, doanh thu, trạng thái phòng và quản trị dữ liệu hệ thống khách sạn.</p>
        </div>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {dashboard && (
          <div className="row g-3 mb-4">
            <div className="col-md-3"><div className="mini-stat"><div className="mini-stat-label">Tổng doanh thu</div><div className="mini-stat-value">{fmt(dashboard.stats.totalRevenue)}</div></div></div>
            <div className="col-md-3"><div className="mini-stat"><div className="mini-stat-label">Doanh thu tháng này</div><div className="mini-stat-value">{fmt(dashboard.stats.monthlyRevenue)}</div></div></div>
            <div className="col-md-3"><div className="mini-stat"><div className="mini-stat-label">Phòng trống / đang có khách</div><div className="mini-stat-value">{dashboard.stats.availableRooms} / {dashboard.stats.occupiedRooms}</div></div></div>
            <div className="col-md-3"><div className="mini-stat"><div className="mini-stat-label">Booking / người dùng hoạt động</div><div className="mini-stat-value">{dashboard.stats.totalBookings} / {dashboard.stats.activeUsers}</div></div></div>
          </div>
        )}

        {(dashboard || report) && (
          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header fw-bold">Top chi nhánh theo doanh thu</div>
                <div className="card-body table-responsive">
                  <table className="table table-sm table-striped mb-0">
                    <thead><tr><th>Chi nhánh</th><th>Booking</th><th>Doanh thu</th></tr></thead>
                    <tbody>
                      {(dashboard?.topBranches || []).map((item) => (
                        <tr key={item.branchId || item.branchName}>
                          <td>{item.branchName}</td>
                          <td>{item.bookings}</td>
                          <td>{fmt(item.revenue)}</td>
                        </tr>
                      ))}
                      {(dashboard?.topBranches || []).length === 0 && <tr><td colSpan={3} className="text-muted">Chưa có dữ liệu.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header fw-bold">Báo cáo 6 tháng gần nhất</div>
                <div className="card-body table-responsive">
                  <table className="table table-sm table-striped mb-0">
                    <thead><tr><th>Tháng</th><th>Booking</th><th>Doanh thu</th></tr></thead>
                    <tbody>
                      {(report?.monthlySeries || []).map((item) => (
                        <tr key={item.label}>
                          <td>{item.label}</td>
                          <td>{item.bookings}</td>
                          <td>{fmt(item.revenue)}</td>
                        </tr>
                      ))}
                      {(report?.monthlySeries || []).length === 0 && <tr><td colSpan={3} className="text-muted">Chưa có dữ liệu.</td></tr>}
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
              <div className="card-header fw-bold">1. Thêm / cập nhật chi nhánh</div>
              <div className="card-body">
                <form onSubmit={saveBranch}>
                  {[
                    { id: 'name', name: 'name', placeholder: 'Tên chi nhánh', required: true },
                    { id: 'province', name: 'province', placeholder: 'Tỉnh/Thành', required: true },
                    { id: 'address', name: 'address', placeholder: 'Địa chỉ', required: true },
                    { id: 'latitude', name: 'latitude', placeholder: 'Latitude', type: 'number', step: '0.000001', required: true },
                    { id: 'longitude', name: 'longitude', placeholder: 'Longitude', type: 'number', step: '0.000001', required: true },
                    { id: 'totalFloors', name: 'totalFloors', placeholder: 'Số tầng', type: 'number', min: '1', required: true },
                    { id: 'roomsPerFloor', name: 'roomsPerFloor', placeholder: 'Phòng/tầng', type: 'number', min: '1', required: true },
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
                    <button className="btn btn-brand w-100" type="submit">Lưu chi nhánh</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setBranchForm(emptyBranch)}>Mới</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header fw-bold">Danh sách chi nhánh</div>
              <div className="card-body table-responsive">
                <table className="table table-sm table-striped">
                  <thead><tr><th>Tên</th><th>Tỉnh</th><th>Địa chỉ</th><th>Thao tác</th></tr></thead>
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
                            <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setBranchForm(item)}>Sửa</button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteBranch(item.id)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {branches.length === 0 && <tr><td colSpan={4} className="text-muted">Chưa có chi nhánh.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">2. Thêm / cập nhật phòng</div>
              <div className="card-body">
                <form onSubmit={saveRoom}>
                  <input className="form-control mb-2" placeholder="Branch ID" value={roomForm.branchId || selectedBranchId} onChange={(e) => setRoomForm((p) => ({ ...p, branchId: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Số phòng" value={roomForm.roomNumber} onChange={(e) => setRoomForm((p) => ({ ...p, roomNumber: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Tầng" type="number" min="1" value={roomForm.floorNumber} onChange={(e) => setRoomForm((p) => ({ ...p, floorNumber: e.target.value }))} required />
                  <select className="form-select mb-2" value={roomForm.roomType} onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))}>{ROOM_TYPES.map((item) => <option key={item}>{roomTypeLabel(item)}</option>)}</select>
                  <select className="form-select mb-2" value={roomForm.status} onChange={(e) => setRoomForm((p) => ({ ...p, status: e.target.value }))}>{ROOM_STATUSES.map((item) => <option key={item}>{roomStatusLabel(item)}</option>)}</select>
                  <input className="form-control mb-2" placeholder="Sức chứa" type="number" min="1" value={roomForm.capacity} onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Diện tích" type="number" min="0" value={roomForm.area} onChange={(e) => setRoomForm((p) => ({ ...p, area: e.target.value }))} />
                  <input className="form-control mb-2" placeholder="Giá giờ" type="number" min="0" step="1000" value={roomForm.hourlyRate} onChange={(e) => setRoomForm((p) => ({ ...p, hourlyRate: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Giá ngày" type="number" min="0" step="1000" value={roomForm.dailyRate} onChange={(e) => setRoomForm((p) => ({ ...p, dailyRate: e.target.value }))} required />
                  <textarea className="form-control mb-2" rows={2} placeholder="Mô tả phòng" value={roomForm.description} onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))} />
                  <input className="form-control mb-2" placeholder="Tiện nghi, ngăn cách bởi dấu phẩy" value={roomForm.amenities} onChange={(e) => setRoomForm((p) => ({ ...p, amenities: e.target.value }))} />
                  <input className="form-control mb-2" placeholder="Image URLs, ngăn cách bởi dấu phẩy" value={roomForm.imageUrls} onChange={(e) => setRoomForm((p) => ({ ...p, imageUrls: e.target.value }))} />
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="roomHasNiceView" checked={roomForm.hasNiceView} onChange={(e) => setRoomForm((p) => ({ ...p, hasNiceView: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="roomHasNiceView">Phòng view đẹp</label>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand w-100" type="submit">Lưu phòng</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setRoomForm(emptyRoom)}>Mới</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header fw-bold">Danh sách phòng{selectedBranchId ? ` - Chi nhánh #${selectedBranchId}` : ''}</div>
              <div className="card-body table-responsive">
                <table className="table table-sm table-striped">
                  <thead><tr><th>Phòng</th><th>Loại</th><th>Trạng thái</th><th>Giá ngày</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {rooms.length === 0 && <tr><td colSpan={5} className="text-muted">Không có phòng nào.</td></tr>}
                    {pagedRooms.map((item) => (
                      <tr key={item.id}>
                        <td>{item.roomNumber} (Tầng {item.floorNumber})</td>
                        <td>{roomTypeLabel(item.roomType)}</td>
                        <td><span className="badge rounded-pill bg-secondary">{roomStatusLabel(item.status)}</span></td>
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
                              Sửa
                            </button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteRoom(item.id)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rooms.length > ROOMS_PER_PAGE && (
                  <nav aria-label="Phân trang danh sách phòng" className="mt-3 d-flex justify-content-center">
                    <ul className="pagination pagination-sm mb-0">
                      {Array.from({ length: totalRoomPages }, (_, index) => index + 1).map((page) => (
                        <li key={page} className={`page-item${page === roomPage ? ' active' : ''}`}>
                          <button className="page-link" type="button" onClick={() => setRoomPage(page)}>{page}</button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">3. Thêm / cập nhật voucher</div>
              <div className="card-body">
                <form onSubmit={saveVoucher}>
                  <input className="form-control mb-2" placeholder="Mã voucher" value={voucherForm.code} onChange={(e) => setVoucherForm((p) => ({ ...p, code: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Tên voucher" value={voucherForm.name} onChange={(e) => setVoucherForm((p) => ({ ...p, name: e.target.value }))} required />
                  <select className="form-select mb-2" value={voucherForm.audience} onChange={(e) => setVoucherForm((p) => ({ ...p, audience: e.target.value }))}>{VOUCHER_AUDIENCES.map((item) => <option key={item}>{voucherAudienceLabel(item)}</option>)}</select>
                  <input className="form-control mb-2" placeholder="% giảm" type="number" min="0" max="100" step="0.01" value={voucherForm.discountPercent} onChange={(e) => setVoucherForm((p) => ({ ...p, discountPercent: e.target.value }))} required />
                  <label className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={voucherForm.active} onChange={(e) => setVoucherForm((p) => ({ ...p, active: e.target.checked }))} />
                    <span className="form-check-label">Voucher đang hoạt động</span>
                  </label>
                  <input className="form-control mb-2" type="datetime-local" value={voucherForm.validFrom} onChange={(e) => setVoucherForm((p) => ({ ...p, validFrom: e.target.value }))} />
                  <input className="form-control mb-2" type="datetime-local" value={voucherForm.validTo} onChange={(e) => setVoucherForm((p) => ({ ...p, validTo: e.target.value }))} />
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand w-100" type="submit">Lưu voucher</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setVoucherForm(emptyVoucher)}>Mới</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header fw-bold">Danh sách voucher</div>
              <div className="card-body table-responsive">
                <table className="table table-sm table-striped">
                  <thead><tr><th>Code</th><th>Đối tượng</th><th>%</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {vouchers.length === 0 && <tr><td colSpan={5} className="text-muted">Chưa có voucher nào.</td></tr>}
                    {vouchers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.code}</td>
                        <td>{voucherAudienceLabel(item.audience)}</td>
                        <td>{item.discountPercent}</td>
                        <td>{item.active ? 'Bật' : 'Tắt'}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setVoucherForm({ ...item, validFrom: item.validFrom || '', validTo: item.validTo || '' })}>Sửa</button>
                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteVoucher(item.id)}>Xóa</button>
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
