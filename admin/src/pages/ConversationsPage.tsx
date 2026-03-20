import { useState, useEffect } from '@wordpress/element';
import api from '../api';
import type { Bot } from '../types';
import SessionList from '../components/conversations/SessionList';
import MessageThread from '../components/conversations/MessageThread';
import AnalyticsCharts from '../components/conversations/AnalyticsCharts';
import Spinner from '../components/shared/Spinner';

interface Props {
  route: string;
}

export default function ConversationsPage({ route }: Props) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotUuid, setSelectedBotUuid] = useState('');
  const [selectedFp, setSelectedFp] = useState<string | null>(null);
  const [tab, setTab] = useState<'sessions' | 'analytics'>('sessions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parts = route.split('/');
    const uuidFromRoute = parts[2] || '';

    api.get('bots').then((data) => {
      const list = Array.isArray(data) ? data : data.bots || [];
      setBots(list);
      if (uuidFromRoute && list.some((b: Bot) => b.uuid === uuidFromRoute)) {
        setSelectedBotUuid(uuidFromRoute);
      } else if (list.length > 0) {
        setSelectedBotUuid(list[0].uuid);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [route]);

  if (loading) {
    return <div className="jug-ai-center"><Spinner size={32} /></div>;
  }

  if (bots.length === 0) {
    return (
      <div className="jug-ai-empty-state">
        <p>No bots found. Create one first.</p>
        <a href="#/onboarding" className="jug-ai-btn-primary">Create Bot</a>
      </div>
    );
  }

  return (
    <div className="jug-ai-conversations">
      <div className="jug-ai-page-header">
        <h2>Conversations</h2>
        <select
          value={selectedBotUuid}
          onChange={(e) => {
            setSelectedBotUuid((e.target as HTMLSelectElement).value);
            setSelectedFp(null);
          }}
          className="jug-ai-select"
        >
          {bots.map((b) => (
            <option key={b.uuid} value={b.uuid}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="jug-ai-tabs">
        <button
          type="button"
          className={tab === 'sessions' ? 'active' : ''}
          onClick={() => { setTab('sessions'); setSelectedFp(null); }}
        >
          Sessions
        </button>
        <button
          type="button"
          className={tab === 'analytics' ? 'active' : ''}
          onClick={() => { setTab('analytics'); setSelectedFp(null); }}
        >
          Analytics
        </button>
      </div>

      {tab === 'sessions' && !selectedFp && (
        <SessionList
          botUuid={selectedBotUuid}
          onSelectSession={setSelectedFp}
        />
      )}

      {tab === 'sessions' && selectedFp && (
        <MessageThread
          botUuid={selectedBotUuid}
          fingerprint={selectedFp}
          onBack={() => setSelectedFp(null)}
        />
      )}

      {tab === 'analytics' && (
        <AnalyticsCharts botUuid={selectedBotUuid} />
      )}
    </div>
  );
}
