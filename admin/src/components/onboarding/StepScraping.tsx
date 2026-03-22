import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { useOnboarding } from '../../context/OnboardingContext';
import api from '../../api';
import Spinner from '../shared/Spinner';

type TrainingStep = 'processing' | 'embedding' | 'creating_bot' | null;

const PIPELINE_STEPS = [
  { key: 'scraping', label: 'Scraping pages' },
  { key: 'processing', label: 'Processing content' },
  { key: 'embedding', label: 'Embedding knowledge' },
  { key: 'creating_bot', label: 'Creating bot' },
] as const;

const MAX_PAGES = 25;

function getDomain(raw: string): string {
  try {
    const u = raw.startsWith('http') ? raw : `https://${raw}`;
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return raw.trim().toLowerCase();
  }
}

function getStepOrder(
  phase: 'idle' | 'scraping' | 'training' | 'complete',
  trainingStep: TrainingStep
): number {
  if (phase === 'complete') return 4;
  if (phase === 'scraping') return 0;
  const order = ['scraping', 'processing', 'embedding', 'creating_bot'];
  return trainingStep ? order.indexOf(trainingStep) : 1;
}

async function connectStream(
  url: string,
  token: string,
  body: Record<string, any>,
  onEvent: (data: Record<string, any>) => void,
  signal: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Stream failed (${res.status}): ${errBody}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) return;
    let jsonStr = trimmed;
    if (trimmed.startsWith('data:')) {
      jsonStr = trimmed.slice(trimmed.startsWith('data: ') ? 6 : 5);
    }
    if (!jsonStr || jsonStr === '[DONE]') return;
    try { onEvent(JSON.parse(jsonStr)); } catch { /* skip */ }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) processLine(line);
  }
  if (buffer.trim()) processLine(buffer);
}

export default function StepScraping() {
  const {
    websiteUrl, fingerprint, siteUuid,
    companyInfo, editedSummary,
    scrapedPages, addScrapedPage, setScrapedUrls,
    setBotUuid, completeStep, setStep,
  } = useOnboarding();

  const [phase, setPhase] = useState<'idle' | 'scraping' | 'training' | 'complete'>('idle');
  const [trainingStep, setTrainingStep] = useState<TrainingStep>(null);
  const [trainingDetail, setTrainingDetail] = useState('');
  const [error, setError] = useState('');
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0 });
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrapedPages]);

  const startPipeline = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // ── Step 1: Scrape ──
      setPhase('scraping');
      const { url: scrapeUrl, token: scrapeToken } = await api.scrapeStreamUrl();

      let finalUrls: string[] = [];
      await connectStream(scrapeUrl, scrapeToken, {
        website: websiteUrl,
        max_count: MAX_PAGES,
        depth: 3,
        finger_print: fingerprint,
      }, (data) => {
        if (data.status === 'complete' && Array.isArray(data.urls)) {
          finalUrls = data.urls;
          return;
        }
        if (data.status === 'started') return;

        const pageUrl = data.current_url || data.url;
        const pageTitle = data.title || '';
        if (pageUrl) {
          addScrapedPage({ url: pageUrl, title: pageTitle || pageUrl });
        }
      }, controller.signal);

      if (finalUrls.length === 0) {
        finalUrls = scrapedPages.map((p) => p.url);
      }
      setScrapedUrls(finalUrls);

      // ── Step 2+3: Training ──
      setPhase('training');
      setTrainingStep('processing');
      setTrainingDetail('Fetching page content...');

      const { url: trainUrl, token: trainToken } = await api.trainingStreamUrl(siteUuid);
      await connectStream(trainUrl, trainToken, {
        urls: finalUrls,
        fingerprint,
        chunk_size: 500,
        overlap: 100,
        embedding_type: 'free',
        training_type: 'basic',
      }, (data) => {
        const tp = data.total_progress as string | undefined;
        if (!tp) return;

        switch (tp) {
          case 'Fetching URLs': {
            setTrainingStep('processing');
            const fc = (data.fetch_current as number) ?? 0;
            const ft = (data.fetch_total as number) ?? 0;
            setFetchProgress({ current: fc, total: ft });
            setTrainingDetail(fc > 0 ? `Fetching content (${fc}/${ft})` : `Fetching content from ${ft} pages...`);
            break;
          }
          case 'URLs fetched':
            setTrainingStep('processing');
            setTrainingDetail('Content fetched');
            break;
          case 'Preprocessing Data':
            setTrainingStep('processing');
            setTrainingDetail((data.path as string) || 'Chunking documents...');
            break;
          case 'Embedding Started':
            setTrainingStep('embedding');
            setTrainingDetail('Embedding knowledge...');
            break;
          case 'Embeddings Processed':
            setTrainingStep('embedding');
            setTrainingDetail('Embeddings complete');
            break;
          case 'Adding images': {
            setTrainingStep('embedding');
            const cur = (data.image_current as number) ?? 0;
            const tot = (data.image_total as number) ?? 0;
            setImageProgress({ current: cur, total: tot });
            setTrainingDetail(cur > 0 ? `Adding images (${cur}/${tot})` : `Adding images from ${tot} pages...`);
            break;
          }
          case 'Images processed':
            setTrainingStep('embedding');
            setTrainingDetail(`${(data.images_stored as number) ?? 0} images added`);
            break;
        }
      }, controller.signal);

      // ── Step 4: Create bot ──
      setTrainingStep('creating_bot');
      setTrainingDetail('Creating your bot...');

      const domain = getDomain(websiteUrl);
      const botName = companyInfo?.name || 'AI Assistant';
      const prompt = editedSummary
        || 'You are an intelligent AI agent for this website. You can help users complete tasks, answer questions, and provide recommendations based on the website content.';

      const botResult = await api.post('bots', {
        name: botName,
        prompt,
        trainingSites: [siteUuid],
        type: 'agent',
        fingerprint,
        domain,
      });

      if (botResult?.uuid) {
        setBotUuid(botResult.uuid);
      }

      setPhase('complete');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Pipeline failed.');
      }
    }
  }, [websiteUrl, fingerprint, siteUuid, companyInfo, editedSummary, addScrapedPage, setScrapedUrls, setBotUuid]);

  useEffect(() => {
    startPipeline();
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleContinue = () => {
    completeStep(1);
    setStep(2);
  };

  // ── Progress calculation (matches reference) ──
  const currentStepOrder = getStepOrder(phase, trainingStep);

  const progressValue = (() => {
    const seg = 100 / (PIPELINE_STEPS.length - 1);
    if (phase === 'complete') return 100;
    if (phase === 'scraping') {
      return Math.min(Math.round((scrapedPages.length / MAX_PAGES) * seg), Math.round(seg));
    }
    switch (trainingStep) {
      case 'processing': {
        if (fetchProgress.total > 0) {
          return Math.round(seg + (fetchProgress.current / fetchProgress.total) * seg);
        }
        return Math.round(seg + 2);
      }
      case 'embedding': {
        const base = seg * 2;
        const range = seg * 0.85;
        if (imageProgress.total > 0) {
          return Math.round(base + (imageProgress.current / imageProgress.total) * range);
        }
        return Math.round(base);
      }
      case 'creating_bot':
        return 95;
      default:
        return Math.round(seg + 2);
    }
  })();

  const buttonLabel = (() => {
    if (phase === 'complete') return null;
    if (phase === 'scraping') return 'Scraping...';
    switch (trainingStep) {
      case 'processing': return 'Processing...';
      case 'embedding': return 'Embedding...';
      case 'creating_bot': return 'Creating bot...';
      default: return 'Training...';
    }
  })();

  return (
    <div className="jug-step-layout">
      <div className="jug-step-body">
        <div className="jug-step-header">
          <h2>Scrape &amp; train your website</h2>
          <span className="jug-step-badge">Auto crawl &amp; train</span>
        </div>
        <p className="jug-step-subtitle">
          We'll automatically scrape your website pages and train your bot on the content.
        </p>

        {phase !== 'idle' && (
          <div className="jug-pipeline">
            <div className="jug-pipeline-bar">
              <div className="jug-pipeline-bar-track">
                <div
                  className="jug-pipeline-bar-fill"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <div className="jug-pipeline-dots">
                {PIPELINE_STEPS.map((step, idx) => {
                  const pos = (idx / (PIPELINE_STEPS.length - 1)) * 100;
                  const isCompleted = idx < currentStepOrder;
                  const isActive = idx === currentStepOrder && phase !== 'complete';
                  return (
                    <span
                      key={step.key}
                      className={`jug-pipeline-dot ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                      style={{ left: `${pos}%` }}
                    >
                      {isCompleted ? '✓' : ''}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="jug-pipeline-labels">
              {PIPELINE_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepOrder || phase === 'complete';
                const isActive = idx === currentStepOrder && phase !== 'complete';
                return (
                  <span
                    key={step.key}
                    className={`jug-pipeline-label ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  >
                    {step.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'training' && trainingDetail && (
          <p className="jug-ai-status">{trainingDetail}</p>
        )}

        <div className="jug-ai-card jug-scrape-urls-card">
          <div className="jug-scrape-urls-header">
            <strong>Pages ({scrapedPages.length})</strong>
            <span className="jug-scrape-urls-count">
              {phase === 'scraping' && <Spinner size={14} />}
              {(phase === 'complete' || phase === 'training') && (
                <span className="jug-scrape-urls-check">✓</span>
              )}
            </span>
          </div>
          <div className="jug-scrape-urls-list">
            {scrapedPages.map((page, i) => (
              <div key={i} className="jug-scrape-url-row">
                <span className="jug-scrape-url-num">{i + 1}</span>
                <div className="jug-scrape-url-info">
                  <span className="jug-scrape-url-title">{page.title || page.url}</span>
                  <span className="jug-scrape-url-link">{page.url}</span>
                </div>
              </div>
            ))}
            {scrapedPages.length === 0 && (phase === 'scraping' || phase === 'idle') && (
              <div className="jug-scrape-urls-empty">
                <Spinner size={20} />
                <span>Discovering pages...</span>
              </div>
            )}
            <div ref={listEndRef} />
          </div>
        </div>

        {error && <p className="jug-ai-error">{error}</p>}
      </div>

      <div className="jug-step-footer">
        <button
          type="button"
          className="jug-ai-btn-primary"
          onClick={handleContinue}
          disabled={phase !== 'complete'}
        >
          {buttonLabel ? (
            <>
              <Spinner size={16} />
              <span>{buttonLabel}</span>
            </>
          ) : (
            'Continue →'
          )}
        </button>
      </div>
    </div>
  );
}
