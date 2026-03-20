import { useState } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface Props {
  website: string;
  onWebsiteChange: (url: string) => void;
  onUrlsDiscovered: (urls: string[]) => void;
  onCompanyInfo: (info: any) => void;
  onNext: () => void;
}

export default function StepWebsite({ website, onWebsiteChange, onUrlsDiscovered, onCompanyInfo, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [urlCount, setUrlCount] = useState(0);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setError('');
    setLoading(true);

    try {
      const [analysis, discovery] = await Promise.all([
        api.post('scrape/analyze', { website }),
        api.post('scrape/discover', { website }),
      ]);

      setCompanyInfo(analysis);
      onCompanyInfo(analysis);

      const discoveredUrls = discovery.urls || discovery || [];
      const urlList = Array.isArray(discoveredUrls) ? discoveredUrls : [];
      setUrlCount(urlList.length);
      onUrlsDiscovered(urlList);
      setAnalyzed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze website.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jug-ai-step">
      <h3>Enter Your Website URL</h3>
      <p>We'll analyze your site to set up the AI chatbot.</p>

      <div className="jug-ai-field">
        <label htmlFor="jug-website">Website URL</label>
        <input
          id="jug-website"
          type="url"
          value={website}
          onChange={(e) => onWebsiteChange((e.target as HTMLInputElement).value)}
          placeholder="https://example.com"
        />
      </div>

      {!analyzed && (
        <button
          type="button"
          className="jug-ai-btn-primary"
          onClick={handleAnalyze}
          disabled={loading || !website}
        >
          {loading ? <Spinner size={18} /> : 'Analyze Website'}
        </button>
      )}

      {error && <p className="jug-ai-error">{error}</p>}

      {analyzed && companyInfo && (
        <div className="jug-ai-card">
          <h4>Website Analysis</h4>
          {companyInfo.name && <p><strong>Company:</strong> {companyInfo.name}</p>}
          {companyInfo.description && <p><strong>Description:</strong> {companyInfo.description}</p>}
          {companyInfo.industry && <p><strong>Industry:</strong> {companyInfo.industry}</p>}
          <p><strong>Pages discovered:</strong> {urlCount}</p>
        </div>
      )}

      {analyzed && (
        <div className="jug-ai-step-actions">
          <button type="button" className="jug-ai-btn-primary" onClick={onNext}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
