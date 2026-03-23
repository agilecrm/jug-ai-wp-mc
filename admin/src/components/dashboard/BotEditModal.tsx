import { useState, useEffect, useRef } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface Props {
  open: boolean;
  onClose: () => void;
  botUuid: string | undefined;
  widgetType?: 'chatbot' | 'agent';
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
  { name: 'Default', prompt: "You're a chatbot named Kong, trained to interact with visitors. Your purpose is to: 1. Gather visitor details like name, phone number, or email. 2. Assess their interest in scheduling a product demo. \n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assist the visitor today.\n- Keep the conversation brief, focused on generating leads and scheduling demos.\n- Ensure responses are less than 90 words.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Sales', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in your products or services and qualify leads.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess the visitor's needs.\n- Keep the conversation brief, focused on identifying sales opportunities.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Marketing', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in current marketing campaigns, offers, and new product launches.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their interest in your marketing promotions.\n- Keep the conversation brief, focused on marketing promotions and visitor engagement.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Human Resources', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in job inquiries, application processes, and employee benefits.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their HR-related needs.\n- Keep the conversation brief, focused on job opportunities and HR support.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Book a Demo', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in scheduling a product or service demo.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their interest in booking a demo.\n- Keep the conversation brief, focused on booking demos.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Services', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in the services offered by your company.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their interest in your services.\n- Keep the conversation brief, focused on explaining services.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Product Features', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in learning more about product features.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their interest in product features.\n- Keep the conversation brief, focused on highlighting key features.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Healthcare', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in healthcare services, such as consultations, treatments, or wellness programs.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their healthcare needs.\n- Keep the conversation brief, focused on healthcare services.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Real Estate', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in buying, selling, or renting properties.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their real estate needs.\n- Keep the conversation brief, focused on property inquiries.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'E-commerce', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in products available for purchase and guide them through the shopping process.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their shopping needs.\n- Keep the conversation brief, focused on helping them find the right products.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Education', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in educational programs, courses, or admissions.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their educational needs.\n- Keep the conversation brief, focused on educational offerings.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
  { name: 'Hospitality', prompt: "You're a chatbot named Kong AI Assistant, trained to interact with website visitors. Your purpose is to:\n1. Gather visitor details like name, phone number, or email.\n2. Assess their interest in booking accommodations, dining reservations, or event spaces.\n\nGuidelines:\n- Discuss only information covered in your training material.\n- Avoid making inferences or answering questions outside your knowledge scope. Politely state that you don't have information on that if asked.\n- Start each conversation with a friendly greeting and ask how you can assess their hospitality needs.\n- Keep the conversation brief, focused on booking inquiries.\n- Use a friendly and professional tone, incorporating emojis to enhance warmth and approachability." },
];

export default function BotEditModal({ open, onClose, botUuid, widgetType, onSaved }: Props) {
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
        setBotType(widgetType || data.widget_type || data.type || 'chatbot');
        setSiteUrl(data.site_url || data.domain || '');
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
                </div>
              </div>

              {/* Right panel */}
              <div className="jug-edit-right">
                <div className="jug-ai-field" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="jug-prompt-toolbar">
                    <label>Prompt</label>
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

                <div style={{ marginTop: 8 }}>
                  <label className="jug-ai-muted" style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
                    Quick Prompt
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

            {error && <p className="jug-ai-error" style={{ padding: '0 24px' }}>{error}</p>}

            <div className="jug-ai-modal-actions">
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
