import { useState } from '@wordpress/element';
import CodeBlock from '../shared/CodeBlock';

interface Props {
  open: boolean;
  onClose: () => void;
  botUuid: string | undefined;
  botName: string;
  widgetType: string;
  hostname: string;
}

const PLATFORMS = [
  { id: 'html' as const, label: 'HTML', icon: 'code' },
  { id: 'shopify' as const, label: 'Shopify', icon: 'shop' },
  { id: 'wordpress' as const, label: 'WordPress', icon: 'globe' },
] as const;

type Platform = typeof PLATFORMS[number]['id'];

export default function EmbedModal({ open, onClose, botUuid, botName, widgetType, hostname }: Props) {
  const [embedType, setEmbedType] = useState<'chatbot' | 'agent'>(
    widgetType === 'agent' ? 'agent' : 'chatbot'
  );
  const [platform, setPlatform] = useState<Platform>('html');

  if (!open) return null;

  const chatWidgetSrc = 'https://app.jug.ai/chat.min.js';
  const agentWidgetSrc = 'https://app.jug.ai/agent.min.js';

  const chatbotScript = botUuid
    ? `<script id="jug-ai-chat" src="${chatWidgetSrc}" data-bot="${botUuid}"></script>`
    : '';
  const agentScript = botUuid
    ? `<script id="jug-ai-agent" src="${agentWidgetSrc}" data-bot="${botUuid}"></script>`
    : '';
  const embedScript = embedType === 'agent' ? agentScript : chatbotScript;

  return (
    <div className="jug-ai-modal-overlay" onClick={onClose}>
      <div className="jug-ai-modal jug-ai-modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="jug-ai-modal-header">
          <h3>Embed on {hostname || 'your site'}</h3>
          <button type="button" className="jug-ai-modal-close" onClick={onClose}>&times;</button>
        </div>

        {!botUuid ? (
          <p className="jug-ai-muted" style={{ textAlign: 'center', padding: '32px 0' }}>
            No bot found. Create one first.
          </p>
        ) : (
          <div style={{ padding: '0 0 8px' }}>
            {/* Widget type toggle */}
            <div className="jug-embed-type-toggle">
              <span>Widget:</span>
              <div className="jug-embed-type-buttons">
                <button
                  type="button"
                  className={`jug-embed-type-btn${embedType === 'chatbot' ? ' active' : ''}`}
                  onClick={() => setEmbedType('chatbot')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  Chatbot
                </button>
                <button
                  type="button"
                  className={`jug-embed-type-btn${embedType === 'agent' ? ' active' : ''}`}
                  onClick={() => setEmbedType('agent')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                  Agent
                </button>
              </div>
            </div>

            {/* Platform / code area */}
            <div className="jug-embed-panel">
              <div className="jug-embed-platforms">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`jug-embed-platform-btn${platform === p.id ? ' active' : ''}`}
                    onClick={() => setPlatform(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="jug-embed-code-area">
                {platform === 'html' && (
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--jug-text-muted)' }}>
                    Paste before the closing <code style={{ background: 'var(--jug-bg)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>&lt;/body&gt;</code> tag:
                  </p>
                )}
                {platform === 'shopify' && (
                  <ol className="jug-embed-instructions">
                    <li>Go to Shopify Admin &rarr; Online Store &rarr; Themes</li>
                    <li>Click "Edit Code" on your active theme</li>
                    <li>Open <code>theme.liquid</code></li>
                    <li>Paste the script before <code>&lt;/body&gt;</code></li>
                    <li>Save and preview</li>
                  </ol>
                )}
                {platform === 'wordpress' && (
                  <ol className="jug-embed-instructions">
                    <li>Go to WordPress Admin &rarr; Appearance &rarr; Theme File Editor</li>
                    <li>Select <code>footer.php</code></li>
                    <li>Paste the script before <code>&lt;/body&gt;</code></li>
                    <li>Or use the "Insert Headers and Footers" plugin</li>
                  </ol>
                )}
                <CodeBlock code={embedScript} language="html" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
