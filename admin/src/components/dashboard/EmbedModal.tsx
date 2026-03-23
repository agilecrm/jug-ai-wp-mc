import { useMemo, useState } from '@wordpress/element';
import api from '../../api';
import CodeBlock from '../shared/CodeBlock';
import Spinner from '../shared/Spinner';

interface Props {
  open: boolean;
  onClose: () => void;
  botUuid: string | undefined;
  botName: string;
  widgetType: string;
  hostname: string;
}

function getWidgetBase(): string {
  const raw = window.jugAiConfig.widgetBase || 'https://app.jug.ai';
  return raw.replace(/\/$/, '');
}

export default function EmbedModal({ open, onClose, botUuid, botName, widgetType, hostname }: Props) {
  const [activatedType, setActivatedType] = useState<'chatbot' | 'agent' | null>(
    widgetType === 'agent' || widgetType === 'chatbot' ? widgetType : null
  );
  const [saving, setSaving] = useState(false);
  const [savingType, setSavingType] = useState<'chatbot' | 'agent' | null>(null);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState('');

  const widgetBase = useMemo(() => getWidgetBase(), []);

  const chatbotCode = useMemo(() => {
    return `<script id="jug-ai-chat" src="${widgetBase}/chat.min.js" data-bot="${botUuid}"></script>`;
  }, [widgetBase, botUuid]);

  const agentCode = useMemo(() => {
    return `<script id="jug-ai-agent" src="${widgetBase}/agent.min.js" data-bot="${botUuid}"></script>`;
  }, [widgetBase, botUuid]);

  if (!open) return null;

  const handleActivate = async (type: 'chatbot' | 'agent') => {
    setSaving(true);
    setSavingType(type);
    setError('');

    try {
      const siteName = hostname || window.jugAiConfig?.settings?.site_name || '';
      await api.post('settings', {
        active_bot_uuid: botUuid,
        widget_type: type,
        widget_enabled: true,
        site_name: siteName,
      });
      if (window.jugAiConfig?.settings) {
        window.jugAiConfig.settings.widget_type = type;
        window.jugAiConfig.settings.widget_enabled = true;
        window.jugAiConfig.settings.site_name = siteName;
      }
      setActivatedType(type);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
      setSavingType(null);
    }
  };

  const handleRemoveWidget = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    setRemoving(true);
    setError('');

    try {
      await api.post('settings', {
        active_bot_uuid: botUuid,
        widget_enabled: false,
      });
      if (window.jugAiConfig?.settings) {
        window.jugAiConfig.settings.widget_enabled = false;
      }
      setActivatedType(null);
      setConfirmRemove(false);
    } catch (err: any) {
      setError(err.message || 'Failed to remove widget.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="jug-ai-modal-overlay" onClick={onClose}>
      <div className="jug-ai-modal jug-ai-modal-md jug-embed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jug-ai-modal-header">
          <h3>Embed on {hostname || 'your site'}</h3>
          <button type="button" className="jug-ai-modal-close" onClick={onClose}>&times;</button>
        </div>

        {!botUuid ? (
          <p className="jug-ai-muted" style={{ textAlign: 'center', padding: '32px 0' }}>
            No bot found. Create one first.
          </p>
        ) : (
          <div className="jug-embed-modal-body">
            <p className="jug-embed-modal-subtitle">
              Choose the widget type. After you activate, the plugin injects the script on your
              site via <code className="jug-embed-inline-code">wp_footer</code>.
            </p>

            <div className="jug-embed-stack">
              {/* Simple Chatbot card */}
              <div className={`jug-embed-widget-card${activatedType === 'chatbot' ? ' active' : ''}`}>
                <div className="jug-embed-widget-card-header">
                  <span className="jug-embed-widget-card-title">💬 Simple Chatbot</span>
                  {activatedType === 'chatbot' ? (
                    <span className="jug-embed-widget-badge-active">Active</span>
                  ) : (
                    <button
                      type="button"
                      className="jug-ai-btn-primary jug-embed-activate-btn"
                      onClick={() => handleActivate('chatbot')}
                      disabled={saving}
                    >
                      {saving && savingType === 'chatbot' ? <><Spinner size={14} /> Saving...</> : 'Activate'}
                    </button>
                  )}
                </div>
                <div className="jug-embed-reference">
                  <p className="jug-embed-reference-label">Script tag the plugin adds</p>
                  <CodeBlock code={chatbotCode} language="html" />
                </div>
                {activatedType === 'agent' && (
                  <p className="jug-embed-removed-note">Activating this will replace the Agent widget.</p>
                )}
              </div>

              {/* Agent card */}
              <div className={`jug-embed-widget-card${activatedType === 'agent' ? ' active' : ''}`}>
                <div className="jug-embed-widget-card-header">
                  <span className="jug-embed-widget-card-title">⚡ Agent</span>
                  {activatedType === 'agent' ? (
                    <span className="jug-embed-widget-badge-active">Active</span>
                  ) : (
                    <button
                      type="button"
                      className="jug-ai-btn-primary jug-embed-activate-btn"
                      onClick={() => handleActivate('agent')}
                      disabled={saving}
                    >
                      {saving && savingType === 'agent' ? <><Spinner size={14} /> Saving...</> : 'Activate'}
                    </button>
                  )}
                </div>
                <div className="jug-embed-reference">
                  <p className="jug-embed-reference-label">Script tag the plugin adds</p>
                  <CodeBlock code={agentCode} language="html" />
                </div>
                {activatedType === 'chatbot' && (
                  <p className="jug-embed-removed-note">Activating this will replace the Simple Chatbot widget.</p>
                )}
              </div>
            </div>

            <p className="jug-embed-footnote">
              Themes that remove <code className="jug-embed-inline-code">wp_footer</code> may not
              show the widget until the footer hook is restored.
            </p>

            {error && <p className="jug-ai-error">{error}</p>}

            {activatedType && (
              <div className="jug-embed-remove-area">
                <span className="jug-embed-remove-text">
                  {confirmRemove ? 'Are you sure you want to remove the widget?' : 'No longer need the widget on your site?'}
                </span>
                <div className="jug-embed-remove-actions">
                  {confirmRemove ? (
                    <>
                      <button
                        type="button"
                        className="jug-embed-remove-btn confirm"
                        onClick={handleRemoveWidget}
                        disabled={removing}
                      >
                        {removing ? <><Spinner size={12} /> Removing...</> : 'Yes, remove'}
                      </button>
                      <button
                        type="button"
                        className="jug-embed-remove-btn cancel"
                        onClick={() => setConfirmRemove(false)}
                        disabled={removing}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="jug-embed-remove-btn"
                      onClick={() => setConfirmRemove(true)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
