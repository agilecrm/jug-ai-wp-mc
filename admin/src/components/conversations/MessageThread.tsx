import { useState, useEffect } from '@wordpress/element';
import api from '../../api';
import type { Message } from '../../types';
import Spinner from '../shared/Spinner';

interface Props {
  botUuid: string;
  fingerprint: string;
  onBack: () => void;
}

export default function MessageThread({ botUuid, fingerprint, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`conversations/${botUuid}/sessions/${fingerprint}/messages`)
      .then((data) => {
        const list = Array.isArray(data) ? data : data.messages || [];
        setMessages(list);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [botUuid, fingerprint]);

  if (loading) {
    return <div className="jug-ai-center"><Spinner size={32} /></div>;
  }

  return (
    <div className="jug-ai-message-thread">
      <div className="jug-ai-thread-header">
        <button type="button" className="jug-ai-btn-sm" onClick={onBack}>
          &larr; Back to Sessions
        </button>
        <span className="jug-ai-muted">Session: {fingerprint.slice(0, 12)}...</span>
      </div>

      <div className="jug-ai-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`jug-ai-message jug-ai-message-${msg.role}`}>
            <div className="jug-ai-message-role">
              {msg.role === 'user' ? 'Visitor' : 'AI'}
            </div>
            <div className="jug-ai-message-content">{msg.content}</div>
            <div className="jug-ai-message-time">
              {new Date(msg.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="jug-ai-muted">No messages in this session.</p>
        )}
      </div>
    </div>
  );
}
