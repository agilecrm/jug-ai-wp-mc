import { useState, useEffect } from '@wordpress/element';
import api from '../api';
import type { Bot, PluginSettings } from '../types';
import BotCard from '../components/dashboard/BotCard';
import BotEditModal from '../components/dashboard/BotEditModal';
import StatsOverview from '../components/dashboard/StatsOverview';
import Spinner from '../components/shared/Spinner';

export default function DashboardPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [settings, setSettings] = useState<PluginSettings>(window.jugAiConfig.settings);
  const [loading, setLoading] = useState(true);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [error, setError] = useState('');

  const fetchBots = async () => {
    try {
      const data = await api.get('bots');
      setBots(Array.isArray(data) ? data : data.bots || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBots(); }, []);

  const handleToggleWidget = async () => {
    const updated = { ...settings, widget_enabled: !settings.widget_enabled };
    await api.post('settings', updated);
    setSettings(updated);
  };

  const handleSetActive = async (uuid: string) => {
    const updated = { ...settings, active_bot_uuid: uuid };
    await api.post('settings', updated);
    setSettings(updated);
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm('Delete this bot? This cannot be undone.')) return;
    await api.del(`bots/${uuid}`);
    setBots(bots.filter((b) => b.uuid !== uuid));
  };

  const handleSaveEdit = async (uuid: string, data: Partial<Bot>) => {
    await api.put(`bots/${uuid}`, data);
    setEditingBot(null);
    fetchBots();
  };

  if (loading) {
    return <div className="jug-ai-center"><Spinner size={32} /></div>;
  }

  return (
    <div className="jug-ai-dashboard">
      <div className="jug-ai-page-header">
        <h2>Dashboard</h2>
        <div className="jug-ai-widget-toggle">
          <label className="jug-ai-switch">
            <input
              type="checkbox"
              checked={settings.widget_enabled}
              onChange={handleToggleWidget}
            />
            <span className="jug-ai-switch-slider" />
          </label>
          <span>Widget {settings.widget_enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>

      {error && <p className="jug-ai-error">{error}</p>}

      <StatsOverview activeBotUuid={settings.active_bot_uuid} />

      <div className="jug-ai-bot-grid">
        {bots.map((bot) => (
          <BotCard
            key={bot.uuid}
            bot={bot}
            isActive={bot.uuid === settings.active_bot_uuid}
            onEdit={() => setEditingBot(bot)}
            onSetActive={() => handleSetActive(bot.uuid)}
            onDelete={() => handleDelete(bot.uuid)}
          />
        ))}
      </div>

      {bots.length === 0 && (
        <div className="jug-ai-empty-state">
          <p>No bots yet.</p>
          <a href="#/onboarding" className="jug-ai-btn-primary">Create Your First Bot</a>
        </div>
      )}

      {editingBot && (
        <BotEditModal
          bot={editingBot}
          onSave={handleSaveEdit}
          onClose={() => setEditingBot(null)}
        />
      )}
    </div>
  );
}
