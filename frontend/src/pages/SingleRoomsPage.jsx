import MarketingInfoPage from '../components/MarketingInfoPage';

export default function SingleRoomsPage() {
  return (
    <MarketingInfoPage
      activePage="booking"
      title="Bộ ảnh phòng thực tế"
      subtitle="Không gian, ánh sáng và cấu hình phòng được giới thiệu theo ngôn ngữ trực quan."
      intro="Đây là bản React thay cho trang chi tiết phòng cũ. Khách có thể xem tổng quan hạng phòng trước khi chuyển sang luồng đặt phòng chính."
      highlights={[
        { title: 'Ảnh thực tế', text: 'Hình ảnh được cập nhật theo phong cách thương hiệu CCT Hotels.' },
        { title: 'Thông tin rõ ràng', text: 'Hiển thị sức chứa, mức giá tham khảo và tiện ích chính.' },
        { title: 'Kết nối đặt phòng', text: 'Từ gallery có thể chuyển thẳng sang bộ lọc booking để chốt đơn.' },
      ]}
      primaryAction={{ to: '/booking', label: 'Chọn phòng phù hợp' }}
      secondaryAction={{ to: '/projects', label: 'Xem gallery hệ thống' }}
    />
  );
}
