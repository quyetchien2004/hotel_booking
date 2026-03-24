import MarketingInfoPage from '../components/MarketingInfoPage';

export default function BlogPage() {
  return (
    <MarketingInfoPage
      activePage="about"
      title="Blog CCT Hotels"
      subtitle="Nội dung chia sẻ về trải nghiệm lưu trú, mẹo đặt phòng và cập nhật hệ thống."
      intro="Khu vực blog đã được đưa về React để giữ điều hướng thống nhất. Nội dung bài viết sẽ được kết nối backend hoặc CMS sau khi quá trình chuyển đổi giao diện hoàn tất."
      highlights={[
        { title: 'Mẹo đặt phòng', text: 'Hướng dẫn chọn kiểu thuê, áp voucher và tối ưu chi phí.' },
        { title: 'Tin tức dịch vụ', text: 'Cập nhật tính năng mới trong booking, tài khoản và thanh toán.' },
        { title: 'Trải nghiệm khách hàng', text: 'Chia sẻ câu chuyện và tình huống sử dụng thực tế.' },
      ]}
      primaryAction={{ to: '/blog/1', label: 'Xem bài mẫu' }}
      secondaryAction={{ to: '/chatbot', label: 'Hỏi AI ngay' }}
    />
  );
}
