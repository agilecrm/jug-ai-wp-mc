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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const widgetBase = useMemo(() => getWidgetBase(), []);

  const embedCode = useMemo(() => {
    if (widgetType === 'agent') {
      return `<script id="jug-ai-agent" src="${widgetBase}/agent.min.js" data-bot="${botUuid}"></script>`;
    }
    return `<script id="jug-ai-chat" src="${widgetBase}/chat.min.js" data-bot="${botUuid}"></script>`;
  }, [widgetType, widgetBase, botUuid]);

  const handleActivate = async () => {
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
        widget_type: widgetType,
        widget_enabled: true,
        site_name: siteName,
      });
      // Update local config so HomePage picks it up immediately
      if (window.jugAiConfig?.settings) {
        window.jugAiConfig.settings.site_name = siteName;
      }
      setSaved(true);
      completeStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    close();
    window.location.hash = '#/dashboard';
    window.location.reload();
  };

  return (
    <div className="jug-step-layout">
      <div className="jug-step-body">
        <div className="jug-step-header">
          <h2>Add to your website</h2>
          <span className="jug-step-badge">WordPress</span>
        </div>
        <p className="jug-step-subtitle">
          Choose the widget type. After you activate, the plugin injects the same script on your
          site via <code className="jug-embed-inline-code">wp_footer</code>.
        </p>

        <div className="jug-embed-type-toggle">
          <span className="jug-embed-type-label">Widget type</span>
          <div className="jug-embed-type-buttons">
            <button
              type="button"
              className={`jug-embed-type-btn ${widgetType === 'chatbot' ? 'active' : ''}`}
              onClick={() => setWidgetType('chatbot')}
            >
              💬 Chatbot
            </button>
            <button
              type="button"
              className={`jug-embed-type-btn ${widgetType === 'agent' ? 'active' : ''}`}
              onClick={() => setWidgetType('agent')}
            >
              ⚡ Agent
            </button>
          </div>
        </div>

        <div className="jug-embed-stack">
          <div className="jug-embed-info jug-ai-success-box">
            <p className="jug-embed-info-title">Auto-injected by this plugin</p>
            <p className="jug-ai-muted jug-embed-info-text">
              You do not need to paste code into your theme. Click &quot;Activate Widget&quot; and
              visitors will see the widget on your site (according to your display settings).
            </p>
          </div>

          <div className="jug-embed-reference">
            <p className="jug-embed-reference-label">Reference — script tag the plugin adds</p>
            <p className="jug-ai-muted jug-embed-reference-hint">
              For support or custom setups, this matches what{' '}
              <code className="jug-embed-inline-code">wp_footer</code> outputs.
            </p>
            <CodeBlock code={embedCode} language="html" />
          </div>

          <p className="jug-embed-footnote jug-ai-muted">
            Themes that remove <code className="jug-embed-inline-code">wp_footer</code> may not
            show the widget until the footer hook is restored.
          </p>
        </div>

        {error && <p className="jug-ai-error">{error}</p>}

        {saved && (
          <div className="jug-ai-success-box">
            <p>🎉 Widget is now live on your site!</p>
          </div>
        )}
      </div>

      <div className="jug-step-footer">
        {saved ? (
          <button type="button" className="jug-ai-btn-primary" onClick={handleFinish}>
            Go to Dashboard
          </button>
        ) : (
          <button
            type="button"
            className="jug-ai-btn-primary"
            onClick={handleActivate}
            disabled={saving}
          >
            {saving ? <><Spinner size={16} /> Saving...</> : 'Activate Widget'}
          </button>
        )}
      </div>
    </div>
  );
}
