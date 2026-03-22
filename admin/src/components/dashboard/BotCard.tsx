import { useState } from '@wordpress/element';
import type { Bot } from '../../types';

interface BotCardProps {
  bot: Bot;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onEmbed: () => void;
  onPreviewChatbot: () => void;
  onPreviewAgent: () => void;
  onViewLogs: () => void;
  onTrainingInfo: () => void;
  onAddTraining: () => void;
  onTestRetrieval: () => void;
  onDelete: () => void;
}

function getHostname(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  try {
    const u = url.startsWith('http') ? url : `https://${url}`;
    return new URL(u).hostname;
  } catch {
    return url;
  }
}

function formatLastTrained(trainedAt: number | null | undefined, trainingStatus?: string): string {
  if (trainedAt) {
    const now = Date.now();
    const diff = now - trainedAt * 1000;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(trainedAt * 1000).toLocaleDateString();
  }
  if (trainingStatus) return trainingStatus;
  return 'Not trained';
}

export default function BotCard({
  bot,
  isActive,
  onSelect,
  onEdit,
  onEmbed,
  onPreviewChatbot,
  onPreviewAgent,
  onViewLogs,
  onTrainingInfo,
  onAddTraining,
  onTestRetrieval,
  onDelete,
}: BotCardProps) {
  const rawSiteUrl = typeof bot.site_url === 'string' ? bot.site_url.trim() : '';
  const hostname = rawSiteUrl ? getHostname(rawSiteUrl) : '—';
  const displayUrl = rawSiteUrl
    ? (rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`)
    : '—';
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  const [faviconError, setFaviconError] = useState(false);
  const pageCount = bot.page_count ?? 0;
  const lastTrained = formatLastTrained(bot.trained_at ?? null, bot.training_status);

  return (
    <div
      className={`jug-site-card${isActive ? ' active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    >
      {/* Top row: icon, title + URL, pages badge, delete (hover) */}
      <div className="jug-site-card-top">
        <span className="jug-site-card-icon">
          {faviconError ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="11" width="7" height="10" rx="1" />
              <rect x="3" y="15" width="7" height="6" rx="1" />
            </svg>
          ) : (
            <img
              src={faviconUrl}
              alt=""
              width={20}
              height={20}
              onError={() => setFaviconError(true)}
            />
          )}
        </span>
        <div className="jug-site-card-titles">
          <p className="jug-site-card-hostname">{hostname}</p>
          <p className="jug-site-card-url">{displayUrl}</p>
        </div>
        <div className="jug-site-card-top-right">
          <span className="jug-site-card-pages-badge">{pageCount} pages</span>
          <button
            type="button"
            className="jug-site-card-delete"
            aria-label="Delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Edit + Embed */}
      <div className="jug-site-card-row-actions">
        <button
          type="button"
          className="jug-site-card-btn"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          Edit
        </button>
        <button
          type="button"
          className="jug-site-card-btn"
          onClick={(e) => { e.stopPropagation(); onEmbed(); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
          Embed
        </button>
      </div>

      {/* Preview box */}
      <div className="jug-site-card-preview-box" onClick={(e) => e.stopPropagation()}>
        <p className="jug-site-card-preview-label">Preview</p>
        <div className="jug-site-card-preview-btns">
          <button type="button" className="jug-site-card-preview-btn" onClick={(e) => { e.stopPropagation(); onPreviewChatbot(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Chatbot
          </button>
          <button type="button" className="jug-site-card-preview-btn jug-site-card-preview-btn-agent" onClick={(e) => { e.stopPropagation(); onPreviewAgent(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            Agent
          </button>
        </div>
      </div>

      {/* 2x2 utility grid */}
      <div className="jug-site-card-grid">
        <button type="button" className="jug-site-card-grid-btn" onClick={(e) => { e.stopPropagation(); onTrainingInfo(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
          Training Info
        </button>
        <button type="button" className="jug-site-card-grid-btn" onClick={(e) => { e.stopPropagation(); onAddTraining(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Training
        </button>
        <button type="button" className="jug-site-card-grid-btn" onClick={(e) => { e.stopPropagation(); onViewLogs(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
          Chat Logs
        </button>
        <button type="button" className="jug-site-card-grid-btn" onClick={(e) => { e.stopPropagation(); onTestRetrieval(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          Test Retrieval
        </button>
      </div>

      <p className="jug-site-card-footer">Last trained: {lastTrained}</p>
    </div>
  );
}
