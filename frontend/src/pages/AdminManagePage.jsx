import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'SUITE', 'DELUXE'];
const VOUCHER_AUDIENCES = ['ALL', 'NEW_USER', 'LOYAL', 'FREQUENT'];

function fmt(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('vi-VN') + ' VND';
}

const emptyBranch = { id: '', name: '', province: '', address: '', latitude: '', longitude: '', totalFloors: '', roomsPerFloor: '' };
const emptyRoom = { id: '', branchId: '', floorNumber: '', roomNumber: '', roomType: 'SINGLE', capacity: '', hourlyRate: '', dailyRate: '', hasNiceView: false };
const emptyVoucher = { id: '', code: '', name: '', audience: 'ALL', discountPercent: '', active: true, validFrom: '', validTo: '' };

export default function AdminManagePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(searchParams.get('branchId') || '');
  const [branchForm, setBranchForm] = useState(emptyBranch);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [voucherForm, setVoucherForm] = useState(emptyVoucher);
  const [msg, setMsg] = useState({ type: '', text: '' });

  function showMsg(type, text) { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 3000); }

  function loadBranches() {
    api.get('/admin/branches').then(r => setBranches(r.data || [])).catch(() => {});
  }
  function loadRooms(bid) {
    if (!bid) { setRooms([]); return; }
    api.get(`/admin/rooms?branchId=${bid}`).then(r => setRooms(r.data || [])).catch(() => {});
  }
  function loadVouchers() {
    api.get('/admin/vouchers').then(r => setVouchers(r.data || [])).catch(() => {});
  }

  useEffect(() => { loadBranches(); loadVouchers(); }, []);
  useEffect(() => { loadRooms(selectedBranchId); }, [selectedBranchId]);

  // Branch form handlers
  async function saveBranch(e) {
    e.preventDefault();
    try {
      await api.post('/admin/branches/save', branchForm);
      showMsg('success', 'Chi nhánh đã được lưu.');
      setBranchForm(emptyBranch);
      loadBranches();
    } catch (err) { showMsg('danger', err.response?.data?.message || 'Lưu thất bại.'); }
  }
  async function deleteBranch(id) {
    if (!window.confirm('Xóa chi nhánh này?')) return;
    try {
      await api.post(`/admin/branches/${id}/delete`);
      loadBranches();
    } catch (err) { showMsg('danger', 'Xóa thất bại.'); }
  }

  // Room form handlers
  async function saveRoom(e) {
    e.preventDefault();
    try {
      await api.post('/admin/rooms/save', { ...roomForm, branchId: roomForm.branchId || selectedBranchId });
      showMsg('success', 'Phòng đã được lưu.');
      setRoomForm(emptyRoom);
      loadRooms(selectedBranchId);
    } catch (err) { showMsg('danger', err.response?.data?.message || 'Lưu thất bại.'); }
  }
  async function deleteRoom(id) {
    if (!window.confirm('Xóa phòng này?')) return;
    try {
      await api.post(`/admin/rooms/${id}/delete`, { branchId: selectedBranchId });
      loadRooms(selectedBranchId);
    } catch (err) { showMsg('danger', 'Xóa thất bại.'); }
  }

  // Voucher form handlers
  async function saveVoucher(e) {
    e.preventDefault();
    try {
      await api.post('/admin/vouchers/save', voucherForm);
      showMsg('success', 'Voucher đã được lưu.');
      setVoucherForm(emptyVoucher);
      loadVouchers();
    } catch (err) { showMsg('danger', err.response?.data?.message || 'Lưu thất bại.'); }
  }
  async function deleteVoucher(id) {
    if (!window.confirm('Xóa voucher này?')) return;
    try {
      await api.post(`/admin/vouchers/${id}/delete`);
      loadVouchers();
    } catch (err) { showMsg('danger', 'Xóa thất bại.'); }
  }

  return (
    <SiteLayout activePage="admin" headerVariant="light">
      <div className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Quản trị hệ thống khách sạn</h2>
          <p className="text-muted mb-0">Quản lý chi nhánh, phòng và voucher theo từng khu vực nhanh và rõ ràng.</p>
        </div>
        <div className="note-card mb-3">Mẹo: Bấm "Sửa" trên bảng để đổ dữ liệu vào form. Nếu tạo mới, bấm "Tạo mới" để xóa nhanh form hiện tại.</div>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        {/* === BRANCHES === */}
        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">1. Thêm hoặc cập nhật chi nhánh</div>
              <div className="card-body">
                <form onSubmit={saveBranch}>
                  {[
                    { id: 'id', name: 'id', placeholder: 'ID (để trống nếu thêm mới)', type: 'number' },
                    { id: 'name', name: 'name', placeholder: 'Tên chi nhánh', required: true },
                    { id: 'province', name: 'province', placeholder: 'Tỉnh/Thành', required: true },
                    { id: 'address', name: 'address', placeholder: 'Địa chỉ', required: true },
                    { id: 'latitude', name: 'latitude', placeholder: 'Latitude', type: 'number', step: '0.000001', required: true },
                    { id: 'longitude', name: 'longitude', placeholder: 'Longitude', type: 'number', step: '0.000001', required: true },
                    { id: 'totalFloors', name: 'totalFloors', placeholder: 'Số tầng', type: 'number', min: '1', required: true },
                    { id: 'roomsPerFloor', name: 'roomsPerFloor', placeholder: 'Phòng/tầng', type: 'number', min: '1', required: true },
                  ].map(f => (
                    <input key={f.id} className="form-control mb-2" {...f}
                      value={branchForm[f.name] ?? ''}
                      onChange={e => setBranchForm(p => ({ ...p, [f.name]: e.target.value }))} />
                  ))}
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand w-100" type="submit">Lưu chi nhánh</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setBranchForm(emptyBranch)}>Tạo mới</button>
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
                  <thead><tr><th>ID</th><th>Tên</th><th>Tỉnh</th><th>Tọa độ</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {branches.map(b => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td><button className="btn btn-link p-0" onClick={() => { setSelectedBranchId(String(b.id)); setRoomForm(p => ({ ...p, branchId: String(b.id) })); }}>{b.name}</button></td>
                        <td>{b.province}</td>
                        <td>{b.latitude}, {b.longitude}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => setBranchForm({ id: b.id, name: b.name, province: b.province, address: b.address, latitude: b.latitude, longitude: b.longitude, totalFloors: b.totalFloors, roomsPerFloor: b.roomsPerFloor })}>Sửa</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteBranch(b.id)}>Xóa</button>
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

        {/* === ROOMS === */}
        <div className="row g-3 mb-4">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">2. Thêm hoặc cập nhật phòng</div>
              <div className="card-body">
                <form onSubmit={saveRoom}>
                  <input className="form-control mb-2" placeholder="ID phòng (để trống nếu thêm mới)" type="number" value={roomForm.id} onChange={e => setRoomForm(p => ({ ...p, id: e.target.value }))} />
                  <input className="form-control mb-2" placeholder="Branch ID" type="number" value={roomForm.branchId || selectedBranchId} onChange={e => setRoomForm(p => ({ ...p, branchId: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Tầng" type="number" min="1" value={roomForm.floorNumber} onChange={e => setRoomForm(p => ({ ...p, floorNumber: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Số phòng" type="number" min="101" value={roomForm.roomNumber} onChange={e => setRoomForm(p => ({ ...p, roomNumber: e.target.value }))} required />
                  <select className="form-select mb-2" value={roomForm.roomType} onChange={e => setRoomForm(p => ({ ...p, roomType: e.target.value }))} required>
                    {ROOM_TYPES.map(rt => <option key={rt}>{rt}</option>)}
                  </select>
                  <input className="form-control mb-2" placeholder="Sức chứa" type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm(p => ({ ...p, capacity: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Giá giờ" type="number" min="0" step="1000" value={roomForm.hourlyRate} onChange={e => setRoomForm(p => ({ ...p, hourlyRate: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Giá ngày" type="number" min="0" step="1000" value={roomForm.dailyRate} onChange={e => setRoomForm(p => ({ ...p, dailyRate: e.target.value }))} required />
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="roomHasNiceView" checked={roomForm.hasNiceView} onChange={e => setRoomForm(p => ({ ...p, hasNiceView: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="roomHasNiceView">Phòng view đẹp</label>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand w-100" type="submit">Lưu phòng</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setRoomForm(emptyRoom)}>Tạo mới</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header fw-bold">Danh sách phòng{selectedBranchId ? ` - Chi nhánh #${selectedBranchId}` : ' (chọn chi nhánh)'}</div>
              <div className="card-body table-responsive">
                <table className="table table-sm table-striped">
                  <thead><tr><th>ID</th><th>Phòng</th><th>Loại</th><th>Giá giờ</th><th>Giá ngày</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {rooms.length === 0 && <tr><td colSpan={6} className="text-muted">Không có phòng nào. Chọn chi nhánh để xem phòng.</td></tr>}
                    {rooms.map(r => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.roomNumber} (Tầng {r.floorNumber})</td>
                        <td>{r.roomType}</td>
                        <td>{fmt(r.hourlyRate)}</td>
                        <td>{fmt(r.dailyRate)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => setRoomForm({ id: r.id, branchId: r.branchId || r.branch?.id || selectedBranchId, floorNumber: r.floorNumber, roomNumber: r.roomNumber, roomType: r.roomType, capacity: r.capacity, hourlyRate: r.hourlyRate, dailyRate: r.dailyRate, hasNiceView: r.hasNiceView })}>Sửa</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRoom(r.id)}>Xóa</button>
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

        {/* === VOUCHERS === */}
        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card h-100">
              <div className="card-header fw-bold">3. Thêm hoặc cập nhật voucher</div>
              <div className="card-body">
                <form onSubmit={saveVoucher}>
                  <input className="form-control mb-2" placeholder="ID voucher (để trống nếu thêm mới)" type="number" value={voucherForm.id} onChange={e => setVoucherForm(p => ({ ...p, id: e.target.value }))} />
                  <input className="form-control mb-2" placeholder="Mã voucher" value={voucherForm.code} onChange={e => setVoucherForm(p => ({ ...p, code: e.target.value }))} required />
                  <input className="form-control mb-2" placeholder="Tên voucher" value={voucherForm.name} onChange={e => setVoucherForm(p => ({ ...p, name: e.target.value }))} required />
                  <select className="form-select mb-2" value={voucherForm.audience} onChange={e => setVoucherForm(p => ({ ...p, audience: e.target.value }))} required>
                    {VOUCHER_AUDIENCES.map(a => <option key={a}>{a}</option>)}
                  </select>
                  <input className="form-control mb-2" placeholder="% giảm" type="number" min="0" max="100" step="0.01" value={voucherForm.discountPercent} onChange={e => setVoucherForm(p => ({ ...p, discountPercent: e.target.value }))} required />
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="voucherActive" checked={voucherForm.active} onChange={e => setVoucherForm(p => ({ ...p, active: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="voucherActive">Còn hoạt động</label>
                  </div>
                  <label className="form-label">Hiệu lực từ</label>
                  <input className="form-control mb-2" type="datetime-local" value={voucherForm.validFrom} onChange={e => setVoucherForm(p => ({ ...p, validFrom: e.target.value }))} />
                  <label className="form-label">Hiệu lực đến</label>
                  <input className="form-control mb-2" type="datetime-local" value={voucherForm.validTo} onChange={e => setVoucherForm(p => ({ ...p, validTo: e.target.value }))} />
                  <div className="d-flex gap-2">
                    <button className="btn btn-brand w-100" type="submit">Lưu voucher</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setVoucherForm(emptyVoucher)}>Tạo mới</button>
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
                  <thead><tr><th>ID</th><th>Code</th><th>Đối tượng</th><th>%</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {vouchers.length === 0 && <tr><td colSpan={6} className="text-muted">Chưa có voucher nào.</td></tr>}
                    {vouchers.map(v => (
                      <tr key={v.id}>
                        <td>{v.id}</td>
                        <td>{v.code}</td>
                        <td>{v.audience}</td>
                        <td>{v.discountPercent}</td>
                        <td>{v.active ? 'ON' : 'OFF'}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => setVoucherForm({ id: v.id, code: v.code, name: v.name, audience: v.audience, discountPercent: v.discountPercent, active: v.active, validFrom: v.validFrom || '', validTo: v.validTo || '' })}>Sửa</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteVoucher(v.id)}>Xóa</button>
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
