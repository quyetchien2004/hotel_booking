import MarketingInfoPage from '../components/MarketingInfoPage';

export default function BlogDetailsPage() {
  return (
    <MarketingInfoPage
      activePage="about"
      title="Chi tiết bài viết"
      subtitle="Trang chi tiết dành cho nội dung blog và cập nhật chuyên sâu của hệ thống."
      intro="Phiên bản chuyển đổi hiện tại dùng bố cục React tối giản để thay thế template blog chi tiết cũ. Dữ liệu bài viết có thể được nối động ở bước sau."
      highlights={[
        { title: 'Bố cục thống nhất', text: 'Đồng bộ header, footer và điều hướng với toàn bộ website.' },
        { title: 'Sẵn sàng gắn dữ liệu', text: 'Có thể mở rộng từ dữ liệu tĩnh sang API hoặc CMS mà không đổi layout lớn.' },
        { title: 'Điều hướng liên quan', text: 'Khách có thể quay về blog hoặc đi thẳng sang booking và chatbot.' },
      ]}
      primaryAction={{ to: '/blog', label: 'Quay lại blog' }}
      secondaryAction={{ to: '/booking', label: 'Đặt phòng ngay' }}
    />
  );
}
