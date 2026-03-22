import { useState, useEffect, useCallback } from '@wordpress/element';
import api from './api';
import Header from './components/shared/Header';
import Footer from './components/shared/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ConversationsPage from './pages/ConversationsPage';
import SettingsPage from './pages/SettingsPage';
import AuthModal from './pages/AuthModal';
import OnboardingModal from './components/onboarding/OnboardingModal';

function getRoute(): string {
  const hash = window.location.hash.replace('#', '') || '/';
  return hash;
}

function loadUser(): { name: string; email: string } | null {
  const cfg = window.jugAiConfig;
  if (cfg?.userName || cfg?.userEmail) {
    return { name: cfg.userName || '', email: cfg.userEmail || '' };
  }
  return null;
}

export default function App() {
  const [route, setRoute] = useState(getRoute());
  const [isLoggedIn, setIsLoggedIn] = useState(window.jugAiConfig?.isLoggedIn || false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(loadUser);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [showHome, setShowHome] = useState(!isLoggedIn);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  /** WordPress REST returned 401/403 (expired nonce or lost Jug session). Open OTP modal; do not use nonexistent #/login route. */
  useEffect(() => {
    const onRestUnauthorized = () => {
      setIsLoggedIn(false);
      if (window.jugAiConfig) {
        window.jugAiConfig.isLoggedIn = false;
        window.jugAiConfig.userName = '';
        window.jugAiConfig.userEmail = '';
      }
      setUser(null);
      setShowAuth(true);
    };
    window.addEventListener('jug-ai:rest-unauthorized', onRestUnauthorized);
    return () => window.removeEventListener('jug-ai:rest-unauthorized', onRestUnauthorized);
  }, []);

  const handleGetStarted = (url: string) => {
    setOnboardingUrl(url);
    setShowOnboarding(true);
  };

  const openOnboarding = () => {
    setOnboardingUrl('');
    setShowOnboarding(true);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingUrl('');
  };

  const handleAuthRequired = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleLogin = useCallback((name: string, email: string) => {
    setShowAuth(false);
    setIsLoggedIn(true);
    setUser({ name, email });
    setShowHome(false);
    window.jugAiConfig.isLoggedIn = true;
    window.jugAiConfig.userName = name;
    window.jugAiConfig.userEmail = email;
    closeOnboarding();
    window.location.hash = '#/dashboard';
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await api.post('auth/logout');
    } catch (_) { /* proceed even if request fails */ }
    setIsLoggedIn(false);
    setUser(null);
    setShowHome(true);
    window.jugAiConfig.isLoggedIn = false;
    window.jugAiConfig.userName = '';
    window.jugAiConfig.userEmail = '';
    window.location.hash = '#/';
  }, []);

  const handleCloseAuth = useCallback(() => {
    setShowAuth(false);
  }, []);

  if (showHome && !isLoggedIn) {
    return (
      <div className="jug-ai-app jug-ai-app-header-layout">
        <Header
          isLoggedIn={false}
          user={null}
          onLoginClick={handleAuthRequired}
          onLogout={handleLogout}
        />
        <HomePage onGetStarted={handleGetStarted} />
        <Footer />
        {showOnboarding && (
          <OnboardingModal
            initialUrl={onboardingUrl}
            onClose={closeOnboarding}
            onAuthRequired={handleAuthRequired}
          />
        )}
        {showAuth && (
          <AuthModal onLogin={handleLogin} onClose={handleCloseAuth} asModal />
        )}
      </div>
    );
  }

  const renderPage = () => {
    if (route.startsWith('/conversations')) return <ConversationsPage route={route} />;
    if (route.startsWith('/settings')) return <SettingsPage />;
    return (
      <DashboardPage
        onOpenOnboarding={openOnboarding}
        onConnectJug={() => setShowAuth(true)}
      />
    );
  };

  return (
    <div className="jug-ai-app jug-ai-app-header-layout">
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginClick={handleAuthRequired}
        onLogout={handleLogout}
      />

      <main className="jug-ai-main">
        {renderPage()}
      </main>

      <Footer />

      {showOnboarding && (
        <OnboardingModal
          initialUrl={onboardingUrl}
          onClose={closeOnboarding}
          onAuthRequired={handleAuthRequired}
        />
      )}

      {showAuth && (
        <AuthModal onLogin={handleLogin} onClose={handleCloseAuth} asModal />
      )}
    </div>
  );
}
