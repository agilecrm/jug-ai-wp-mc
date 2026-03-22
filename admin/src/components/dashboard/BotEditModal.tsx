import { useState, useEffect, useRef } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface Props {
  open: boolean;
  onClose: () => void;
  botUuid: string | undefined;
  onSaved?: () => void;
}

const MAX_TOKEN_OPTIONS = [
  { value: 200, label: '200' },
  { value: 300, label: '300' },
  { value: 500, label: '500' },
];

const CHAT_MODEL_OPTIONS = [
  { value: 'rapid', label: 'Rapid Reply' },
  { value: 'regular', label: 'Regular' },
  { value: 'advanced', label: 'Advanced' },
];

const PROMPT_TEMPLATES = [
  { name: 'Default', prompt: "You're a chatbot trained to interact with visitors. Your purpose is to: 1. Gather visitor details like name, phone number, or email. 2. Assess their interest in scheduling a product demo.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope.\n- Start each conversation with a friendly greeting.\n- Keep responses under 90 words.\n- Use a friendly and professional tone." },
  { name: 'Sales', prompt: "You're a chatbot trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Qualify leads and assess interest in products or services.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Start with a friendly greeting and ask how you can help.\n- Focus on identifying sales opportunities.\n- Use a professional tone." },
  { name: 'Support', prompt: "You're a support chatbot trained to help website visitors. Your purpose is to:\n1. Answer questions about products and services.\n2. Help troubleshoot common issues.\n\nGuidelines:\n- Only use information from your training material.\n- Be helpful, patient, and professional.\n- If you can't answer, suggest contacting support directly.\n- Keep responses clear and concise." },
  { name: 'Book a Demo', prompt: "You're a chatbot trained to help visitors book demos. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Schedule product or service demos.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Start with a friendly greeting.\n- Keep the conversation focused on booking demos.\n- Use a friendly and professional tone." },
  { name: 'E-commerce', prompt: "You're a chatbot trained to help shoppers. Your purpose is to:\n1. Help visitors find the right products.\n2. Answer questions about products, pricing, and shipping.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Start with a friendly greeting.\n- Help guide the shopping experience.\n- Use a friendly and professional tone." },
  { name: 'Real Estate', prompt: "You're a chatbot trained to help with property inquiries. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Help visitors find properties and answer real estate questions.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Start with a friendly greeting.\n- Focus on property inquiries.\n- Use a friendly and professional tone." },
];

export default function BotEditModal({ open, onClose, botUuid, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(200);
  const [chatModel, setChatModel] = useState('rapid');
  const [botType, setBotType] = useState('chatbot');
  const [siteUrl, setSiteUrl] = useState('');
  const [error, setError] = useState('');
  const originalPromptRef = useRef('');

  useEffect(() => {
    if (!open || !botUuid) return;
    setLoading(true);
    setError('');
    api.get(`bots/${botUuid}`)
      .then((data: any) => {
        setName(data.name || '');
        setPrompt(data.system_prompt || data.prompt || '');
        setMaxTokens(data.max_tokens ?? data.maxTokens ?? 200);
        setChatModel(data.chat_model ?? data.chatModel ?? 'rapid');
        setBotType(data.widget_type ?? data.type ?? 'chatbot');
        setSiteUrl(data.site_url || '');
        originalPromptRef.current = data.system_prompt || data.prompt || '';
      })
      .catch((err: any) => setError(err.message || 'Failed to load bot'))
      .finally(() => setLoading(false));
  }, [open, botUuid]);

  if (!open) return null;

  async function handleSave() {
    if (!botUuid || !name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`bots/${botUuid}`, {
        name,
        prompt,
        system_prompt: prompt,
        max_tokens: maxTokens,
        chat_model: chatModel,
      });
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateWithAI() {
    setGenerating(true);
    setError('');
    try {
      const data = await api.post('bots/generate-prompt', {
        company_name: name || 'Unknown',
        website_url: siteUrl || undefined,
      });
      if (data?.prompt) {
        setPrompt(data.prompt);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompt');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="jug-ai-modal-overlay" onClick={onClose}>
      <div
        className="jug-ai-modal jug-ai-modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="jug-ai-modal-header">
          <h3>Edit {botType === 'agent' ? 'Agent' : 'Chatbot'}</h3>
          <button type="button" className="jug-ai-modal-close" onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div className="jug-ai-center"><Spinner size={32} /></div>
        ) : error && !name ? (
          <p className="jug-ai-error" style={{ padding: '24px', textAlign: 'center' }}>{error}</p>
        ) : (
          <>
            <div className="jug-edit-panels">
              {/* Left panel */}
              <div className="jug-edit-left">
                <div className="jug-ai-field">
                  <label>Bot Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName((e.target as HTMLInputElement).value)}
                    maxLength={50}
                    placeholder="Enter bot name"
                  />
                </div>

                <div className="jug-ai-field">
                  <label>Max Tokens</label>
                  <select
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number((e.target as HTMLSelectElement).value))}
                    className="jug-ai-select"
                  >
                    {MAX_TOKEN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="jug-ai-field">
                  <label>Chat Model</label>
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel((e.target as HTMLSelectElement).value)}
                    className="jug-ai-select"
                  >
                    {CHAT_MODEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {chatModel === 'rapid' && (
                    <span className="jug-ai-muted" style={{ marginTop: 4, display: 'block' }}>
                      Upgrade to use functions
                    </span>
                  )}
                </div>
              </div>

              {/* Right panel */}
              <div className="jug-edit-right">
                <div className="jug-ai-field" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="jug-prompt-toolbar">
                    <label>System Prompt</label>
                    <div className="jug-prompt-actions">
                      <button
                        type="button"
                        className="jug-prompt-action-link"
                        onClick={handleGenerateWithAI}
                        disabled={generating}
                      >
                        {generating && <Spinner size={14} />}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                        {prompt !== originalPromptRef.current ? 'Regenerate' : 'Generate with AI'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="jug-ai-textarea"
                    rows={12}
                    value={prompt}
                    onChange={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
                    placeholder="Enter the system prompt for your bot..."
                    disabled={generating}
                    style={{ flex: 1 }}
                  />
                  {generating && (
                    <p className="jug-ai-muted" style={{ marginTop: 4 }}>
                      Generating a prompt based on your bot profile...
                    </p>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="jug-ai-muted" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
                    Quick Templates
                  </label>
                  <div className="jug-step-template-chips">
                    {PROMPT_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        className="jug-step-template-chip"
                        onClick={() => setPrompt(tpl.prompt)}
                        disabled={generating}
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="jug-ai-error" style={{ padding: '0 28px' }}>{error}</p>}

            <div className="jug-ai-modal-actions">
              <button type="button" className="jug-ai-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="jug-ai-btn-primary"
                onClick={handleSave}
                disabled={saving || !name.trim()}
              >
                {saving ? <Spinner size={16} /> : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
