import { Link } from 'react-router-dom';
import SiteLayout from './SiteLayout';

export default function AuthExperienceLayout({
  mode,
  panelTitle,
  panelSubtitle,
  eyebrow,
  title,
  description,
  note,
  highlights,
  formMessage,
  children,
  footerText,
  footerLinkTo,
  footerLinkLabel,
}) {
  return (
    <SiteLayout headerVariant="light">
      <main className="auth-page">
        <section className="auth-page__backdrop">
          <div className="container auth-page__container">
            <div className="auth-shell auth-shell--framed">
              <section className="auth-brand">
                <span className="brand-badge">CCT Hotels Company</span>

                <div className="auth-brand__content">
                  <p className="auth-page__eyebrow">{eyebrow}</p>
                  <h1>{title}</h1>
                  <p>{description}</p>
                </div>

                <div className="auth-brand__footer">
                  <div className="auth-switcher" aria-label="Authentication navigation">
                    <Link
                      className={`auth-switcher__link${mode === 'login' ? ' is-active' : ''}`}
                      to="/login"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      className={`auth-switcher__link${mode === 'register' ? ' is-active' : ''}`}
                      to="/register"
                    >
                      Đăng ký
                    </Link>
                  </div>

                  <ul className="auth-highlights">
                    {highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <p className="auth-note">{note}</p>
                </div>
              </section>

              <section className="auth-panel">
                <h2>{panelTitle}</h2>
                <p className="sub">{panelSubtitle}</p>

                {formMessage}
                {children}

                <p className="switch-link">
                  {footerText} <Link to={footerLinkTo}>{footerLinkLabel}</Link>
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}