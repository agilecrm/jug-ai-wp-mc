import { useState, useEffect, useRef } from '@wordpress/element';
import { useOnboarding } from '../../context/OnboardingContext';
import api from '../../api';
import { normalizeBotsPayload } from '../../utils/normalizeBots';
import Spinner from '../shared/Spinner';

function domainOf(raw: string): string {
  try {
    const u = raw.startsWith('http') ? raw : `https://${raw}`;
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

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
    close,
  } = useOnboarding();

  const isLocalDev = (url: string) => /localhost|127\.0\.0\.1/.test(url);
  const rawDefault = window.jugAiConfig?.defaultTrainingUrl || window.jugAiConfig?.siteUrl || '';
  // In dev (localhost), default to attio.com for a meaningful demo
  const rawUrl = websiteUrl || rawDefault || '';
  const siteUrl = rawUrl && !isLocalDev(rawUrl) ? rawUrl : 'https://attio.com';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const autoTriggered = useRef(false);

  /** If the user already has this site configured, skip the whole onboarding. */
  const [existingSiteName, setExistingSiteName] = useState<string | null>(null);
  const existingCheckDone = useRef(false);

  useEffect(() => {
    if (existingCheckDone.current) return;
    existingCheckDone.current = true;
    if (!window.jugAiConfig?.isLoggedIn) return;

    const targetDomain = domainOf(siteUrl);
    api.get('bots')
      .then((data: unknown) => {
        const bots = normalizeBotsPayload(data);
        const match = bots.find((b) => {
          const botDomain = domainOf(b.site_url || b.name || '');
          return botDomain === targetDomain;
        });
        if (match) {
          setExistingSiteName(match.name || match.site_url || siteUrl);
        }
      })
      .catch(() => { /* ignore — proceed with normal flow */ });
  }, [siteUrl]);

  const handleAnalyze = async () => {
    setError('');
    const url = siteUrl.trim().startsWith('http') ? siteUrl.trim() : `https://${siteUrl.trim()}`;
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
    if (!companyInfo && !autoTriggered.current && siteUrl.trim()) {
      autoTriggered.current = true;
      const url = siteUrl.trim().startsWith('http') ? siteUrl.trim() : `https://${siteUrl.trim()}`;
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
          We'll analyze your site and go live in minutes. No setup needed.
        </p>

        <div className="jug-step-form-row">
          <div className="jug-ai-field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Website URL</label>
            <div className="jug-step-url-input jug-step-url-readonly">
              <span className="jug-step-url-icon">🌐</span>
              <span className="jug-step-url-value">{siteUrl}</span>
            </div>
          </div>
        </div>

        {error && <p className="jug-ai-error">{error}</p>}

        {existingSiteName && (
          <div className="jug-ai-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px' }}>
              Your bot for <strong>{existingSiteName}</strong> is already configured.
            </p>
            <p className="jug-ai-muted" style={{ margin: '0 0 16px' }}>
              You can manage it from the dashboard.
            </p>
            <a
              href="#/dashboard"
              className="jug-ai-btn-primary"
              onClick={() => close()}
            >
              Go to Dashboard →
            </a>
          </div>
        )}

        {loading && !existingSiteName && (
          <div className="jug-ai-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Spinner size={28} />
            <p className="jug-ai-muted" style={{ marginTop: 12 }}>
              Scraping and analyzing your website...
            </p>
          </div>
        )}

        {companyInfo && !loading && !existingSiteName && (
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

      {!existingSiteName && (
        <div className="jug-step-footer">
          <button type="button" className="jug-ai-btn-primary" onClick={handleContinue} disabled={!canContinue}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
