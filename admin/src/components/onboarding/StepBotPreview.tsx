import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { useOnboarding } from '../../context/OnboardingContext';
import api from '../../api';
import Spinner from '../shared/Spinner';

function getFaviconUrl(websiteUrl: string | undefined): string {
  if (!websiteUrl || typeof websiteUrl !== 'string') {
    return '';
  }
  try {
    const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
}

export default function StepBotPreview() {
  const {
    siteUuid,
    fingerprint,
    botUuid,
    botPrompt,
    agentBotUuid,
    companyInfo,
    websiteUrl,
    completeStep,
    setStep,
    close,
  } = useOnboarding();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: ChatMessage = { role: 'user', message: text };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInputValue('');
      setIsStreaming(true);

      const assistantMsg: ChatMessage = { role: 'assistant', message: '' };
      setMessages([...newMessages, assistantMsg]);

      try {
        const { url, token } = await api.chatStreamUrl();

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: botPrompt,
            botUUID: botUuid,
            messages: newMessages,
            trainingSites: [siteUuid],
            finger_print: fingerprint,
          }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const dataLine = line.replace(/^data:\s*/, '').trim();
              if (!dataLine) continue;
              try {
                const data = JSON.parse(dataLine);
                if (data.content) {
                  fullResponse += data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: 'assistant',
                      message: fullResponse,
                    };
                    return updated;
                  });
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            message: 'Sorry, something went wrong. Please try again.',
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, botPrompt, botUuid, siteUuid, fingerprint],
  );

  function handleContinue() {
    completeStep(3);
    setStep(4);
  }

  const faviconUrl = getFaviconUrl(websiteUrl);
  const headerName = companyInfo?.name || 'Chat Preview';

  const siteUrl = (() => {
    const w = typeof websiteUrl === 'string' ? websiteUrl.trim() : '';
    if (w) {
      return w.startsWith('http') ? w : `https://${w}`;
    }
    const fallback = typeof window !== 'undefined' ? window.jugAiConfig?.siteUrl : '';
    return fallback && fallback.trim() ? fallback.trim() : 'https://example.com';
  })();
  const agentDemoUrl = `https://app.jug.ai/agent-demo/${agentBotUuid}`;
  const chatPreviewUrl = `https://app.jug.ai/chat-preview?bot=${botUuid}&url=${encodeURIComponent(siteUrl)}`;

  return (
    <div className="jug-step-layout">
      <div className="jug-step-body">
        <div className="jug-step-header">
          <h2>Preview your bot</h2>
          <button type="button" className="jug-onboarding-close" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="jug-step-subtitle">
          Test your chatbot by sending messages below. Make sure it responds the way you want before embedding.
        </p>

        <div className="jug-preview-grid">
          {/* Agent column */}
          <div className="jug-preview-column">
            <h3 className="jug-preview-column-title">
              <span>✨</span> Agent
            </h3>
            <div className="jug-preview-agent-card">
              <div className="jug-preview-agent-card-inner">
                <span className="jug-preview-agent-icon">✨</span>
                <p className="jug-preview-agent-title">Agent Preview</p>
                <p className="jug-preview-agent-desc">
                  Preview how your AI agent handles conversations on your website.
                </p>
                <button
                  type="button"
                  className="jug-ai-btn-primary"
                  onClick={() => window.open(agentDemoUrl, '_blank')}
                >
                  🔗 Open in new tab
                </button>
              </div>
            </div>
          </div>

          {/* Simple Chatbot column */}
          <div className="jug-preview-column">
            <h3 className="jug-preview-column-title">
              <span>💬</span> Simple Chatbot
            </h3>
            <div className="jug-chat-preview">
              <div className="jug-chat-preview-header">
                {faviconUrl && !faviconError ? (
                  <img
                    src={faviconUrl}
                    alt=""
                    className="jug-chat-preview-favicon"
                    onError={() => setFaviconError(true)}
                  />
                ) : (
                  <span className="jug-chat-preview-icon">💬</span>
                )}
                <span>{headerName}</span>
              </div>
              <div className="jug-chat-preview-messages">
                <div className="jug-chat-msg jug-chat-msg-bot">
                  Hi there! 👋 How can I help you today?
                </div>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`jug-chat-msg ${msg.role === 'user' ? 'jug-chat-msg-user' : 'jug-chat-msg-bot'}`}
                  >
                    {msg.message || <Spinner size={16} />}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form
                className="jug-chat-preview-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(inputValue);
                }}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue((e.target as HTMLInputElement).value)}
                  placeholder="Type a message..."
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  className="jug-chat-send-btn"
                  disabled={isStreaming || !inputValue.trim()}
                >
                  &#10148;
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="jug-preview-external-link">
          <a href={chatPreviewUrl} target="_blank" rel="noopener noreferrer">
            🔗 Preview chatbot in new tab
          </a>
        </div>
      </div>

      <div className="jug-step-footer">
        <button type="button" className="jug-ai-btn-primary" onClick={handleContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}
