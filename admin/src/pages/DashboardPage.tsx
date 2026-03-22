import { useState, useEffect, useMemo } from '@wordpress/element';
import api from '../api';
import type { Bot } from '../types';
import Spinner from '../components/shared/Spinner';
import BotCard from '../components/dashboard/BotCard';
import BotEditModal from '../components/dashboard/BotEditModal';
import EmbedModal from '../components/dashboard/EmbedModal';
import ChatLogsModal from '../components/dashboard/ChatLogsModal';
import BotPreviewModal from '../components/dashboard/BotPreviewModal';
import DeleteConfirmModal from '../components/dashboard/DeleteConfirmModal';
import { normalizeBotsPayload } from '../utils/normalizeBots';
import FeaturesSidebar from '../components/shared/FeaturesSidebar';

interface Props {
  onOpenOnboarding: () => void;
  /** Opens OTP sign-in (same as header Login). Required to load bots when `isLoggedIn` is false. */
  onConnectJug?: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getHostname(url: string): string {
  try {
    const u = url.startsWith('http') ? url : `https://${url}`;
    return new URL(u).hostname;
  } catch {
    return url;
  }
}

type StubKind = 'training-info' | 'test-retrieval' | null;

const STUB_COPY: Record<Exclude<StubKind, null>, { title: string; body: string }> = {
  'training-info': {
    title: 'Training Info',
    body: 'Detailed embedding lists and training management are available in the Jug AI web app. The WordPress plugin loads your bots from your Jug AI account — nothing is duplicated in the WordPress database except your login session.',
  },
  'test-retrieval': {
    title: 'Test Retrieval',
    body: 'Run retrieval tests against your knowledge base in the Jug AI web app. This plugin will connect here when the API route is enabled.',
  },
};

export default function DashboardPage({ onOpenOnboarding, onConnectJug }: Props) {
  const greeting = useMemo(getGreeting, []);
  const userName = window.jugAiConfig?.userName || '';

  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBotUuid, setActiveBotUuid] = useState<string | null>(null);

  const [stubModal, setStubModal] = useState<StubKind>(null);

  // Modal state
  const [editBotUuid, setEditBotUuid] = useState<string | undefined>();
  const [editOpen, setEditOpen] = useState(false);

  const [embedBot, setEmbedBot] = useState<Bot | null>(null);
  const [embedOpen, setEmbedOpen] = useState(false);

  const [logsBotUuid, setLogsBotUuid] = useState<string | undefined>();
  const [logsBotName, setLogsBotName] = useState('');
  const [logsOpen, setLogsOpen] = useState(false);

  const [previewBot, setPreviewBot] = useState<Bot | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [deleteBotUuid, setDeleteBotUuid] = useState<string | undefined>();
  const [deleteBotName, setDeleteBotName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  /** Set when GET /bots fails (API error, expired token, wrong base URL). */
  const [botsLoadError, setBotsLoadError] = useState<string | null>(null);

  const jugAccountConnected = window.jugAiConfig?.isLoggedIn === true;

  function loadBots() {
    if (!jugAccountConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setBotsLoadError(null);
    api.get('bots')
      .then((data: unknown) => {
        const list = normalizeBotsPayload(data);
        setBots(list);
        setActiveBotUuid((prev) => {
          if (list.length === 0) return null;
          if (prev && list.some((b) => b.uuid === prev)) return prev;
          return list[0].uuid;
        });
      })
      .catch((err: Error) => {
        setBots([]);
        setBotsLoadError(err.message || 'Could not load bots from the Jug AI API.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!jugAccountConnected) {
      setLoading(false);
      return;
    }
    loadBots();
  }, []);

  function openAgentDemo(bot: Bot) {
    window.open(`https://app.jug.ai/agent-demo/${bot.uuid}`, '_blank', 'noopener,noreferrer');
  }

  if (loading) {
    return (
      <div className="jug-ai-dashboard">
        <div className="jug-ai-center"><Spinner size={32} /></div>
      </div>
    );
  }

  return (
    <div className="jug-ai-dashboard">
      <div className="jug-dash-columns">
      <div className="jug-dash-main">
      <h1 className="jug-dash-greeting">
        {greeting}{userName ? `, ${userName}` : ''}!
      </h1>
      <p className="jug-dash-subtitle">Manage your trained websites and chatbots</p>

      {!jugAccountConnected && (
        <div className="jug-dash-api-notice jug-dash-api-notice-warn" role="status">
          <strong>Not connected to Jug.ai</strong>
          <p>
            Sign in with your Jug.ai account from this plugin (OTP). The dashboard loads bots from the{' '}
            <strong>Jug AI API</strong> using your login — it does <strong>not</strong> read MongoDB or any
            &quot;collection&quot; inside WordPress. Your site widget only needs the bot ID; the admin list
            needs the same account session as app.jug.ai.
          </p>
          {onConnectJug && (
            <p className="jug-dash-api-notice-actions">
              <button type="button" className="jug-ai-btn-primary jug-dash-connect-btn" onClick={onConnectJug}>
                Sign in with Jug.ai (OTP)
              </button>
            </p>
          )}
        </div>
      )}

      {jugAccountConnected && botsLoadError && (
        <div className="jug-dash-api-notice jug-dash-api-notice-error" role="alert">
          <strong>Could not load bots</strong>
          <p>{botsLoadError}</p>
          <button type="button" className="jug-ai-btn-secondary jug-dash-retry" onClick={loadBots}>
            Retry
          </button>
        </div>
      )}

      {jugAccountConnected && !botsLoadError && bots.length === 0 ? (
        <div
          className="jug-dash-empty-card"
          role="button"
          tabIndex={0}
          onClick={onOpenOnboarding}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenOnboarding(); }}
        >
          <span className="jug-dash-empty-plus">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          <span className="jug-dash-empty-label">Add Website</span>
          <strong className="jug-dash-empty-title">No websites yet</strong>
          <span className="jug-dash-empty-hint">Add your first website to train an AI chatbot</span>
        </div>
      ) : jugAccountConnected && !botsLoadError ? (
        <div className="jug-ai-bot-grid jug-ai-bot-grid-sidebar">
          {bots.map((bot) => (
            <BotCard
              key={bot.uuid}
              bot={bot}
              isActive={bot.uuid === activeBotUuid}
              onSelect={() => setActiveBotUuid(bot.uuid)}
              onEdit={() => { setEditBotUuid(bot.uuid); setEditOpen(true); }}
              onEmbed={() => { setEmbedBot(bot); setEmbedOpen(true); }}
              onPreviewChatbot={() => { setPreviewBot(bot); setPreviewOpen(true); }}
              onPreviewAgent={() => openAgentDemo(bot)}
              onViewLogs={() => { setLogsBotUuid(bot.uuid); setLogsBotName(bot.name); setLogsOpen(true); }}
              onTrainingInfo={() => setStubModal('training-info')}
              onAddTraining={onOpenOnboarding}
              onTestRetrieval={() => setStubModal('test-retrieval')}
              onDelete={() => { setDeleteBotUuid(bot.uuid); setDeleteBotName(bot.name); setDeleteOpen(true); }}
            />
          ))}
        </div>
      ) : null}
      </div>

      <FeaturesSidebar />
      </div>

      {stubModal && (
        <div className="jug-ai-modal-overlay" onClick={() => setStubModal(null)}>
          <div className="jug-ai-modal jug-ai-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="jug-ai-modal-header">
              <h3>{STUB_COPY[stubModal].title}</h3>
              <button type="button" className="jug-ai-modal-close" onClick={() => setStubModal(null)}>&times;</button>
            </div>
            <p className="jug-ai-muted" style={{ margin: '0 0 20px', lineHeight: 1.6 }}>{STUB_COPY[stubModal].body}</p>
            <div className="jug-ai-modal-actions">
              <button type="button" className="jug-ai-btn-primary" onClick={() => setStubModal(null)}>OK</button>
            </div>
          </div>
        </div>
      )}

      <BotEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        botUuid={editBotUuid}
        onSaved={loadBots}
      />

      <EmbedModal
        open={embedOpen}
        onClose={() => setEmbedOpen(false)}
        botUuid={embedBot?.uuid}
        botName={embedBot?.name || ''}
        widgetType={embedBot?.widget_type || 'chatbot'}
        hostname={embedBot ? getHostname(embedBot.site_url) : ''}
      />

      <ChatLogsModal
        open={logsOpen}
        onClose={() => setLogsOpen(false)}
        botUuid={logsBotUuid}
        botName={logsBotName}
      />

      <BotPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        botUuid={previewBot?.uuid}
        siteUrl={previewBot?.site_url || ''}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        botUuid={deleteBotUuid}
        botName={deleteBotName}
        onDeleted={loadBots}
      />
    </div>
  );
}
