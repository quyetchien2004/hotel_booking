import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SiteHeader({ activePage = '', variant = 'light' }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = variant === 'dark';
  const navClass = `navbar navbar-expand-lg sticky-top brand-header ${
    isDark ? 'brand-header--dark navbar-dark' : 'brand-header--light navbar-light'
  }`;

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  function handleLogout(e) {
    e.preventDefault();
    logout();
    setMenuOpen(false);
  }

  function handleNavClick() {
    setMenuOpen(false);
  }

  return (
    <nav className={navClass}>
      <div className="container brand-header__inner">
        <Link className="navbar-brand brand-logo" to="/">
          <span className="brand-mark">CCT</span>
          <span className="brand-copy">
            <span className="brand-name">CCT Hotels Company</span>
            <span className="brand-tagline">Luxury Travel Experience</span>
          </span>
        </Link>

        <button
          className={`navbar-toggler brand-toggler${menuOpen ? '' : ' collapsed'}`}
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-controls="mainNav"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`brand-nav-shell${menuOpen ? ' is-open' : ''}`} id="mainNav">
          <ul className="navbar-nav mx-lg-auto align-items-lg-center brand-menu">
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'home' ? ' active' : ''}`} to="/" onClick={handleNavClick}>Trang chủ</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'booking' ? ' active' : ''}`} to="/booking" onClick={handleNavClick}>Phòng</NavLink>
            </li>
            {!isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'services' ? ' active' : ''}`} to="/services" onClick={handleNavClick}>Dịch vụ</NavLink>
              </li>
            )}
            {!isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'blog' ? ' active' : ''}`} to="/blog" onClick={handleNavClick}>Tin tức</NavLink>
              </li>
            )}
            {!isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'contact' ? ' active' : ''}`} to="/contact" onClick={handleNavClick}>Liên hệ</NavLink>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'my-account' ? ' active' : ''}`} to="/my-account" onClick={handleNavClick}>Tài khoản</NavLink>
              </li>
            )}
            {user && !isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'my-bookings' ? ' active' : ''}`} to="/my-bookings" onClick={handleNavClick}>Đơn đặt phòng</NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'chatbot' ? ' active' : ''}`} to="/chatbot" onClick={handleNavClick}>Chatbot AI</NavLink>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'admin' ? ' active' : ''}`} to="/admin/manage" onClick={handleNavClick}>Quản trị</NavLink>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin/bookings" onClick={handleNavClick}>Duyệt cọc</NavLink>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'lock-codes' ? ' active' : ''}`} to="/admin/lock-codes" onClick={handleNavClick}>Mã mở khóa</NavLink>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin/support-requests" onClick={handleNavClick}>Yêu cầu hỗ trợ</NavLink>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'users' ? ' active' : ''}`} to="/users" onClick={handleNavClick}>Người dùng</NavLink>
              </li>
            )}
          </ul>

          {!user ? (
            <div className="brand-actions">
              <Link className="btn btn-sm btn-brand btn-brand-outline" to="/login" onClick={handleNavClick}>Đăng nhập</Link>
              <Link className="btn btn-sm btn-brand" to="/register" onClick={handleNavClick}>Đăng ký</Link>
            </div>
          ) : (
            <div className="brand-actions">
              <button type="button" className="btn btn-sm btn-brand btn-brand-outline" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
