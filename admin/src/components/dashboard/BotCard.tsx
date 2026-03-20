import type { Bot } from '../../types';

interface Props {
  bot: Bot;
  isActive: boolean;
  onEdit: () => void;
  onSetActive: () => void;
  onDelete: () => void;
}

export default function BotCard({ bot, isActive, onEdit, onSetActive, onDelete }: Props) {
  return (
    <div className={`jug-ai-bot-card ${isActive ? 'active' : ''}`}>
      <div className="jug-ai-bot-card-header">
        <h4>{bot.name}</h4>
        {isActive && <span className="jug-ai-badge jug-ai-badge-active">Active</span>}
        <span className={`jug-ai-badge jug-ai-badge-${bot.status || 'ready'}`}>
          {bot.status || 'Ready'}
        </span>
      </div>

      {bot.site_url && (
        <p className="jug-ai-bot-url">{bot.site_url}</p>
      )}

      <div className="jug-ai-bot-stats">
        {bot.message_count !== undefined && (
          <span>{bot.message_count} messages</span>
        )}
        {bot.session_count !== undefined && (
          <span>{bot.session_count} sessions</span>
        )}
      </div>

      <div className="jug-ai-bot-actions">
        <button type="button" className="jug-ai-btn-sm" onClick={onEdit}>
          Edit
        </button>
        <a href={`#/conversations/${bot.uuid}`} className="jug-ai-btn-sm">
          Conversations
        </a>
        {!isActive && (
          <button type="button" className="jug-ai-btn-sm" onClick={onSetActive}>
            Set Active
          </button>
        )}
        <button type="button" className="jug-ai-btn-sm jug-ai-btn-danger-sm" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
