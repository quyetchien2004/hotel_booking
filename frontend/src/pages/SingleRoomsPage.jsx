import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { getRoomDetail } from '../services/api';

export default function SingleRoomsPage() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRoom() {
      if (!roomId) {
        setError('Thiếu mã phòng. Hãy chọn phòng từ danh sách.');
        setLoading(false);
        return;
      }

      try {
        const data = await getRoomDetail(roomId);
        setRoom(data?.item || null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Không tải được chi tiết phòng');
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
  }, [roomId]);

  return (
    <SiteLayout activePage="booking" headerVariant="light">
      <main className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Chi tiết ảnh phòng</h2>
          <p className="text-muted mb-0">Xem ảnh và thông tin chi tiết của từng phòng.</p>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && room && (
          <>
            <div className="card card-body mb-3">
              <h4 className="mb-1">Phòng {room.roomNumber}</h4>
              <p className="text-muted mb-2">{room.roomType} • {room.capacity} khách • {room.area || 0}m2</p>
              <p className="mb-2">{room.description}</p>
              <div className="small text-muted mb-0">
                Giá ngày: {Number(room.dailyRate || 0).toLocaleString('vi-VN')}đ | Giá giờ: {Number(room.hourlyRate || 0).toLocaleString('vi-VN')}đ
              </div>
            </div>

            <div className="row g-3">
              {(room.imageUrls || []).map((imageUrl, index) => (
                <div className="col-md-6" key={imageUrl + index}>
                  <div className="card h-100">
                    <img
                      src={imageUrl}
                      alt={`Ảnh ${index + 1} phòng ${room.roomNumber}`}
                      className="card-img-top"
                      style={{ height: 300, objectFit: 'cover' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex gap-2 mt-3">
              <Link to="/room" className="btn btn-outline-primary">Quay lại danh sách phòng</Link>
              <Link to="/booking" className="btn btn-brand">Đặt phòng ngay</Link>
            </div>
          </>
        )}
      </main>
    </SiteLayout>
  );
}
