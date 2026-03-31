import MarketingInfoPage from '../components/MarketingInfoPage';

export default function SingleServicePage() {
  return (
    <MarketingInfoPage
      activePage="services"
      title="Chi tiết dịch vụ"
      subtitle="Thông tin chi tiết về từng gói dịch vụ và quy trình hỗ trợ khách hàng."
      intro="CCT Hotels chuẩn hóa trải nghiệm từ lúc tìm phòng, xác nhận thanh toán cho tới hậu mãi sau lưu trú. Mỗi bước đều có trạng thái rõ ràng và hỗ trợ trực tuyến khi cần."
      highlights={[
        { title: 'Quy trình minh bạch', text: 'Mọi trạng thái thanh toán và phê duyệt đều được cập nhật theo thời gian thực.' },
        { title: 'Hỗ trợ đa kênh', text: 'Hotline, chatbot AI và biểu mẫu liên hệ luôn sẵn sàng tiếp nhận yêu cầu.' },
        { title: 'Bảo mật tài khoản', text: 'Xác minh CCCD và OTP email giúp tăng độ tin cậy và an toàn sử dụng.' },
      ]}
      primaryAction={{ to: '/contact', label: 'Trao đổi với tư vấn viên' }}
      secondaryAction={{ to: '/services', label: 'Quay lại dịch vụ' }}
    />
  );
}
