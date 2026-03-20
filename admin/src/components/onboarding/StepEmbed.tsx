import { useState } from '@wordpress/element';
import api from '../../api';
import CodeBlock from '../shared/CodeBlock';
import Spinner from '../shared/Spinner';

interface Props {
  botUuid: string;
  onBack: () => void;
}

export default function StepEmbed({ botUuid, onBack }: Props) {
  const [widgetType, setWidgetType] = useState<'chatbot' | 'agent'>('chatbot');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async () => {
    setSaving(true);
    setError('');

    try {
      await api.post('settings', {
        active_bot_uuid: botUuid,
        widget_type: widgetType,
        widget_enabled: true,
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const scriptSrc = widgetType === 'agent'
    ? 'https://app.jug.ai/agent.min.js'
    : 'https://app.jug.ai/chat.min.js';

  const embedCode = `<script src="${scriptSrc}" data-bot="${botUuid}"></script>`;

  return (
    <div className="jug-ai-step">
      <h3>Embed Your Widget</h3>

      <div className="jug-ai-field">
        <label>Widget Type</label>
        <div className="jug-ai-radio-group">
          <label>
            <input
              type="radio"
              name="embed_type"
              value="chatbot"
              checked={widgetType === 'chatbot'}
              onChange={() => setWidgetType('chatbot')}
            />
            Chatbot
          </label>
          <label>
            <input
              type="radio"
              name="embed_type"
              value="agent"
              checked={widgetType === 'agent'}
              onChange={() => setWidgetType('agent')}
            />
            Agent
          </label>
        </div>
      </div>

      <div className="jug-ai-card">
        <h4>Embed Code (for external sites)</h4>
        <CodeBlock code={embedCode} />
      </div>

      {botUuid && (
        <div className="jug-ai-card">
          <h4>Preview</h4>
          <iframe
            src={`https://app.jug.ai/preview/${botUuid}?type=${widgetType}`}
            style={{ width: '100%', height: 500, border: '1px solid var(--jug-border)', borderRadius: 8 }}
            title="Widget Preview"
          />
        </div>
      )}

      {error && <p className="jug-ai-error">{error}</p>}

      {saved ? (
        <div className="jug-ai-success-box">
          <p>Widget is now live on your site!</p>
          <a href="#/dashboard" className="jug-ai-btn-primary">Go to Dashboard</a>
        </div>
      ) : (
        <div className="jug-ai-step-actions">
          <button type="button" className="jug-ai-btn-secondary" onClick={onBack}>
            Back
          </button>
          <button
            type="button"
            className="jug-ai-btn-primary"
            onClick={handleActivate}
            disabled={saving}
          >
            {saving ? <Spinner size={18} /> : 'Activate Widget'}
          </button>
        </div>
      )}
    </div>
  );
}
