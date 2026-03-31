import { useParams } from 'react-router-dom';
import MarketingInfoPage from '../components/MarketingInfoPage';

const POSTS = {
  '1': {
    title: 'Tối ưu đặt phòng theo giờ',
    subtitle: 'Mẹo chọn khung giờ, lọc giá và tránh các bước đặt thừa.',
    intro: 'Bài viết mẫu này đại diện cho nhóm blog-1 đến blog-6 trong template cũ. Mỗi bài có thể được tách thành dữ liệu riêng khi cần.',
  },
  '2': {
    title: 'Thanh toán cọc 30% hiệu quả',
    subtitle: 'Khi nào nên dùng hình thức đặt cọc và cách theo dõi trạng thái.',
    intro: 'Luồng thanh toán cọc phù hợp khi bạn cần giữ phòng trước và chờ admin xác nhận.',
  },
  '3': {
    title: 'Sử dụng voucher đúng cách',
    subtitle: 'Phân biệt WELCOME10, LOYAL10 và FREQUENT25.',
    intro: 'Hệ thống voucher của CCT Hotels được gắn theo hành vi và mức độ gắn bó của khách hàng.',
  },
};

export default function BlogPostPage() {
  const { id } = useParams();
  const post = POSTS[id] || {
    title: `Bài viết số ${id}`,
    subtitle: 'Nội dung mẫu đang được chuẩn hóa cho hệ blog mới.',
    intro: 'Trang này thay thế nhóm file blog-1 đến blog-6 và giữ lại route động để dễ mở rộng dữ liệu sau này.',
  };

  return (
    <MarketingInfoPage
      activePage="about"
      title={post.title}
      subtitle={post.subtitle}
      intro={post.intro}
      highlights={[
        { title: 'Route động', text: 'Một component React xử lý nhiều bài viết thay cho nhiều file HTML tách rời.' },
        { title: 'Sẵn sàng tích hợp API', text: 'Có thể thay dữ liệu tĩnh bằng API mà không đổi router.' },
        { title: 'Điều hướng thống nhất', text: 'Blog, booking và chatbot dùng cùng layout giao diện mới.' },
      ]}
      primaryAction={{ to: '/blog', label: 'Về danh sách blog' }}
      secondaryAction={{ to: '/booking', label: 'Đặt phòng ngay' }}
    />
  );
}
