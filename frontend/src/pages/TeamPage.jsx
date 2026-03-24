import MarketingInfoPage from '../components/MarketingInfoPage';

export default function TeamPage() {
  return (
    <MarketingInfoPage
      activePage="about"
      title="Đội ngũ vận hành"
      subtitle="Những nhóm phụ trách vận hành, chăm sóc khách hàng và công nghệ của CCT Hotels."
      intro="Trang nhân sự được chuyển sang React dưới dạng landing page gọn, tập trung vào vai trò vận hành dịch vụ và hỗ trợ khách trong hệ thống đặt phòng mới."
      highlights={[
        { title: 'CSKH', text: 'Tiếp nhận và xử lý booking, thanh toán, hỗ trợ sau lưu trú.' },
        { title: 'Vận hành chi nhánh', text: 'Phối hợp kiểm tra tình trạng phòng và xác nhận khả dụng.' },
        { title: 'Nền tảng số', text: 'Phụ trách website, chatbot AI và quản trị hệ thống.' },
      ]}
      primaryAction={{ to: '/contact', label: 'Liên hệ đội ngũ' }}
      secondaryAction={{ to: '/team-single', label: 'Xem vai trò chi tiết' }}
    />
  );
}
