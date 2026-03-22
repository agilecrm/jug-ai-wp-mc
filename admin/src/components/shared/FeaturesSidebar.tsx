export default function FeaturesSidebar() {
  return (
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
  );
}
