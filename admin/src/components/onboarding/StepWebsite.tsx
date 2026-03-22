import { useState, useEffect, useRef } from '@wordpress/element';
import { useOnboarding } from '../../context/OnboardingContext';
import api from '../../api';
import Spinner from '../shared/Spinner';

export default function StepWebsite() {
  const {
    websiteUrl,
    companyInfo,
    editedSummary,
    setWebsiteUrl,
    setCompanyInfo,
    setEditedSummary,
    setDiscoveredUrls,
    completeStep,
    setStep,
  } = useOnboarding();

  const siteUrl =
    websiteUrl
    || window.jugAiConfig?.defaultTrainingUrl
    || window.jugAiConfig?.siteUrl
    || 'https://attio.com';
  const [inputUrl, setInputUrl] = useState(siteUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const autoTriggered = useRef(false);

  const handleAnalyze = async () => {
    setError('');
    const url = inputUrl.trim().startsWith('http') ? inputUrl.trim() : `https://${inputUrl.trim()}`;
    setWebsiteUrl(url);
    setLoading(true);

    try {
      const [analysis, discovery] = await Promise.all([
        api.post('scrape/analyze', { website: url }),
        api.post('scrape/discover', { website: url }),
      ]);

      setCompanyInfo({
        name: analysis.name || analysis.company_name || '',
        description: analysis.description || '',
        industry: analysis.industry || '',
        summary: analysis.summary || analysis.description || '',
      });

      const discoveredUrls = discovery.urls || discovery || [];
      setDiscoveredUrls(Array.isArray(discoveredUrls) ? discoveredUrls : []);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze website.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyInfo && !autoTriggered.current && inputUrl.trim()) {
      autoTriggered.current = true;
      const url = inputUrl.trim().startsWith('http') ? inputUrl.trim() : `https://${inputUrl.trim()}`;
      setWebsiteUrl(url);
      handleAnalyze();
    }
  }, []);

  const handleContinue = () => {
    completeStep(0);
    setStep(1);
  };

  const canContinue = !!companyInfo;

  return (
    <div className="jug-step-layout">
      <div className="jug-step-body">
        <div className="jug-step-header">
          <h2>Your website, now with an AI Agent</h2>
          <span className="jug-step-badge">Free — first 500 chats</span>
        </div>
        <p className="jug-step-subtitle">
          Enter your URL and go live in minutes. No setup needed.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="jug-step-form-row"
        >
          <div className="jug-ai-field" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="jug-onb-url">Website URL</label>
            <div className="jug-step-url-input">
              <span className="jug-step-url-icon">🌐</span>
              <input
                id="jug-onb-url"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl((e.target as HTMLInputElement).value)}
                placeholder="yourcompany.com"
                required
              />
            </div>
          </div>
        </form>

        {error && <p className="jug-ai-error">{error}</p>}

        {loading && (
          <div className="jug-ai-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spinner size={28} />
            <p className="jug-ai-muted" style={{ marginTop: 12 }}>
              Scraping and analyzing your website...
            </p>
          </div>
        )}

        {companyInfo && !loading && (
          <div className="jug-ai-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>
                  {companyInfo.name}
                </h4>
                <p className="jug-ai-muted" style={{ margin: 0 }}>
                  {companyInfo.description}
                </p>
              </div>
              {companyInfo.industry && (
                <span className="jug-ai-badge jug-ai-badge-ready">{companyInfo.industry}</span>
              )}
            </div>

            <div className="jug-ai-field" style={{ marginTop: 16, marginBottom: 0 }}>
              <label htmlFor="jug-summary">AI Summary</label>
              <textarea
                id="jug-summary"
                value={editedSummary}
                onChange={(e) => setEditedSummary((e.target as HTMLTextAreaElement).value)}
                rows={5}
                className="jug-ai-textarea"
              />
              <small className="jug-ai-muted">
                Edit the summary if needed — it will guide your chatbot's responses.
              </small>
            </div>
          </div>
        )}
      </div>

      {canContinue && (
        <div className="jug-step-footer">
          <button type="button" className="jug-ai-btn-primary" onClick={handleContinue}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
