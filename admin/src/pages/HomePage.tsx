import FeaturesSidebar from '../components/shared/FeaturesSidebar';

interface Props {
  onGetStarted: (url: string) => void;
  siteConfigured?: boolean;
}

function getDefaultHeroUrl(): string {
  const c = window.jugAiConfig;
  return (c?.defaultTrainingUrl || c?.siteUrl || '').trim();
}

export default function HomePage({ onGetStarted, siteConfigured }: Props) {
  const siteName = window.jugAiConfig?.settings?.site_name || '';

  return (
    <div className="jug-home">
      <div className="jug-home-columns">
        {/* Main content */}
        <div className="jug-home-main">
          <div className="jug-home-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            WordPress AI Chatbot
          </div>

          <h1 className="jug-home-hero-title">
            Your website,<br />
            now with an<br />
            <span className="jug-home-green">AI Agent</span>
          </h1>

          <p className="jug-home-hero-subtitle">
            Enter your URL and go live in minutes. We'll scrape your site, train an AI chatbot,
            and give you a one-line embed. No coding required.
          </p>

          <div className="jug-home-hero-form">
            {siteConfigured ? (
              <div className="jug-home-configured-block">
                <p className="jug-home-configured-text">
                  {siteName
                    ? <>Your bot for <strong>{siteName}</strong> is live and ready.</>
                    : <>Your AI chatbot is live and ready.</>}
                </p>
                <a href="#/dashboard" className="jug-home-cta-btn">
                  Go to Bot
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>
            ) : (
              <button type="button" className="jug-home-cta-btn" onClick={() => onGetStarted(getDefaultHeroUrl())}>
                Get Started Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
          </div>

          <div className="jug-home-trust">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Free — first 500 chats
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              No credit card needed
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Setup in 2 minutes
            </span>
          </div>
        </div>

        <FeaturesSidebar />
      </div>
    </div>
  );
}
