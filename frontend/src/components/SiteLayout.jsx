import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

export default function SiteLayout({ children, activePage = '', headerVariant = 'light' }) {
  return (
    <>
      <SiteHeader activePage={activePage} variant={headerVariant} />
      {children}
      <SiteFooter />
    </>
  );
}
