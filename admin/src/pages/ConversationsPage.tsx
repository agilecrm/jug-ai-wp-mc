import { useState, useEffect } from '@wordpress/element';
import api from '../api';
import type { Bot } from '../types';
import Spinner from '../components/shared/Spinner';

interface Props {
  route: string;
}

export default function ConversationsPage({ route }: Props) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('bots')
      .then((data) => {
        setBots(Array.isArray(data) ? data : data.bots || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [route]);

  if (loading) {
    return <div className="jug-ai-center"><Spinner size={32} /></div>;
  }

  return (
    <div className="jug-ai-conversations">
      <h2>Conversations</h2>
      <p className="jug-ai-muted">Conversations page — coming soon.</p>
    </div>
  );
}
