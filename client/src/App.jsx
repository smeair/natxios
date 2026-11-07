import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import PageBackground from './components/PageBackground.jsx';
import CookieConsent from './components/CookieConsent.jsx';
import BackToTop from './components/BackToTop.jsx';
import HomePage from './pages/HomePage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import { useInitialHashScroll, usePath } from './lib/router.jsx';

const PAGES = { '/': HomePage, '/quiz': QuizPage, '/contact': ContactPage, '/privacy': PrivacyPage, '/terms': TermsPage };

export default function App() {
  const path = usePath();
  useInitialHashScroll();
  const Page = PAGES[path] || NotFoundPage;

  // The admin area has its own layout: no public header, footer or cookie banner.
  if (path === '/admin') {
    return (
      <>
        <PageBackground />
        <AdminPage />
      </>
    );
  }

  return (
    <>
      <PageBackground />
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" key={path} tabIndex={-1}>
        <Page />
      </main>
      <Footer />
      <BackToTop />
      <CookieConsent />
    </>
  );
}
