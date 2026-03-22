import { useState } from '@wordpress/element';

interface Props {
  onGetStarted: (url: string) => void;
}

function getDefaultHeroUrl(): string {
  const c = window.jugAiConfig;
  return (c?.defaultTrainingUrl || c?.siteUrl || '').trim();
}

export default function HomePage({ onGetStarted }: Props) {
  const [url, setUrl] = useState(getDefaultHeroUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onGetStarted(url.trim());
    }
  };

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

          <form className="jug-home-hero-form" onSubmit={handleSubmit}>
            <div className="jug-home-url-input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.4 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <input
                type="text"
                className="jug-home-url-input"
                value={url}
                onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
                placeholder="https://example.com"
                required
              />
            </div>
            <button type="submit" className="jug-home-cta-btn">
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

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
              Setup in 5 minutes
            </span>
          </div>
        </div>

        {/* Right sidebar features */}
        <div className="jug-home-sidebar">
          <p className="jug-home-sidebar-title">What you get</p>
          <div className="jug-home-features">
            <div className="jug-home-feature-card">
              <div className="jug-home-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div>
                <h4>Auto Website Scraping</h4>
                <p>We crawl your pages and learn your content automatically.</p>
              </div>
            </div>
            <div className="jug-home-feature-card">
              <div className="jug-home-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h4>AI-Powered Chatbot</h4>
                <p>Answers visitor questions with your own knowledge base.</p>
              </div>
            </div>
            <div className="jug-home-feature-card">
              <div className="jug-home-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div>
                <h4>One-Line Embed</h4>
                <p>Add the chatbot to any website with a single script tag.</p>
              </div>
            </div>
            <div className="jug-home-feature-card">
              <div className="jug-home-feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div>
                <h4>Conversation Analytics</h4>
                <p>Track sessions, messages, and visitor engagement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
