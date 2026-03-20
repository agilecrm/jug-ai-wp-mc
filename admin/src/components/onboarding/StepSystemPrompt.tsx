import { useState, useEffect } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface Props {
  companyInfo: any;
  website: string;
  onBotCreated: (uuid: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepSystemPrompt({ companyInfo, website, onBotCreated, onNext, onBack }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generatePrompt();
  }, []);

  const generatePrompt = async () => {
    try {
      const result = await api.post('bots/generate-prompt', {
        company_name: companyInfo?.name || '',
        company_description: companyInfo?.description || '',
        industry: companyInfo?.industry || '',
        website,
      });
      setPrompt(result.prompt || result.system_prompt || '');
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompt.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const result = await api.post('bots', {
        name: companyInfo?.name || window.jugAiConfig.siteName || 'My Bot',
        site_url: website,
        system_prompt: prompt,
      });
      const uuid = result.uuid || result.bot?.uuid || '';
      onBotCreated(uuid);
      onNext();
    } catch (err: any) {
      setError(err.message || 'Failed to create bot.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="jug-ai-step">
        <h3>Generating System Prompt</h3>
        <div className="jug-ai-center"><Spinner size={32} /></div>
        <p className="jug-ai-center">AI is creating a custom prompt for your chatbot...</p>
      </div>
    );
  }

  return (
    <div className="jug-ai-step">
      <h3>System Prompt</h3>
      <p>This prompt defines how your AI chatbot will behave. Feel free to edit it.</p>

      <div className="jug-ai-field">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
          rows={12}
          className="jug-ai-textarea"
        />
      </div>

      {error && <p className="jug-ai-error">{error}</p>}

      <div className="jug-ai-step-actions">
        <button type="button" className="jug-ai-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="jug-ai-btn-primary"
          onClick={handleSave}
          disabled={saving || !prompt}
        >
          {saving ? <Spinner size={18} /> : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
