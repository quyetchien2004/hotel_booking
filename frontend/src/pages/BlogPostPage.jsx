import { Link, useParams } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { BLOG_POSTS, getBlogPostById } from '../data/blogPosts';

export default function BlogPostPage() {
  const { id } = useParams();
  const post = getBlogPostById(id) || {
    id,
    category: 'Blog',
    readTime: '04 phút đọc',
    title: `Bài viết số ${id}`,
    subtitle: 'Nội dung mẫu đang được chuẩn hóa cho hệ blog mới.',
    desc: 'Trang blog chi tiết được dựng lại để có nhiều nhịp nội dung hơn, dễ mở rộng bằng dữ liệu thật sau này.',
    coverImage: '/img/rooms-details/CCT_floor.jpg',
    images: ['/img/rooms-details/CCT_floor.jpg', '/img/rooms-details/2_nguoi.jpg'],
    stats: [
      { label: 'Trạng thái', value: 'Đang cập nhật' },
      { label: 'Định dạng', value: 'Long-form' },
      { label: 'Gallery', value: '02 ảnh' },
    ],
    highlights: [
      { title: 'Bố cục động', text: 'Trang chi tiết có thể mở rộng thành bài long-form mà không cần đổi router.' },
      { title: 'Ảnh minh họa lớn', text: 'Mỗi bài đều có cụm ảnh để nội dung bớt khô và trực quan hơn.' },
      { title: 'CTA rõ ràng', text: 'Người đọc có thể quay lại blog hoặc chuyển sang đặt phòng chỉ với một nhịp bấm.' },
    ],
    sections: [
      {
        heading: 'Bài viết đang chờ nội dung thật',
        body: 'Phần này đang đóng vai trò khung bài viết. Khi cần, bạn chỉ việc thay dữ liệu trong nguồn blog và giao diện hiện tại vẫn giữ được cấu trúc magazine với ảnh, số liệu và các khối thông tin nổi bật.',
      },
    ],
  };
  const relatedPosts = BLOG_POSTS.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <SiteLayout activePage="blog" headerVariant="light">
      <main className="container py-4 blog-detail-shell">
        <section className="blog-detail-hero mb-4">
          <div className="blog-detail-hero__copy">
            <div className="blog-meta-row mb-3">
              <span className="blog-pill">{post.category}</span>
              <span>{post.readTime}</span>
            </div>
            <h1>{post.title}</h1>
            <p className="blog-detail-subtitle">{post.subtitle}</p>
            <p className="blog-detail-intro">{post.desc}</p>
            <div className="blog-detail-actions">
              <Link className="btn btn-brand" to="/blog">Về danh sách blog</Link>
              <Link className="btn btn-outline-secondary" to="/booking">Đặt phòng ngay</Link>
            </div>
          </div>

          <div className="blog-detail-hero__gallery">
            <img className="blog-detail-hero__main" src={post.images[0] || post.coverImage} alt={post.title} />
            <div className="blog-detail-hero__stack">
              {post.images.slice(1, 3).map((image, index) => (
                <img key={image + index} src={image} alt={`${post.title} ${index + 2}`} />
              ))}
            </div>
          </div>
        </section>

        <section className="blog-detail-stats mb-4">
          {post.stats.map((stat) => (
            <div key={stat.label} className="blog-detail-stats__card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </section>

        <section className="row g-4 mb-4">
          <div className="col-lg-8">
            <article className="blog-article-card">
              {post.sections.map((section) => (
                <section key={section.heading} className="blog-article-section">
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </section>
              ))}
            </article>
          </div>

          <div className="col-lg-4">
            <aside className="blog-insight-panel">
              <span className="blog-kicker">ĐIỂM NHẤN</span>
              <h3>Những ý chính nên nắm nhanh</h3>
              <div className="blog-insight-list">
                {post.highlights.map((item) => (
                  <div className="blog-insight-item" key={item.title}>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="blog-photo-strip mb-4">
          {post.images.slice(0, 3).map((image, index) => (
            <figure key={image + index} className="blog-photo-strip__item">
              <img src={image} alt={`${post.title} ảnh ${index + 1}`} />
              <figcaption>Ảnh minh họa {index + 1}</figcaption>
            </figure>
          ))}
        </section>

        <section className="blog-related-section">
          <div className="blog-section-head">
            <div>
              <span className="blog-kicker">ĐỌC TIẾP</span>
              <h2>Bài liên quan cùng mạch trải nghiệm khách hàng</h2>
            </div>
          </div>
          <div className="row g-4 mt-0">
            {relatedPosts.map((item) => (
              <div className="col-md-4" key={item.id}>
                <article className="blog-related-card h-100">
                  <img src={item.coverImage} alt={item.title} />
                  <div>
                    <span className="blog-pill">{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    <Link to={`/blog/${item.id}`}>Đọc bài viết</Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
