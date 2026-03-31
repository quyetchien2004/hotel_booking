import MarketingInfoPage from '../components/MarketingInfoPage';

export default function TeamSinglePage() {
  return (
    <MarketingInfoPage
      activePage="about"
      title="Hồ sơ vai trò chuyên trách"
      subtitle="Chi tiết hơn về năng lực vận hành và chuẩn hỗ trợ dịch vụ của đội ngũ."
      intro="Thay cho trang profile cũ, phiên bản React này tập trung diễn giải các vai trò then chốt giúp hệ thống đặt phòng hoạt động ổn định và phản hồi nhanh."
      highlights={[
        { title: 'Vận hành booking', text: 'Kiểm tra trạng thái phòng, lịch trống và luồng phê duyệt cọc.' },
        { title: 'Điều phối thanh toán', text: 'Theo dõi giao dịch VNPAY và xử lý trường hợp chờ xác nhận.' },
        { title: 'Chăm sóc tài khoản', text: 'Hỗ trợ xác minh CCCD, OTP và quyền truy cập người dùng.' },
      ]}
      primaryAction={{ to: '/contact', label: 'Cần hỗ trợ trực tiếp' }}
      secondaryAction={{ to: '/team', label: 'Quay lại đội ngũ' }}
    />
  );
}
