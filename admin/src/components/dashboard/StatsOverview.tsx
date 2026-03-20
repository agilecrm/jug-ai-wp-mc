import { useState, useEffect } from '@wordpress/element';
import api from '../../api';
import type { BotStats } from '../../types';

interface Props {
  activeBotUuid: string;
}

export default function StatsOverview({ activeBotUuid }: Props) {
  const [stats, setStats] = useState<BotStats | null>(null);

  useEffect(() => {
    if (!activeBotUuid) return;

    api.get(`conversations/${activeBotUuid}/stats`)
      .then(setStats)
      .catch(() => setStats(null));
  }, [activeBotUuid]);

  if (!activeBotUuid) {
    return (
      <div className="jug-ai-stats-overview">
        <p className="jug-ai-muted">Select an active bot to see stats.</p>
      </div>
    );
  }

  return (
    <div className="jug-ai-stats-overview">
      <div className="jug-ai-stat-card">
        <span className="jug-ai-stat-value">{stats?.total_messages ?? '—'}</span>
        <span className="jug-ai-stat-label">Total Messages</span>
      </div>
      <div className="jug-ai-stat-card">
        <span className="jug-ai-stat-value">{stats?.total_sessions ?? '—'}</span>
        <span className="jug-ai-stat-label">Total Sessions</span>
      </div>
      <div className="jug-ai-stat-card">
        <span className="jug-ai-stat-value">
          {activeBotUuid ? '●' : '—'}
        </span>
        <span className="jug-ai-stat-label">Active Bot</span>
      </div>
    </div>
  );
}
