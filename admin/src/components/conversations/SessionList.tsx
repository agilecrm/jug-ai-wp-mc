import { useState, useEffect } from '@wordpress/element';
import api from '../../api';
import type { Session } from '../../types';
import Spinner from '../shared/Spinner';

interface Props {
  botUuid: string;
  onSelectSession: (fingerprint: string) => void;
}

export default function SessionList({ botUuid, onSelectSession }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (search) params.set('search', search);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const data = await api.get(`conversations/${botUuid}/sessions?${params}`);
      const list = Array.isArray(data) ? data : data.sessions || [];
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, [botUuid, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSessions();
  };

  return (
    <div className="jug-ai-session-list">
      <form className="jug-ai-filters" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom((e.target as HTMLInputElement).value)}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo((e.target as HTMLInputElement).value)}
        />
        <button type="submit" className="jug-ai-btn-sm">Filter</button>
      </form>

      {loading ? (
        <div className="jug-ai-center"><Spinner /></div>
      ) : sessions.length === 0 ? (
        <p className="jug-ai-muted">No sessions found.</p>
      ) : (
        <table className="jug-ai-table">
          <thead>
            <tr>
              <th>Visitor</th>
              <th>Messages</th>
              <th>First Message</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.fingerprint} onClick={() => onSelectSession(s.fingerprint)} className="jug-ai-clickable">
                <td title={s.fingerprint}>
                  {s.fingerprint.slice(0, 8)}...
                </td>
                <td>{s.message_count}</td>
                <td className="jug-ai-truncate">{s.first_message}</td>
                <td>{new Date(s.last_message_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="jug-ai-pagination">
        <button
          type="button"
          className="jug-ai-btn-sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          className="jug-ai-btn-sm"
          onClick={() => setPage(page + 1)}
          disabled={sessions.length < 20}
        >
          Next
        </button>
      </div>
    </div>
  );
}
