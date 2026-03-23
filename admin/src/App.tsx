import { useState, useEffect, useCallback } from '@wordpress/element';
import api from './api';
import { normalizeBotsPayload } from './utils/normalizeBots';
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
  /** Check wp_options site_name or active_bot_uuid to decide if the site is already configured. */
  const [siteConfigured, setSiteConfigured] = useState<boolean>(
    !!(window.jugAiConfig?.settings?.site_name || window.jugAiConfig?.settings?.active_bot_uuid)
  );

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  /** Re-read site_name / active_bot_uuid from the live jugAiConfig / wp_options mirror. */
  const checkSiteConfigured = useCallback(() => {
    setSiteConfigured(!!(window.jugAiConfig?.settings?.site_name || window.jugAiConfig?.settings?.active_bot_uuid));
  }, []);

  /** On mount, if logged in and site is configured, auto-redirect to dashboard. */
  useEffect(() => {
    if (isLoggedIn && siteConfigured) {
      const currentRoute = getRoute();
      if (currentRoute === '/' || currentRoute === '') {
        window.location.hash = '#/dashboard';
      }
    }
  }, [isLoggedIn, siteConfigured]);

  /**
   * When logged in but wp_options has no site_name / active_bot_uuid,
   * ask the API whether bots already exist and sync wp_options if so.
   */
  useEffect(() => {
    if (!isLoggedIn || siteConfigured) return;

    let cancelled = false;
    api.get('bots')
      .then((data: unknown) => {
        if (cancelled) return;
        const list = normalizeBotsPayload(data);
        if (list.length === 0) return;

        const bot = list[0];
        const siteName = bot.name || bot.site_url || '';
        const botUuid = bot.chatbot_uuid || bot.agent_uuid || bot.uuid || '';

        // Persist to wp_options so future page loads detect the configured site
        const payload: Record<string, unknown> = {};
        if (siteName) payload.site_name = siteName;
        if (botUuid) payload.active_bot_uuid = botUuid;

        if (Object.keys(payload).length) {
          api.post('settings', payload).catch(() => {});
          if (window.jugAiConfig?.settings) {
            if (siteName) window.jugAiConfig.settings.site_name = siteName;
            if (botUuid) window.jugAiConfig.settings.active_bot_uuid = botUuid;
          }
        }

        setSiteConfigured(true);
        setShowHome(false);
        window.location.hash = '#/dashboard';
      })
      .catch(() => {
        // API call failed — stay on current view
      });
    return () => { cancelled = true; };
  }, [isLoggedIn, siteConfigured]);

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
    // If site is already configured, go to dashboard instead of re-running onboarding
    if (siteConfigured) {
      if (isLoggedIn) {
        window.location.hash = '#/dashboard';
      }
      return;
    }
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
    // Re-check — user may have just created a site during onboarding
    if (isLoggedIn) {
      checkSiteConfigured();
    }
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

    // Notify any listening onboarding step that auth succeeded
    window.dispatchEvent(new CustomEvent('jug-ai:auth-success'));

    // If onboarding is open, keep it open (user may have logged in mid-flow)
    if (showOnboarding) {
      return;
    }

    // Check wp_options site_name / active_bot_uuid to decide where to route
    const hasSite = !!(window.jugAiConfig?.settings?.site_name || window.jugAiConfig?.settings?.active_bot_uuid);
    setSiteConfigured(hasSite);
    window.location.hash = hasSite ? '#/dashboard' : '#/';
  }, [showOnboarding]);

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
        <HomePage onGetStarted={handleGetStarted} siteConfigured={siteConfigured} isLoggedIn={false} onLoginClick={handleAuthRequired} />
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
    if (route === '/' || route === '') {
      return <HomePage onGetStarted={handleGetStarted} siteConfigured={siteConfigured} isLoggedIn={true} />;
    }
    if (route.startsWith('/conversations')) return <ConversationsPage route={route} />;
    if (route.startsWith('/settings')) return <SettingsPage />;
    return (
      <DashboardPage
        onOpenOnboarding={openOnboarding}
        onConnectJug={() => setShowAuth(true)}
        onSiteDeleted={() => {
          setSiteConfigured(false);
          window.location.hash = '#/';
        }}
      />
    );
  };

  return (
    <div className="jug-ai-app jug-ai-app-header-layout">
      <Header
        isLoggedIn={isLoggedIn}
        user={user}
        route={route}
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
