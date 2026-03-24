import MarketingInfoPage from '../components/MarketingInfoPage';

export default function Index2Page() {
  return (
    <MarketingInfoPage
      activePage="home"
      title="Landing Page Phiên Bản 2"
      subtitle="Biến thể nội dung giới thiệu, dùng cho chiến dịch hoặc thử nghiệm điều hướng."
      intro="Trang index-2 trong template cũ được thay bằng một landing React gọn để giữ route tương thích trong khi toàn bộ hệ thống đang hợp nhất về giao diện CCT Hotels mới."
      highlights={[
        { title: 'Giữ tương thích route', text: 'Các liên kết cũ tới index-2 vẫn hoạt động sau chuyển đổi.' },
        { title: 'Đồng bộ trải nghiệm', text: 'Header, footer và nút CTA thống nhất với homepage chính.' },
        { title: 'Sẵn sàng A/B testing', text: 'Có thể thay nội dung chiến dịch mà không ảnh hưởng router lõi.' },
      ]}
      primaryAction={{ to: '/', label: 'Về trang chủ chính' }}
      secondaryAction={{ to: '/booking', label: 'Bắt đầu đặt phòng' }}
    />
  );
}
