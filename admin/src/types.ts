export interface Bot {
  uuid: string;
  name: string;
  site_url: string;
  system_prompt: string;
  status: string;
  widget_type: string;
  message_count?: number;
  session_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  fingerprint: string;
  message_count: number;
  first_message: string;
  first_message_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface BotStats {
  total_messages: number;
  total_sessions: number;
  daily_messages: Array<{ date: string; count: number }>;
  daily_sessions: Array<{ date: string; count: number }>;
  hourly_activity: Array<{ hour: number; count: number }>;
}

export interface PluginSettings {
  active_bot_uuid: string;
  widget_type: 'chatbot' | 'agent';
  widget_enabled: boolean;
  display_on: 'all' | 'specific' | 'exclude';
  display_pages: string[];
  custom_api_url?: string;
}

declare global {
  interface Window {
    jugAiConfig: {
      restUrl: string;
      nonce: string;
      siteUrl: string;
      siteName: string;
      isLoggedIn: boolean;
      settings: PluginSettings;
    };
  }
}
