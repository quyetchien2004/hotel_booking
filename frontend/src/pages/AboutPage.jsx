import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';

export default function AboutPage() {
  return (
    <SiteLayout activePage="about" headerVariant="light">
      <main className="container py-4">
        <section className="page-head-card mb-3">
          <h2 className="mb-1">Giới thiệu CCT Hotels Company</h2>
          <p className="text-muted mb-0">Thông tin tổng quan về hệ thống và định hướng phát triển dịch vụ.</p>
        </section>
        <section className="card">
          <div className="card-body">
            <p>
              CCT Hotels Company là hệ thống đặt phòng kết hợp tìm kiếm nhanh, giá linh hoạt theo giờ/ngày,
              và quản lý booking theo tài khoản. Giao diện mới đã được đồng bộ để điều hướng nhất quán giữa
              các phân hệ khách hàng và quản trị.
            </p>
            <Link className="btn btn-brand" to="/booking">Bắt đầu đặt phòng</Link>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
