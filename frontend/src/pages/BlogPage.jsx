import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';

const POSTS = [
  {
    id: '1',
    category: 'Booking',
    title: 'Tối ưu đặt phòng theo giờ cho chuyến đi ngắn',
    desc: 'Cách chọn khung giờ, tối ưu chi phí và tránh lỗi chọn sai thời gian check-in/check-out.',
  },
  {
    id: '2',
    category: 'Thanh toán',
    title: 'Thanh toán cọc 30% hay 100%: nên chọn cách nào?',
    desc: 'So sánh hai hình thức thanh toán trong hệ thống để giữ phòng an toàn và linh hoạt.',
  },
  {
    id: '3',
    category: 'Voucher',
    title: 'Sử dụng voucher đúng cách để giảm chi phí lưu trú',
    desc: 'Phân biệt WELCOME10, LOYAL10, FREQUENT25 và điều kiện nhận từng mã.',
  },
  {
    id: '4',
    category: 'Kinh nghiệm',
    title: 'Checklist đặt phòng không lỗi cho người mới',
    desc: 'Từ bước lọc phòng đến xác nhận thanh toán, những điểm cần kiểm tra trước khi chốt đơn.',
  },
];

export default function BlogPage() {
  return (
    <SiteLayout activePage="about" headerVariant="light">
      <main className="container py-4">
        <div className="page-head-card mb-3">
          <h2 className="mb-1">Blog CCT Hotels</h2>
          <p className="text-muted mb-0">Chia sẻ mẹo đặt phòng, thanh toán, voucher và kinh nghiệm lưu trú.</p>
        </div>

        <div className="row g-3">
          {POSTS.map((post) => (
            <div className="col-md-6" key={post.id}>
              <article className="card h-100">
                <div className="card-body d-flex flex-column">
                  <span className="badge text-bg-light align-self-start mb-2">{post.category}</span>
                  <h5 className="card-title">{post.title}</h5>
                  <p className="card-text text-muted">{post.desc}</p>
                  <Link className="btn btn-outline-primary btn-sm mt-auto align-self-start" to={`/blog/${post.id}`}>
                    Đọc bài viết
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </main>
    </SiteLayout>
  );
}
