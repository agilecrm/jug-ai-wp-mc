import { useState, useEffect } from '@wordpress/element';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api';
import type { BotStats } from '../../types';
import Spinner from '../shared/Spinner';

interface Props {
  botUuid: string;
}

export default function AnalyticsCharts({ botUuid }: Props) {
  const [stats, setStats] = useState<BotStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`conversations/${botUuid}/stats`)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [botUuid]);

  if (loading) {
    return <div className="jug-ai-center"><Spinner size={32} /></div>;
  }

  if (!stats) {
    return <p className="jug-ai-muted">No analytics data available.</p>;
  }

  return (
    <div className="jug-ai-analytics">
      <div className="jug-ai-stats-overview">
        <div className="jug-ai-stat-card">
          <span className="jug-ai-stat-value">{stats.total_messages}</span>
          <span className="jug-ai-stat-label">Total Messages</span>
        </div>
        <div className="jug-ai-stat-card">
          <span className="jug-ai-stat-value">{stats.total_sessions}</span>
          <span className="jug-ai-stat-label">Total Sessions</span>
        </div>
      </div>

      {stats.daily_messages && stats.daily_messages.length > 0 && (
        <div className="jug-ai-chart-card">
          <h4>Daily Messages</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.daily_messages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="var(--jug-primary)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.daily_sessions && stats.daily_sessions.length > 0 && (
        <div className="jug-ai-chart-card">
          <h4>Daily Sessions</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.daily_sessions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="var(--jug-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.hourly_activity && stats.hourly_activity.length > 0 && (
        <div className="jug-ai-chart-card">
          <h4>Hourly Activity</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.hourly_activity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="var(--jug-secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
