import MarketingInfoPage from '../components/MarketingInfoPage';

export default function ProjectsPage() {
  return (
    <MarketingInfoPage
      activePage="about"
      title="Gallery hệ thống"
      subtitle="Tổng hợp hình ảnh chi nhánh, không gian phòng và dịch vụ nổi bật."
      intro="Trang này đại diện cho phần gallery và các dự án hình ảnh của hệ thống CCT Hotels. Nội dung đang được chuẩn hóa lại để đồng bộ với trải nghiệm đặt phòng mới."
      highlights={[
        { title: 'Không gian phòng', text: 'Ảnh thực tế cho từng hạng phòng và từng chi nhánh.' },
        { title: 'Dịch vụ đi kèm', text: 'Giới thiệu tiện ích, khu vực lounge và trải nghiệm khách lưu trú.' },
        { title: 'Nhận diện thương hiệu', text: 'Hệ thống giao diện và hình ảnh được đồng bộ trên toàn bộ nền tảng.' },
      ]}
      primaryAction={{ to: '/single-rooms', label: 'Xem bộ ảnh phòng' }}
      secondaryAction={{ to: '/about', label: 'Tìm hiểu thêm' }}
    />
  );
}
