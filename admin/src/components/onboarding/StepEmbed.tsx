import { useMemo, useState } from '@wordpress/element';
import { useOnboarding } from '../../context/OnboardingContext';
import api from '../../api';
import CodeBlock from '../shared/CodeBlock';
import Spinner from '../shared/Spinner';

function getWidgetBase(): string {
  const raw = window.jugAiConfig.widgetBase || 'https://app.jug.ai';
  return raw.replace(/\/$/, '');
}

export default function StepEmbed() {
  const { botUuid, websiteUrl, companyInfo, close, completeStep, onAuthRequired } = useOnboarding();

  const [widgetType, setWidgetType] = useState<'chatbot' | 'agent'>('chatbot');
  const [activatedType, setActivatedType] = useState<'chatbot' | 'agent' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const widgetBase = useMemo(() => getWidgetBase(), []);

  const chatbotCode = useMemo(() => {
    return `<script id="jug-ai-chat" src="${widgetBase}/chat.min.js" data-bot="${botUuid}"></script>`;
  }, [widgetBase, botUuid]);

  const agentCode = useMemo(() => {
    return `<script id="jug-ai-agent" src="${widgetBase}/agent.min.js" data-bot="${botUuid}"></script>`;
  }, [widgetBase, botUuid]);

  const handleActivate = async (type: 'chatbot' | 'agent') => {
    if (!window.jugAiConfig.isLoggedIn) {
      onAuthRequired();
      return;
    }

    setSaving(true);
    setError('');

    try {
      const siteName = companyInfo?.name || websiteUrl || '';
      await api.post('settings', {
        active_bot_uuid: botUuid,
        widget_type: type,
        widget_enabled: true,
        site_name: siteName,
      });
      // Update local config so HomePage picks it up immediately
      if (window.jugAiConfig?.settings) {
        window.jugAiConfig.settings.site_name = siteName;
      }
      setActivatedType(type);
      completeStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleGoToBot = () => {
    close();
    window.location.hash = '#/dashboard';
    window.location.reload();
  };

  return (
    <div className="jug-step-layout">
      <div className="jug-step-body">
        <div className="jug-step-header">
          <h2>Add to your website</h2>
          <button type="button" className="jug-onboarding-close" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="jug-step-subtitle">
          Choose the widget type. After you activate, the plugin injects the same script on your
          site via <code className="jug-embed-inline-code">wp_footer</code>.
        </p>

        <div className="jug-embed-type-toggle">
          <span className="jug-embed-type-label">Widget type</span>
        </div>

        <div className="jug-embed-stack">
          {/* Simple Chatbot card */}
          <div className="jug-embed-widget-card">
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
                  {saving && widgetType === 'chatbot' ? <><Spinner size={14} /> Saving...</> : 'Activate Widget'}
                </button>
              )}
            </div>
            <div className="jug-embed-reference">
              <p className="jug-embed-reference-label">Reference — script tag the plugin adds</p>
              <CodeBlock code={chatbotCode} language="html" />
            </div>
            {activatedType === 'agent' && (
              <p className="jug-embed-removed-note jug-ai-muted">This widget is not active. Activating it will replace the Agent widget.</p>
            )}
          </div>

          {/* Agent card */}
          <div className="jug-embed-widget-card">
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
                  {saving && widgetType === 'agent' ? <><Spinner size={14} /> Saving...</> : 'Activate Widget'}
                </button>
              )}
            </div>
            <div className="jug-embed-reference">
              <p className="jug-embed-reference-label">Reference — script tag the plugin adds</p>
              <CodeBlock code={agentCode} language="html" />
            </div>
            {activatedType === 'chatbot' && (
              <p className="jug-embed-removed-note jug-ai-muted">This widget is not active. Activating it will replace the Simple Chatbot widget.</p>
            )}
          </div>

          <p className="jug-embed-footnote jug-ai-muted">
            Themes that remove <code className="jug-embed-inline-code">wp_footer</code> may not
            show the widget until the footer hook is restored.
          </p>
        </div>

        {error && <p className="jug-ai-error">{error}</p>}

        {activatedType && (
          <div className="jug-ai-success-box">
            <p>🎉 {activatedType === 'chatbot' ? 'Simple Chatbot' : 'Agent'} widget is now live on your site!</p>
          </div>
        )}
      </div>

      <div className="jug-step-footer">
        <button
          type="button"
          className="jug-ai-btn-primary"
          onClick={handleGoToBot}
        >
          Go to Bot
        </button>
      </div>
    </div>
  );
}
