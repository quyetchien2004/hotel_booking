import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { getRoomDetail } from '../services/api';

function roomTypeLabel(value) {
  switch (value) {
    case 'DOUBLE': return 'Phòng 2 người';
    case 'TRIPLE': return 'Phòng 3 người';
    case 'SUITE': return 'Phòng 6 người';
    case 'FAMILY': return 'Phòng gia đình';
    case 'DORM': return 'Phòng 10 người';
    default: return value;
  }
}

function qualityTierLabel(value) {
  switch (value) {
    case 'DELUXE': return 'Deluxe';
    case 'PREMIUM': return 'Premium';
    default: return 'Standard';
  }
}

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
            <div className="row g-3 align-items-stretch">
              <div className="col-lg-7">
                <div className="card h-100 overflow-hidden">
                  <img
                    src={room.imageUrls?.[0] || '/img/rooms-details/2_nguoi.jpg'}
                    alt={`Ảnh đại diện phòng ${room.roomNumber}`}
                    className="card-img-top"
                    style={{ height: 420, objectFit: 'cover' }}
                  />
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card card-body h-100">
                  <span className="badge text-bg-light border align-self-start mb-3">{qualityTierLabel(room.qualityTier)}</span>
                  <h4 className="mb-1">{room.roomLabel || `Phòng ${room.roomNumber}`}</h4>
                  <p className="text-muted mb-2">Phòng {room.roomNumber} • {roomTypeLabel(room.roomType)} • {room.capacity} khách • {room.area || 0}m2</p>
                  <p className="mb-3">{room.description}</p>
                  <div className="small text-muted mb-2">Chi nhánh: {room.branchName || '-'} {room.province ? `• ${room.province}` : ''}</div>
                  <div className="small text-muted mb-3">Giá ngày: {Number(room.dailyRate || 0).toLocaleString('vi-VN')}đ | Giá giờ: {Number(room.hourlyRate || 0).toLocaleString('vi-VN')}đ</div>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {(room.amenities || []).map((amenity) => (
                      <span key={amenity} className="badge rounded-pill text-bg-light border">{amenity}</span>
                    ))}
                  </div>
                  <div className="small text-muted">Bộ ảnh thực tế: {(room.imageGallery || []).length || (room.imageUrls || []).length} ảnh minh họa.</div>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-1">
              {(room.imageGallery?.length ? room.imageGallery : (room.imageUrls || []).map((url) => ({ url, title: 'Ảnh thực tế', description: 'Ảnh minh họa không gian phòng.' }))).map((image, index) => (
                <div className="col-md-6" key={(image.url || '') + index}>
                  <div className="card h-100 overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title || `Ảnh ${index + 1} phòng ${room.roomNumber}`}
                      className="card-img-top"
                      style={{ height: 300, objectFit: 'cover' }}
                    />
                    <div className="card-body">
                      <h6 className="mb-1">{image.title || `Ảnh ${index + 1}`}</h6>
                      <p className="text-muted small mb-0">{image.description || 'Ảnh thực tế của phòng và khu vực liên quan.'}</p>
                    </div>
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
