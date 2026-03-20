import { useState, useEffect } from '@wordpress/element';
import api from '../api';
import type { Bot, PluginSettings } from '../types';
import Spinner from '../components/shared/Spinner';

interface Props {
  onLogout: () => void;
}

export default function SettingsPage({ onLogout }: Props) {
  const [settings, setSettings] = useState<PluginSettings>(window.jugAiConfig.settings);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('settings'),
      api.get('bots'),
    ]).then(([settingsData, botsData]) => {
      setSettings(settingsData.settings || settingsData);
      setBots(Array.isArray(botsData) ? botsData : botsData.bots || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.post('settings', settings);
      setMessage('Settings saved.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    await api.post('auth/logout');
    onLogout();
  };

  if (loading) {
    return <div className="jug-ai-center"><Spinner size={32} /></div>;
  }

  return (
    <div className="jug-ai-settings">
      <h2>Settings</h2>

      <div className="jug-ai-card">
        <h3>Widget Settings</h3>

        <div className="jug-ai-field">
          <label>Active Bot</label>
          <select
            value={settings.active_bot_uuid}
            onChange={(e) => setSettings({ ...settings, active_bot_uuid: (e.target as HTMLSelectElement).value })}
            className="jug-ai-select"
          >
            <option value="">-- Select a bot --</option>
            {bots.map((b) => (
              <option key={b.uuid} value={b.uuid}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="jug-ai-field">
          <label>Widget Type</label>
          <div className="jug-ai-radio-group">
            <label>
              <input
                type="radio"
                name="widget_type"
                value="chatbot"
                checked={settings.widget_type === 'chatbot'}
                onChange={() => setSettings({ ...settings, widget_type: 'chatbot' })}
              />
              Chatbot
            </label>
            <label>
              <input
                type="radio"
                name="widget_type"
                value="agent"
                checked={settings.widget_type === 'agent'}
                onChange={() => setSettings({ ...settings, widget_type: 'agent' })}
              />
              Agent
            </label>
          </div>
        </div>

        <div className="jug-ai-field">
          <label className="jug-ai-switch-label">
            <span>Enable Widget</span>
            <label className="jug-ai-switch">
              <input
                type="checkbox"
                checked={settings.widget_enabled}
                onChange={(e) => setSettings({ ...settings, widget_enabled: (e.target as HTMLInputElement).checked })}
              />
              <span className="jug-ai-switch-slider" />
            </label>
          </label>
        </div>

        <div className="jug-ai-field">
          <label>Display On</label>
          <select
            value={settings.display_on}
            onChange={(e) => setSettings({ ...settings, display_on: (e.target as HTMLSelectElement).value as any })}
            className="jug-ai-select"
          >
            <option value="all">All Pages</option>
            <option value="specific">Specific Pages Only</option>
            <option value="exclude">All Pages Except...</option>
          </select>
        </div>

        {settings.display_on !== 'all' && (
          <div className="jug-ai-field">
            <label>Page IDs or Slugs (comma-separated)</label>
            <input
              type="text"
              value={(settings.display_pages || []).join(', ')}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  display_pages: (e.target as HTMLInputElement).value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="e.g. 42, about, contact"
            />
          </div>
        )}

        <button
          type="button"
          className="jug-ai-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Spinner size={18} /> : 'Save Settings'}
        </button>

        {message && <p className={message.startsWith('Error') ? 'jug-ai-error' : 'jug-ai-success'}>{message}</p>}
      </div>

      <div className="jug-ai-card">
        <h3>Account</h3>
        <button type="button" className="jug-ai-btn-danger" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      <div className="jug-ai-card">
        <h3>Advanced</h3>
        <div className="jug-ai-field">
          <label>Custom API URL (leave blank for default)</label>
          <input
            type="url"
            value={settings.custom_api_url || ''}
            onChange={(e) => setSettings({ ...settings, custom_api_url: (e.target as HTMLInputElement).value })}
            placeholder="https://app.jug.ai/api"
          />
        </div>
        <button
          type="button"
          className="jug-ai-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Spinner size={18} /> : 'Save'}
        </button>
      </div>
    </div>
  );
}
