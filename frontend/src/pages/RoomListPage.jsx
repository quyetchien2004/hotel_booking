import MarketingInfoPage from '../components/MarketingInfoPage';

export default function RoomListPage() {
  return (
    <MarketingInfoPage
      activePage="booking"
      title="Danh sách hạng phòng"
      subtitle="Tổng quan các dòng phòng đang được hệ thống hỗ trợ hiển thị và đặt trực tuyến."
      intro="Trang này thay cho template phòng cũ và tập trung dẫn khách đến luồng booking mới, nơi có bộ lọc tỉnh thành, kiểu thuê, giá và voucher."
      highlights={[
        { title: 'Standard & Single', text: 'Phù hợp nhu cầu nghỉ ngắn, chi phí tối ưu.' },
        { title: 'Deluxe & Double', text: 'Không gian rộng hơn, phù hợp cặp đôi hoặc công tác.' },
        { title: 'Suite', text: 'Dành cho khách cần trải nghiệm cao cấp hơn và thời gian lưu trú dài.' },
      ]}
      primaryAction={{ to: '/booking', label: 'Đặt phòng ngay' }}
      secondaryAction={{ to: '/single-rooms', label: 'Xem ảnh thực tế' }}
    />
  );
}
