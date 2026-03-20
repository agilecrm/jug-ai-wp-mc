import { useState } from '@wordpress/element';
import type { Bot } from '../../types';
import Spinner from '../shared/Spinner';

interface Props {
  bot: Bot;
  onSave: (uuid: string, data: Partial<Bot>) => Promise<void>;
  onClose: () => void;
}

export default function BotEditModal({ bot, onSave, onClose }: Props) {
  const [name, setName] = useState(bot.name);
  const [prompt, setPrompt] = useState(bot.system_prompt || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await onSave(bot.uuid, { name, system_prompt: prompt });
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <div className="jug-ai-modal-overlay" onClick={onClose}>
      <div className="jug-ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jug-ai-modal-header">
          <h3>Edit Bot</h3>
          <button type="button" className="jug-ai-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="jug-ai-field">
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div className="jug-ai-field">
            <label htmlFor="edit-prompt">System Prompt</label>
            <textarea
              id="edit-prompt"
              value={prompt}
              onChange={(e) => setPrompt((e.target as HTMLTextAreaElement).value)}
              rows={10}
              className="jug-ai-textarea"
            />
          </div>

          {error && <p className="jug-ai-error">{error}</p>}

          <div className="jug-ai-modal-actions">
            <button type="button" className="jug-ai-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="jug-ai-btn-primary" disabled={saving}>
              {saving ? <Spinner size={18} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
