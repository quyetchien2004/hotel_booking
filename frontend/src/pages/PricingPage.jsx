import MarketingInfoPage from '../components/MarketingInfoPage';

export default function PricingPage() {
  return (
    <MarketingInfoPage
      activePage="services"
      title="Bảng giá tham khảo"
      subtitle="Giá thực tế được tính theo bộ lọc tìm phòng và thời điểm đặt phòng."
      intro="Hệ thống hỗ trợ giá theo giờ và theo ngày, phụ thu dịp lễ và khuyến mại theo voucher. Mức giá cuối cùng luôn được hiển thị minh bạch trước khi xác nhận booking."
      highlights={[
        { title: 'Giá giờ linh hoạt', text: 'Phù hợp cho nhu cầu nghỉ ngắn hạn hoặc công tác trong ngày.' },
        { title: 'Giá ngày tối ưu', text: 'Check-in và check-out được đồng bộ với chính sách từng chi nhánh.' },
        { title: 'Chiết khấu tự động', text: 'Voucher và ưu đãi khách hàng thân thiết được áp dụng ngay trên đơn.' },
      ]}
      primaryAction={{ to: '/booking', label: 'Xem giá thực tế' }}
      secondaryAction={{ to: '/contact', label: 'Liên hệ tư vấn' }}
    />
  );
}
