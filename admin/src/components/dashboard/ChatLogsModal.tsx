import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface Session {
  finger_print?: string;
  fingerprint?: string;
  message_count: number;
  first_message: string;
  last_message?: string;
  started_at?: string | null;
  last_activity?: string | null;
  first_message_at?: string;
  last_message_at?: string;
}

interface ChatMessage {
  user_message?: string;
  assistant_message?: string;
  role?: 'user' | 'assistant';
  content?: string;
  timestamp?: string | null;
  created_at?: string;
}

interface StatsResponse {
  total_messages: number;
  total_sessions: number;
  daily: Record<string, number>;
  daily_sessions?: Record<string, number>;
  hourly?: Record<string, number>;
  session_length?: Record<string, number>;
  weekly?: Record<string, number>;
  day_of_week?: Record<string, number>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  botUuid: string | undefined;
  botName: string;
}

const PAGE_SIZE = 20;
const CHART_HEIGHT = 160;

function getUserTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
  catch { return 'UTC'; }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: getUserTimezone() });
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: getUserTimezone() });
}

function truncate(str: string, max: number): string {
  if (!str) return '(empty)';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function getDefaultDateRange(): { from: string; to: string } {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: fmt(weekAgo), to: fmt(today) };
}

function getSessionFp(s: Session): string {
  return s.finger_print || s.fingerprint || '';
}

/* ── Mini Bar Chart (pure CSS) ── */
function MiniBarChart({ data, label }: { data: Record<string, number>; label?: string }) {
  const entries = Object.entries(data ?? {}).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return <div className="jug-chart-empty"><p>No data</p></div>;
  }
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="jug-chart-bars">
      {entries.map(([k, v]) => (
        <div key={k} className="jug-chart-bar-col" title={`${k}: ${v}`}>
          <span className="jug-chart-bar-val">{v}</span>
          <div className="jug-chart-bar" style={{ height: Math.max((v / maxVal) * CHART_HEIGHT, v > 0 ? 6 : 0) }} />
          <span className="jug-chart-bar-label">{k.length > 6 ? k.slice(-5) : k}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Mini Donut Chart (pure SVG) ── */
function MiniDonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data ?? {});
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <div className="jug-chart-empty"><p>No data</p></div>;

  const colors = ['#4f46e5', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];
  const size = 120;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;

  const segments = entries.map(([label, value], i) => {
    const pct = value / total;
    const dash = 2 * Math.PI * r * pct;
    const seg = { label, value, pct, dash, offset, color: colors[i % colors.length] };
    offset += dash;
    return seg;
  });

  return (
    <div className="jug-chart-donut-wrap">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {segments.map(({ dash, offset: o, color }, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${2 * Math.PI * r}`}
            strokeDashoffset={-o}
          />
        ))}
      </svg>
      <div className="jug-chart-donut-legend">
        {segments.map(({ label, value, pct, color }) => (
          <div key={label} className="jug-chart-donut-item">
            <span className="jug-chart-donut-swatch" style={{ background: color }} />
            <span className="jug-chart-donut-label">{label}</span>
            <span className="jug-chart-donut-value">{value} ({Math.round(pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatLogsModal({ open, onClose, botUuid, botName }: Props) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'analytics'>('conversations');

  // Conversations
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState(() => getDefaultDateRange().from);
  const [toDate, setToDate] = useState(() => getDefaultDateRange().to);

  // Analytics
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const prevOpen = useRef(false);

  useEffect(() => {
    if (open && !prevOpen.current) {
      const { from, to } = getDefaultDateRange();
      setFromDate(from);
      setToDate(to);
      setSelectedSession(null);
      setMessages([]);
      setSearchQuery('');
      setDebouncedSearch('');
      setSessionsPage(1);
    }
    prevOpen.current = open;
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch sessions
  const fetchSessions = useCallback(async (page: number, search: string, fDate: string, tDate: string) => {
    if (!botUuid) return;
    setLoadingSessions(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      if (fDate) params.set('from_date', fDate);
      if (tDate) params.set('to_date', tDate);
      params.set('timezone', getUserTimezone());
      const data = await api.get(`conversations/${botUuid}/sessions?${params}`);
      setSessions(data.sessions || []);
      setSessionsTotal(data.total || 0);
    } catch { setSessions([]); }
    finally { setLoadingSessions(false); }
  }, [botUuid]);

  useEffect(() => {
    if (open && botUuid) {
      setSelectedSession(null);
      setMessages([]);
      setSessionsPage(1);
      fetchSessions(1, debouncedSearch, fromDate, toDate);
    }
  }, [open, botUuid, debouncedSearch, fromDate, toDate, fetchSessions]);

  useEffect(() => {
    if (open && botUuid && sessionsPage > 1) {
      fetchSessions(sessionsPage, debouncedSearch, fromDate, toDate);
    }
  }, [sessionsPage, open, botUuid, debouncedSearch, fromDate, toDate, fetchSessions]);

  // Fetch messages
  const fetchMessages = useCallback(async (fp: string) => {
    if (!botUuid) return;
    setLoadingMessages(true);
    try {
      const data = await api.get(`conversations/${botUuid}/sessions/${encodeURIComponent(fp)}/messages`);
      setMessages(data.messages || []);
    } catch { setMessages([]); }
    finally { setLoadingMessages(false); }
  }, [botUuid]);

  // Fetch stats
  const fetchStats = useCallback(async (fDate: string, tDate: string) => {
    if (!botUuid) return;
    setLoadingStats(true);
    try {
      const params = new URLSearchParams();
      if (fDate) params.set('from_date', fDate);
      if (tDate) params.set('to_date', tDate);
      params.set('timezone', getUserTimezone());
      const data = await api.get(`conversations/${botUuid}/stats?${params}`);
      setStats(data);
    } catch { setStats(null); }
    finally { setLoadingStats(false); }
  }, [botUuid]);

  useEffect(() => {
    if (open && botUuid) fetchStats(fromDate, toDate);
  }, [open, botUuid, fromDate, toDate, fetchStats]);

  function handleSelectSession(session: Session) {
    setSelectedSession(session);
    fetchMessages(getSessionFp(session));
  }

  if (!open) return null;

  const totalSessionPages = Math.ceil(sessionsTotal / PAGE_SIZE);

  return (
    <div className="jug-ai-modal-overlay" onClick={onClose}>
      <div className="jug-ai-modal jug-ai-modal-chat-logs" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="jug-ai-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectedSession && (
              <button
                type="button"
                className="jug-ai-btn-sm"
                onClick={() => { setSelectedSession(null); setMessages([]); }}
                style={{ padding: '4px 8px' }}
              >
                &larr;
              </button>
            )}
            <h3>Chat Logs{botName ? ` – ${botName}` : ''}</h3>
          </div>
          <button type="button" className="jug-ai-modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Tabs */}
        <div className="jug-logs-tabs">
          <button
            type="button"
            className={`jug-logs-tab${activeTab === 'conversations' ? ' active' : ''}`}
            onClick={() => setActiveTab('conversations')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Conversations
          </button>
          <button
            type="button"
            className={`jug-logs-tab${activeTab === 'analytics' ? ' active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
            Analytics
          </button>
          <span className="jug-logs-tab-badge">{sessionsTotal} session{sessionsTotal !== 1 ? 's' : ''}</span>
        </div>

        {/* Body */}
        {!botUuid ? (
          <div className="jug-ai-empty-state">
            <p>No bot configured. Create a bot first to see chat logs.</p>
          </div>
        ) : activeTab === 'conversations' ? (
          <div className="jug-logs-body">
            {/* Session list */}
            <div className={`jug-logs-sessions${selectedSession ? ' jug-logs-sessions-hidden-mobile' : ''}`}>
              <div className="jug-logs-search">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery((e.target as HTMLInputElement).value); setSessionsPage(1); }}
                />
              </div>
              <div className="jug-logs-filter-row">
                <input type="date" value={fromDate} onChange={(e) => setFromDate((e.target as HTMLInputElement).value)} />
                <input type="date" value={toDate} onChange={(e) => setToDate((e.target as HTMLInputElement).value)} />
              </div>

              {loadingSessions ? (
                <div className="jug-ai-center"><Spinner size={24} /></div>
              ) : sessions.length === 0 ? (
                <p className="jug-ai-muted" style={{ textAlign: 'center', padding: 24 }}>
                  {debouncedSearch || fromDate || toDate ? 'No matching conversations' : 'No conversations yet'}
                </p>
              ) : (
                <div className="jug-logs-session-list">
                  {sessions.map((session) => {
                    const fp = getSessionFp(session);
                    const isSelected = selectedSession && getSessionFp(selectedSession) === fp;
                    return (
                      <button
                        key={fp}
                        type="button"
                        className={`jug-logs-session-item${isSelected ? ' active' : ''}`}
                        onClick={() => handleSelectSession(session)}
                      >
                        <div className="jug-logs-session-top">
                          <span className="jug-logs-session-msg">{truncate(session.first_message, 80)}</span>
                          <span className="jug-logs-session-count">{session.message_count}</span>
                        </div>
                        <span className="jug-logs-session-time">
                          {formatDate(session.last_activity || session.last_message_at)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {totalSessionPages > 1 && (
                <div className="jug-ai-pagination">
                  <button
                    type="button"
                    className="jug-ai-btn-sm"
                    disabled={sessionsPage <= 1}
                    onClick={() => setSessionsPage((p) => p - 1)}
                  >
                    Prev
                  </button>
                  <span>{sessionsPage} / {totalSessionPages}</span>
                  <button
                    type="button"
                    className="jug-ai-btn-sm"
                    disabled={sessionsPage >= totalSessionPages}
                    onClick={() => setSessionsPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Messages pane */}
            <div className={`jug-logs-messages${selectedSession ? '' : ' jug-logs-messages-hidden-mobile'}`}>
              {!selectedSession ? (
                <div className="jug-ai-empty-state">
                  <p>Select a session to view messages</p>
                </div>
              ) : loadingMessages ? (
                <div className="jug-ai-center"><Spinner size={24} /></div>
              ) : (
                <div className="jug-ai-messages">
                  {messages.map((msg, i) => {
                    if (msg.user_message !== undefined) {
                      return (
                        <div key={i} className="jug-logs-exchange">
                          <div className="jug-ai-message jug-ai-message-user">
                            <div className="jug-ai-message-role">You</div>
                            <div className="jug-ai-message-content">{msg.user_message}</div>
                            {msg.timestamp && <div className="jug-ai-message-time">{formatTimestamp(msg.timestamp)}</div>}
                          </div>
                          <div className="jug-ai-message jug-ai-message-assistant">
                            <div className="jug-ai-message-role">Bot</div>
                            <div className="jug-ai-message-content">{msg.assistant_message}</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className={`jug-ai-message jug-ai-message-${msg.role || 'user'}`}>
                        <div className="jug-ai-message-role">{msg.role === 'assistant' ? 'Bot' : 'You'}</div>
                        <div className="jug-ai-message-content">{msg.content}</div>
                        {msg.created_at && <div className="jug-ai-message-time">{formatTimestamp(msg.created_at)}</div>}
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="jug-ai-muted" style={{ textAlign: 'center', padding: 24 }}>No messages in this session</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Analytics tab */
          <div className="jug-logs-analytics">
            <div className="jug-logs-filter-row" style={{ marginBottom: 16 }}>
              <label>From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate((e.target as HTMLInputElement).value)} />
              <label>To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate((e.target as HTMLInputElement).value)} />
              {(fromDate || toDate) && (
                <button type="button" className="jug-ai-btn-sm" onClick={() => { setFromDate(''); setToDate(''); }}>Clear</button>
              )}
            </div>

            {loadingStats ? (
              <div className="jug-ai-center"><Spinner size={32} /></div>
            ) : stats ? (
              <>
                <div className="jug-stats-cards">
                  <div className="jug-ai-stat-card">
                    <span className="jug-ai-stat-value">{stats.total_sessions}</span>
                    <span className="jug-ai-stat-label">Total Sessions</span>
                  </div>
                  <div className="jug-ai-stat-card">
                    <span className="jug-ai-stat-value">{stats.total_messages}</span>
                    <span className="jug-ai-stat-label">Total Messages</span>
                  </div>
                </div>

                <div className="jug-charts-grid">
                  <div className="jug-ai-chart-card">
                    <h4>Daily Messages</h4>
                    <MiniBarChart data={stats.daily ?? {}} />
                  </div>
                  <div className="jug-ai-chart-card">
                    <h4>Daily Sessions</h4>
                    <MiniBarChart data={stats.daily_sessions ?? {}} />
                  </div>
                  <div className="jug-ai-chart-card">
                    <h4>Hourly Activity</h4>
                    <MiniBarChart data={stats.hourly ?? {}} />
                  </div>
                  <div className="jug-ai-chart-card">
                    <h4>Day of Week</h4>
                    <MiniDonutChart data={stats.day_of_week ?? {}} />
                  </div>
                  <div className="jug-ai-chart-card">
                    <h4>Session Length</h4>
                    <MiniDonutChart data={stats.session_length ?? {}} />
                  </div>
                  <div className="jug-ai-chart-card">
                    <h4>Weekly Trend</h4>
                    <MiniBarChart data={stats.weekly ?? {}} />
                  </div>
                </div>
              </>
            ) : (
              <div className="jug-ai-empty-state">
                <p>No analytics data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
