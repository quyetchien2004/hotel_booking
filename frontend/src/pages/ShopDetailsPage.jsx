import MarketingInfoPage from '../components/MarketingInfoPage';

export default function ShopDetailsPage() {
  return (
    <MarketingInfoPage
      activePage="services"
      title="Chi tiết sản phẩm bổ sung"
      subtitle="Thông tin mô tả cho các gói giá trị gia tăng đi cùng trải nghiệm lưu trú."
      intro="Phiên bản React hiện tại dùng trang này để giới thiệu định hướng mở rộng dịch vụ. Các gói quà tặng, add-on và ưu đãi theo mùa sẽ được đồng bộ sau với backend mới."
      highlights={[
        { title: 'Gói nâng hạng', text: 'Khả năng mở rộng từ phòng tiêu chuẩn sang phòng cao cấp.' },
        { title: 'Dịch vụ bổ sung', text: 'Các lựa chọn thêm như đón tiễn, bữa sáng hoặc hỗ trợ doanh nghiệp.' },
        { title: 'Quản lý tập trung', text: 'Mọi gói dịch vụ sẽ được quản lý đồng bộ qua dashboard admin.' },
      ]}
      primaryAction={{ to: '/contact', label: 'Tư vấn gói dịch vụ' }}
      secondaryAction={{ to: '/shop', label: 'Quay lại cửa hàng' }}
    />
  );
}
