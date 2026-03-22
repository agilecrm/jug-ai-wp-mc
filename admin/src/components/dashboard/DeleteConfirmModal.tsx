import { useState } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface Props {
  open: boolean;
  onClose: () => void;
  botUuid: string | undefined;
  botName: string;
  onDeleted: () => void;
}

export default function DeleteConfirmModal({ open, onClose, botUuid, botName, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);

  if (!open) return null;

  async function handleDelete() {
    if (!botUuid) return;
    setDeleting(true);
    try {
      await api.del(`bots/${botUuid}`);
      onDeleted();
      onClose();
    } catch {
      // Still close on error -- the bot may already be gone
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="jug-ai-confirm-overlay" onClick={() => !deleting && onClose()}>
      <div className="jug-ai-confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="jug-ai-confirm-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        <h3 className="jug-ai-confirm-title">Delete Bot</h3>
        <p className="jug-ai-confirm-message">
          This will permanently delete <strong>{botName || 'this bot'}</strong> and all its data
          including training embeddings and chat history. This cannot be undone.
        </p>
        <div className="jug-ai-confirm-actions">
          <button
            type="button"
            className="jug-ai-confirm-cancel"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="jug-ai-confirm-proceed"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Spinner size={16} /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
