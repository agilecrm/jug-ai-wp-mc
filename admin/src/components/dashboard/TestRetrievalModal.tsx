import { useState, useEffect } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface RetrievalResult {
  text: string;
  score: number;
  metadata: {
    title?: string;
    url?: string;
    type?: string;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  trainingUuid: string | null;
  embeddingType?: string;
}

export default function TestRetrievalModal({ open, onClose, trainingUuid, embeddingType = 'free' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RetrievalResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setError('');
    }
  }, [open]);

  function handleSubmit() {
    if (!trainingUuid || !query.trim()) return;
    setLoading(true);
    setError('');
    api.testRetrieval(trainingUuid, query.trim(), 10, embeddingType)
      .then((data) => {
        setResults(Array.isArray(data) ? data : data?.results || []);
      })
      .catch((err: Error) => {
        setError(err.message || 'Search failed');
        setResults(null);
      })
      .finally(() => setLoading(false));
  }

  if (!open) return null;

  return (
    <div className="jug-ai-modal-overlay" onClick={onClose}>
      <div className="jug-ai-modal jug-ai-modal-lg jug-test-retrieval-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jug-ai-modal-header">
          <div>
            <h3>Test Retrieval</h3>
            <p className="jug-ai-muted" style={{ margin: '4px 0 0' }}>Test how well the model retrieves relevant training data for a given query.</p>
          </div>
          <button type="button" className="jug-ai-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="jug-test-retrieval-body">
          <textarea
            className="jug-ai-textarea"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query..."
            rows={3}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              className="jug-ai-btn-primary"
              onClick={handleSubmit}
              disabled={loading || !query.trim()}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {loading ? (
                <Spinner size={14} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
              Search
            </button>
          </div>

          {error && <p className="jug-ai-error">{error}</p>}

          {results !== null && (
            <div className="jug-test-retrieval-results">
              {results.length === 0 ? (
                <p className="jug-ai-muted" style={{ textAlign: 'center', padding: '32px 0' }}>No results found.</p>
              ) : (
                results.map((result, i) => (
                  <div key={i} className="jug-test-retrieval-item">
                    <p className="jug-test-retrieval-text">{result.text}</p>
                    {result.metadata?.title && (
                      <p className="jug-ai-muted" style={{ fontSize: '12px' }}>
                        <strong>Title:</strong> {result.metadata.title}
                      </p>
                    )}
                    {result.metadata?.url && (
                      <p className="jug-ai-muted jug-test-retrieval-url" style={{ fontSize: '12px' }}>
                        <strong>URL:</strong>{' '}
                        <a href={result.metadata.url} target="_blank" rel="noopener noreferrer">{result.metadata.url}</a>
                      </p>
                    )}
                    <div className="jug-test-retrieval-item-footer">
                      {result.metadata?.type && <span className="jug-training-info-badge">{result.metadata.type}</span>}
                      <span className="jug-training-info-badge jug-training-info-badge-outline">
                        Score: {result.score.toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
