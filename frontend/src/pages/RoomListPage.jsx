import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { listRooms } from '../services/api';

export default function RoomListPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await listRooms();
        setRooms(data?.items || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Không tải được danh sách phòng');
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
  }, []);

  return (
    <SiteLayout activePage="booking" headerVariant="light">
      <main className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Danh sách phòng khách sạn</h2>
          <p className="text-muted mb-0">Dữ liệu lấy trực tiếp từ backend.</p>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div className="row g-3">
            {rooms.map((room) => (
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
          </div>
        )}
      </main>
    </SiteLayout>
  );
}
