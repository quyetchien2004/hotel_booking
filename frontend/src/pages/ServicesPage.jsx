import MarketingInfoPage from '../components/MarketingInfoPage';

export default function ServicesPage() {
  return (
    <MarketingInfoPage
      activePage="services"
      title="Dịch vụ & tiện ích"
      subtitle="Các tiện ích nổi bật được tích hợp cùng trải nghiệm lưu trú tại CCT Hotels."
      intro="Ngoài đặt phòng linh hoạt, hệ thống còn tập trung vào tốc độ check-in, hỗ trợ thanh toán online và chăm sóc khách hàng theo từng ngữ cảnh sử dụng."
      highlights={[
        { title: 'Đặt nhanh theo bản đồ', text: 'Tìm chi nhánh phù hợp theo vị trí và mức giá.' },
        { title: 'Thanh toán VNPAY', text: 'Hỗ trợ thanh toán đủ hoặc đặt cọc 30% để giữ phòng.' },
        { title: 'Quản trị tập trung', text: 'Admin có thể quản lý chi nhánh, phòng và voucher trên một giao diện.' },
      ]}
      primaryAction={{ to: '/booking', label: 'Khám phá dịch vụ' }}
      secondaryAction={{ to: '/single-service', label: 'Xem chi tiết dịch vụ' }}
    />
  );
}
