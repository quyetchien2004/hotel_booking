import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function SiteFooter() {
  useEffect(() => {
    document.body.classList.add('page-enter');
    requestAnimationFrame(() => document.body.classList.add('page-enter-active'));

    const targets = document.querySelectorAll(
      '.card, .branch-card, .feature-item, .module-card, .page-head-card, .mini-stat, .filter-panel'
    );

    if (!window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el, index) => {
      el.classList.add('reveal-item');
      el.style.transitionDelay = Math.min(index * 45, 360) + 'ms';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-5">
            <h3>CCT Hotels Company</h3>
            <p>
              Nền tảng đặt phòng hiện đại với trải nghiệm liền mạch, giao diện cao cấp
              và vận hành chuẩn cho cả khách hàng lẫn quản trị viên.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="Youtube"><i className="fab fa-youtube"></i></a>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <h4>Điều hướng nhanh</h4>
            <ul className="footer-links">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/booking">Đặt phòng</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact">Liên hệ</Link></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-6">
            <h4>Thông tin liên hệ</h4>
            <ul className="footer-info">
              <li><i className="fa-solid fa-location-dot"></i> 123 Nguyễn Huệ, Đà Nẵng</li>
              <li><i className="fa-solid fa-phone"></i> 0900 123 456</li>
              <li><i className="fa-solid fa-envelope"></i> support@ccthotels.vn</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 CCT Hotels Company. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
