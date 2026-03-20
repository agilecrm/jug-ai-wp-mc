import { useState, useEffect } from '@wordpress/element';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import ConversationsPage from './pages/ConversationsPage';
import SettingsPage from './pages/SettingsPage';

function getRoute(): string {
  const hash = window.location.hash.replace('#', '') || '/';
  return hash;
}

export default function App() {
  const [route, setRoute] = useState(getRoute());
  const [isLoggedIn, setIsLoggedIn] = useState(window.jugAiConfig.isLoggedIn);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = '#' + path;
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/login');
  };

  if (!isLoggedIn && !route.startsWith('/login')) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const showSidebar = isLoggedIn && !route.startsWith('/login');

  const renderPage = () => {
    if (route.startsWith('/onboarding')) return <OnboardingPage />;
    if (route.startsWith('/conversations')) return <ConversationsPage route={route} />;
    if (route.startsWith('/settings')) return <SettingsPage onLogout={handleLogout} />;
    if (route.startsWith('/login')) return <LoginPage onLogin={handleLogin} />;
    return <DashboardPage />;
  };

  return (
    <div className="jug-ai-app">
      {showSidebar && (
        <nav className="jug-ai-sidebar">
          <div className="jug-ai-sidebar-brand">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Jug.ai</span>
          </div>
          <ul className="jug-ai-sidebar-nav">
            <li className={route.startsWith('/dashboard') || route === '/' ? 'active' : ''}>
              <a href="#/dashboard">Dashboard</a>
            </li>
            <li className={route.startsWith('/onboarding') ? 'active' : ''}>
              <a href="#/onboarding">Onboarding</a>
            </li>
            <li className={route.startsWith('/conversations') ? 'active' : ''}>
              <a href="#/conversations">Conversations</a>
            </li>
            <li className={route.startsWith('/settings') ? 'active' : ''}>
              <a href="#/settings">Settings</a>
            </li>
          </ul>
        </nav>
      )}
      <main className={showSidebar ? 'jug-ai-main with-sidebar' : 'jug-ai-main'}>
        {renderPage()}
      </main>
    </div>
  );
}
