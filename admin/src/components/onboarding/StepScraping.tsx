import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { useOnboarding } from '../../context/OnboardingContext';
import api from '../../api';
import Spinner from '../shared/Spinner';

type TrainingStep = 'processing' | 'embedding' | 'creating_bot' | null;
type Phase = 'idle' | 'scraping' | 'training' | 'awaiting_auth' | 'creating_bot_post_auth' | 'complete';

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
  phase: Phase,
  trainingStep: TrainingStep
): number {
  if (phase === 'complete') return 4;
  if (phase === 'awaiting_auth') return 3;
  if (phase === 'creating_bot_post_auth') return 3;
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
    scrapedPages, scrapedUrls, addScrapedPage, setScrapedUrls,
    setBotUuid, setAgentBotUuid, completeStep, setStep,
    onAuthRequired,
  } = useOnboarding();

  const [phase, setPhase] = useState<Phase>('idle');
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

      // ── Step 4: Create bot (requires Jug auth) ──
      if (!window.jugAiConfig?.isLoggedIn) {
        // Pause here — user needs to sign in before we can create the bot
        setPhase('awaiting_auth');
        setTrainingStep(null);
        setTrainingDetail('');
        onAuthRequired();
        return;
      }

      await createBotAndSave(finalUrls);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Pipeline failed.');
      }
    }
  }, [websiteUrl, fingerprint, siteUuid, companyInfo, editedSummary, addScrapedPage, setScrapedUrls, setBotUuid]);

  const createBotAndSave = useCallback(async (urlsOverride?: string[]) => {
    const urls = urlsOverride ?? scrapedUrls;
    setPhase('creating_bot_post_auth');
    setTrainingStep('creating_bot');
    setTrainingDetail('Creating your bots...');

    const domain = getDomain(websiteUrl);
    const botName = companyInfo?.name || 'AI Assistant';
    const chatbotPrompt = editedSummary
      || 'You are a helpful AI assistant for this website. Answer questions based on the website content. Be concise, friendly, and helpful.';
    const agentPromptText = editedSummary
      || 'You are an intelligent AI agent for this website. You can help users complete tasks, answer questions, and provide recommendations based on the website content.';

    // Save users.sites via PUT /profile
    try {
      await api.put('profile', {
        key: 'sites',
        value: [{
          uuid: siteUuid,
          url: websiteUrl,
          scrapped_urls: urls,
          count: urls.length,
          embedding_type: 'free',
          chunkingSize: '500',
          overlap: '100',
          trainingType: 'basic',
          trainingStatus: 'Completed',
          fingerprint,
          trainedAt: Math.floor(Date.now() / 1000),
        }],
      });
    } catch (_) { /* non-critical */ }

    // Create chatbot
    const chatbotResult = await api.post('bots', {
      name: botName,
      prompt: chatbotPrompt,
      trainingSites: [siteUuid],
      type: 'chatbot',
      fingerprint,
      domain,
    });

    if (chatbotResult?.uuid) {
      setBotUuid(chatbotResult.uuid);
    }

    // Create agent
    const agentResult = await api.post('bots', {
      name: botName,
      prompt: agentPromptText,
      trainingSites: [siteUuid],
      type: 'agent',
      fingerprint,
      domain,
    });

    if (agentResult?.uuid) {
      setAgentBotUuid(agentResult.uuid);
    }

    // Save users.bots via PUT /profile
    try {
      const bots: { uuid: string; name: string; siteUuid: string; type: string }[] = [];
      if (chatbotResult?.uuid) {
        bots.push({ uuid: chatbotResult.uuid, name: botName, siteUuid, type: 'chatbot' });
      }
      if (agentResult?.uuid) {
        bots.push({ uuid: agentResult.uuid, name: botName, siteUuid, type: 'agent' });
      }
      if (bots.length > 0) {
        await api.put('profile', { key: 'bots', value: bots });
      }
    } catch (_) { /* non-critical */ }

    // Save site_name to wp_options right after bot creation
    const siteName = companyInfo?.name || websiteUrl || '';
    try {
      await api.post('settings', { site_name: siteName });
      if (window.jugAiConfig?.settings) {
        window.jugAiConfig.settings.site_name = siteName;
      }
    } catch (_) { /* non-critical */ }

    setPhase('complete');
  }, [websiteUrl, fingerprint, siteUuid, companyInfo, editedSummary, scrapedUrls, setBotUuid, setAgentBotUuid]);

  // Resume bot creation after user logs in mid-flow
  useEffect(() => {
    if (phase === 'awaiting_auth' && window.jugAiConfig?.isLoggedIn) {
      createBotAndSave().catch((err) => {
        setError(err.message || 'Failed to create bot after login.');
      });
    }
  }, [phase, createBotAndSave]);

  // Listen for login events to detect auth state change
  useEffect(() => {
    const handleAuthChange = () => {
      if (phase === 'awaiting_auth' && window.jugAiConfig?.isLoggedIn) {
        createBotAndSave().catch((err) => {
          setError(err.message || 'Failed to create bot after login.');
        });
      }
    };
    window.addEventListener('jug-ai:auth-success', handleAuthChange);
    return () => window.removeEventListener('jug-ai:auth-success', handleAuthChange);
  }, [phase, createBotAndSave]);

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
    if (phase === 'awaiting_auth') return Math.round(seg * 3);
    if (phase === 'creating_bot_post_auth') return 95;
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
    if (phase === 'awaiting_auth') return null;
    if (phase === 'creating_bot_post_auth') return 'Creating bot...';
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
              {(phase === 'complete' || phase === 'training' || phase === 'awaiting_auth' || phase === 'creating_bot_post_auth') && (
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

        {phase === 'awaiting_auth' && (
          <div className="jug-ai-card" style={{ textAlign: 'center', padding: '24px 20px' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 16 }}>
              Sign in to save your bot
            </p>
            <p className="jug-ai-muted" style={{ margin: '0 0 16px' }}>
              Training is complete! Sign in or create an account to save your bot and continue.
            </p>
            <button
              type="button"
              className="jug-ai-btn-primary"
              onClick={() => onAuthRequired()}
            >
              Sign in / Sign up
            </button>
          </div>
        )}

        {error && <p className="jug-ai-error">{error}</p>}
      </div>

      <div className="jug-step-footer">
        <button
          type="button"
          className="jug-ai-btn-primary"
          onClick={handleContinue}
          disabled={phase !== 'complete' && phase !== 'awaiting_auth'}
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
