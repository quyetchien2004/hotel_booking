import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { listRooms } from '../services/api';

export default function RoomListPage() {
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ roomType: '', minCapacity: '', status: 'AVAILABLE', maxPrice: '', keyword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRooms() {
      try {
        const params = {
          status: filters.status || 'AVAILABLE',
        };

        if (filters.roomType) {
          params.roomType = filters.roomType;
        }

        if (filters.minCapacity) {
          params.minCapacity = Number(filters.minCapacity);
        }

        const data = await listRooms(params);
        setRooms(data?.items || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Không tải được danh sách phòng');
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
  }, [filters.roomType, filters.minCapacity, filters.status]);

  const filteredRooms = rooms.filter((room) => {
    const maxPrice = Number(filters.maxPrice || 0);
    const keyword = String(filters.keyword || '').trim().toLowerCase();

    const passPrice = !maxPrice || Number(room.dailyRate || 0) <= maxPrice;
    const passKeyword = !keyword || String(room.roomNumber || '').toLowerCase().includes(keyword) || String(room.roomType || '').toLowerCase().includes(keyword);

    return passPrice && passKeyword;
  });

  function onFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <SiteLayout activePage="booking" headerVariant="light">
      <main className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Danh sách phòng khách sạn</h2>
          <p className="text-muted mb-0">Lọc theo loại phòng, sức chứa, trạng thái và mức giá.</p>
        </div>

        <div className="card card-body mb-3">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Loại phòng</label>
              <select className="form-select" name="roomType" value={filters.roomType} onChange={onFilterChange}>
                <option value="">Tất cả</option>
                <option value="STANDARD">STANDARD</option>
                <option value="DELUXE">DELUXE</option>
                <option value="SUITE">SUITE</option>
                <option value="FAMILY">FAMILY</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">Sức chứa tối thiểu</label>
              <input className="form-control" name="minCapacity" type="number" min="1" value={filters.minCapacity} onChange={onFilterChange} />
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">Trạng thái</label>
              <select className="form-select" name="status" value={filters.status} onChange={onFilterChange}>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="BOOKED">BOOKED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small fw-semibold">Giá ngày tối đa</label>
              <input className="form-control" name="maxPrice" type="number" min="0" step="1000" value={filters.maxPrice} onChange={onFilterChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold">Từ khóa</label>
              <input className="form-control" name="keyword" placeholder="Số phòng hoặc loại phòng" value={filters.keyword} onChange={onFilterChange} />
            </div>
          </div>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div className="row g-3">
            {filteredRooms.map((room) => (
              <div className="col-md-6 col-lg-4" key={room.id}>
                <div className="card h-100">
                  <img
                    src={room.imageUrls?.[0] || '/img/rooms-details/2_nguoi.jpg'}
                    className="card-img-top"
                    alt={`Phòng ${room.roomNumber}`}
                    style={{ height: 210, objectFit: 'cover' }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title mb-1">Phòng {room.roomNumber}</h5>
                    <p className="text-muted small mb-2">{room.roomType} • {room.capacity} khách</p>
                    <p className="card-text small">{room.description || 'Phòng tiện nghi, phù hợp nghỉ dưỡng và công tác.'}</p>
                    <div className="small text-muted mb-2">Giá ngày: {Number(room.dailyRate || 0).toLocaleString('vi-VN')}đ</div>
                    <div className="mt-auto d-flex gap-2">
                      <Link to={`/single-rooms?roomId=${room.id}`} className="btn btn-outline-primary btn-sm">Xem chi tiết ảnh</Link>
                      <Link to="/booking" className="btn btn-brand btn-sm">Đặt phòng</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredRooms.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info mb-0">Không có phòng phù hợp với bộ lọc hiện tại.</div>
              </div>
            )}
          </div>
        )}
      </main>
    </SiteLayout>
  );
}
