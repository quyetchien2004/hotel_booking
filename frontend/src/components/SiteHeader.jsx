import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SiteHeader({ activePage = '', variant = 'light' }) {
  const { user, logout } = useAuth();
  const isDark = variant === 'dark';
  const navClass = `navbar navbar-expand-lg sticky-top brand-header ${
    isDark ? 'brand-header--dark navbar-dark' : 'brand-header--light navbar-light'
  }`;

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  function handleLogout(e) {
    e.preventDefault();
    logout();
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
          className="navbar-toggler brand-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav mx-lg-auto align-items-lg-center brand-menu">
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'home' ? ' active' : ''}`} to="/">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'booking' ? ' active' : ''}`} to="/booking">Rooms</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'services' ? ' active' : ''}`} to="/services">Services</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'blog' ? ' active' : ''}`} to="/blog">Blog</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'contact' ? ' active' : ''}`} to="/contact">Contact</NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'my-account' ? ' active' : ''}`} to="/my-account">Profile</NavLink>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'my-bookings' ? ' active' : ''}`} to="/my-bookings">My Bookings</NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className={`nav-link${activePage === 'chatbot' ? ' active' : ''}`} to="/chatbot">Chatbot AI</NavLink>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'admin' ? ' active' : ''}`} to="/admin/manage">Admin</NavLink>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin/bookings">Approve Deposits</NavLink>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <NavLink className={`nav-link${activePage === 'users' ? ' active' : ''}`} to="/users">Users</NavLink>
              </li>
            )}
          </ul>

          {!user ? (
            <div className="brand-actions">
              <Link className="btn btn-sm btn-brand btn-brand-outline" to="/login">Login</Link>
              <Link className="btn btn-sm btn-brand" to="/register">Register</Link>
            </div>
          ) : (
            <div className="brand-actions">
              <button type="button" className="btn btn-sm btn-brand btn-brand-outline" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
