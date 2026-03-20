import { useState, useEffect, useRef } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface Props {
  website: string;
  urls: string[];
  onNext: () => void;
  onBack: () => void;
}

export default function StepScraping({ website, urls, onNext, onBack }: Props) {
  const [phase, setPhase] = useState<'scraping' | 'training' | 'done'>('scraping');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Starting...');
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    startScraping();
    return () => { abortRef.current?.abort(); };
  }, []);

  const connectStream = async (streamPath: string, onMessage: (data: any) => void): Promise<void> => {
    const { url, token } = await api.streamUrl(streamPath);
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream failed (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            onMessage(parsed);
          } catch {
            // skip non-JSON lines
          }
        }
      }
    }
  };

  const startScraping = async () => {
    try {
      setPhase('scraping');
      setProgress(0);
      setStatus('Scraping your website...');

      await connectStream('scrape/stream-url', (data) => {
        if (data.progress !== undefined) setProgress(Math.round(data.progress * 100));
        if (data.status) setStatus(data.status);
        if (data.url_count) setStatus(`Scraped ${data.url_count} pages...`);
      });

      setProgress(100);
      setStatus('Scraping complete. Starting training...');
      await startTraining();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Scraping failed.');
      }
    }
  };

  const startTraining = async () => {
    try {
      setPhase('training');
      setProgress(0);
      setStatus('Training your AI model...');

      await connectStream('training/stream-url', (data) => {
        if (data.progress !== undefined) setProgress(Math.round(data.progress * 100));
        if (data.status) setStatus(data.status);
      });

      setPhase('done');
      setProgress(100);
      setStatus('Training complete!');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Training failed.');
      }
    }
  };

  return (
    <div className="jug-ai-step">
      <h3>{phase === 'training' ? 'Training AI Model' : phase === 'done' ? 'Complete' : 'Scraping Website'}</h3>

      <div className="jug-ai-progress">
        <div className="jug-ai-progress-bar">
          <div className="jug-ai-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="jug-ai-progress-text">{progress}%</span>
      </div>

      <p className="jug-ai-status">{status}</p>

      {error && <p className="jug-ai-error">{error}</p>}

      {phase !== 'done' && !error && (
        <div className="jug-ai-center"><Spinner /></div>
      )}

      <div className="jug-ai-step-actions">
        <button type="button" className="jug-ai-btn-secondary" onClick={onBack}>
          Back
        </button>
        {phase === 'done' && (
          <button type="button" className="jug-ai-btn-primary" onClick={onNext}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
