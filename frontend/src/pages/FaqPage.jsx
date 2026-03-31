import MarketingInfoPage from '../components/MarketingInfoPage';

export default function FaqPage() {
  return (
    <MarketingInfoPage
      activePage="faq"
      title="Câu hỏi thường gặp"
      subtitle="Tổng hợp các vấn đề thường gặp khi tìm phòng, đặt phòng và sử dụng voucher."
      intro="Bạn có thể đặt phòng theo giờ hoặc theo ngày, áp voucher ngay trong quy trình booking và theo dõi trạng thái thanh toán trong khu vực tài khoản."
      highlights={[
        { title: 'Đặt phòng theo giờ', text: 'Chọn kiểu thuê Theo giờ tại trang đặt phòng và nhập khoảng thời gian cụ thể.' },
        { title: 'Áp dụng voucher', text: 'Voucher hợp lệ sẽ được hệ thống trừ tự động khi tạo booking.' },
        { title: 'Xem lại đơn', text: 'Tất cả booking đã tạo có thể xem trong mục Đơn của tôi sau khi đăng nhập.' },
      ]}
      primaryAction={{ to: '/booking', label: 'Đi tới trang đặt phòng' }}
      secondaryAction={{ to: '/chatbot', label: 'Hỏi AI Concierge' }}
    />
  );
}
