import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { BLOG_POSTS } from '../data/blogPosts';

export default function BlogPage() {
  const featuredPost = BLOG_POSTS[0];
  const sidePosts = BLOG_POSTS.slice(1, 3);
  const latestPosts = BLOG_POSTS.slice(0, 4);

  return (
    <SiteLayout activePage="blog" headerVariant="light">
      <main className="container py-4 blog-page-shell">
        <section className="blog-hero mb-4">
          <div className="blog-hero__copy">
            <span className="blog-kicker">CCT JOURNAL</span>
            <h1>Blog khách sạn được làm lại theo phong cách editorial hiện đại</h1>
            <p>
              Không chỉ là vài thẻ bài viết đơn giản, khu blog giờ được trình bày như một tạp chí số nhỏ: ảnh lớn,
              bố cục nhiều nhịp, nội dung rõ trọng tâm và mỗi bài đều có gallery minh họa 2 đến 3 ảnh thực tế.
            </p>
            <div className="blog-hero__chips">
              <span>Mẹo đặt phòng</span>
              <span>Thanh toán thông minh</span>
              <span>Voucher theo hành vi</span>
              <span>Kinh nghiệm lưu trú</span>
            </div>
          </div>
          <div className="blog-hero__panel">
            <img src={featuredPost.coverImage} alt={featuredPost.title} className="blog-hero__panel-main" />
            <div className="blog-hero__panel-grid">
              {featuredPost.images.slice(1, 3).map((image, index) => (
                <img key={image + index} src={image} alt={`${featuredPost.title} ${index + 2}`} />
              ))}
            </div>
          </div>
        </section>

        <section className="row g-4 mb-4">
          <div className="col-lg-7">
            <article className="blog-feature-card">
              <div className="blog-feature-card__media">
                <img src={featuredPost.coverImage} alt={featuredPost.title} />
              </div>
              <div className="blog-feature-card__body">
                <div className="blog-meta-row">
                  <span className="blog-pill">{featuredPost.category}</span>
                  <span>{featuredPost.readTime}</span>
                </div>
                <h2>{featuredPost.title}</h2>
                <p>{featuredPost.desc}</p>
                <div className="blog-stat-grid">
                  {featuredPost.stats.map((stat) => (
                    <div key={stat.label} className="blog-stat-card">
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
                <Link className="btn btn-brand" to={`/blog/${featuredPost.id}`}>Khám phá bài viết nổi bật</Link>
              </div>
            </article>
          </div>

          <div className="col-lg-5">
            <div className="blog-side-stack">
              {sidePosts.map((post) => (
                <article className="blog-side-card" key={post.id}>
                  <img src={post.coverImage} alt={post.title} />
                  <div>
                    <div className="blog-meta-row">
                      <span className="blog-pill">{post.category}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.desc}</p>
                    <Link to={`/blog/${post.id}`}>Đọc bài này</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="blog-latest-section">
          <div className="blog-section-head">
            <div>
              <span className="blog-kicker">BÀI VIẾT MỚI</span>
              <h2>Giao diện thẻ bài nhiều lớp, ảnh thật và nhịp đọc rõ ràng</h2>
            </div>
            <p>
              Mỗi bài đều có ảnh cover, dải ảnh bổ sung và tóm tắt ngắn để người xem quyết định nhanh bài nào đáng đọc.
            </p>
          </div>

          <div className="row g-4">
            {latestPosts.map((post) => (
              <div className="col-md-6" key={post.id}>
                <article className="blog-card-modern h-100">
                  <div className="blog-card-modern__cover">
                    <img src={post.coverImage} alt={post.title} />
                    <span className="blog-pill blog-pill--overlay">{post.category}</span>
                  </div>
                  <div className="blog-card-modern__body">
                    <div className="blog-meta-row mb-2">
                      <span>{post.readTime}</span>
                      <span>{post.images.length} ảnh minh họa</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.desc}</p>
                    <div className="blog-card-modern__gallery">
                      {post.images.slice(0, 3).map((image, index) => (
                        <img key={image + index} src={image} alt={`${post.title} ${index + 1}`} />
                      ))}
                    </div>
                    <Link className="btn btn-outline-primary btn-sm mt-3" to={`/blog/${post.id}`}>
                      Xem bài viết chi tiết
                    </Link>
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
