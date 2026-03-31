import { Link } from 'react-router-dom';
import SiteLayout from './SiteLayout';

export default function MarketingInfoPage({
  activePage,
  title,
  subtitle,
  intro,
  highlights = [],
  primaryAction,
  secondaryAction,
}) {
  return (
    <SiteLayout activePage={activePage} headerVariant="light">
      <main className="container py-4">
        <section className="page-head-card mb-3">
          <h2 className="mb-1">{title}</h2>
          <p className="text-muted mb-0">{subtitle}</p>
        </section>

        <section className="card border-0 shadow-sm mb-3">
          <div className="card-body p-4">
            <p className="mb-0">{intro}</p>
          </div>
        </section>

        {highlights.length > 0 && (
          <section className="row g-3">
            {highlights.map((item, index) => (
              <div className="col-md-6 col-xl-4" key={index}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold">{item.title}</h5>
                    <p className="text-muted mb-0">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {(primaryAction || secondaryAction) && (
          <section className="d-flex flex-wrap gap-2 mt-4">
            {primaryAction && (
              <Link className="btn btn-brand" to={primaryAction.to}>
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction && (
              <Link className="btn btn-outline-secondary" to={secondaryAction.to}>
                {secondaryAction.label}
              </Link>
            )}
          </section>
        )}
      </main>
    </SiteLayout>
  );
}
