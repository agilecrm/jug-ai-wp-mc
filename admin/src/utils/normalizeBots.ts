import type { Bot } from '../types';

/**
 * WordPress does not store the bot list locally — it comes from the Jug AI API via the REST proxy.
 * Some API responses may nest lists (`bots`, `data`, `items`) or duplicate entries; we merge known
 * keys and dedupe by `uuid` so the dashboard shows one card per bot.
 */
/**
 * The /profile endpoint returns sites with field names that differ from the Bot interface.
 * Map all known API field variants to the canonical Bot shape.
 */
function mapApiBot(item: Record<string, unknown>): Bot {
  const b = item as unknown as Bot;

  // Name: try name, site_name, domain, hostname
  const nameRaw = item.name ?? item.site_name ?? item.siteName ?? item.domain ?? item.hostname;

  // URL: try site_url, url, domain, homepage
  const urlRaw = item.site_url ?? item.siteUrl ?? item.url ?? item.domain ?? item.homepage;

  // System prompt
  const promptRaw = item.system_prompt ?? item.systemPrompt ?? item.prompt ?? '';

  // Status
  const statusRaw = item.status ?? item.training_status ?? item.trainingStatus ?? 'active';

  // Widget type
  const widgetRaw = item.widget_type ?? item.widgetType ?? 'chatbot';

  // Page count
  const pageRaw = item.page_count ?? item.pageCount ?? item.count ?? item.pages_count ?? item.pagesCount;

  // Trained at (unix seconds)
  const trainedRaw = item.trained_at ?? item.trainedAt ?? item.last_trained ?? item.lastTrained;

  // Training status
  const trainingStatusRaw = item.training_status ?? item.trainingStatus;

  // Site UUID
  const siteUuidRaw = item.site_uuid ?? item.siteUuid;

  // Counts
  const msgCount = item.message_count ?? item.messageCount ?? item.messages_count;
  const sessCount = item.session_count ?? item.sessionCount ?? item.sessions_count;

  return {
    ...b,
    name: (typeof nameRaw === 'string' ? nameRaw : b.name) || '',
    site_url: (typeof urlRaw === 'string' ? urlRaw : b.site_url) || '',
    system_prompt: (typeof promptRaw === 'string' ? promptRaw : b.system_prompt) || '',
    status: (typeof statusRaw === 'string' ? statusRaw : b.status) || 'active',
    widget_type: (typeof widgetRaw === 'string' ? widgetRaw : b.widget_type) || 'chatbot',
    page_count: typeof pageRaw === 'number' ? pageRaw : b.page_count,
    trained_at:
      typeof trainedRaw === 'number'
        ? trainedRaw
        : trainedRaw != null
          ? Number(trainedRaw)
          : b.trained_at ?? null,
    training_status: (typeof trainingStatusRaw === 'string' ? trainingStatusRaw : b.training_status) as string | undefined,
    site_uuid: (typeof siteUuidRaw === 'string' ? siteUuidRaw : b.site_uuid) as string | undefined,
    message_count: typeof msgCount === 'number' ? msgCount : b.message_count,
    session_count: typeof sessCount === 'number' ? sessCount : b.session_count,
    scrapped_urls: Array.isArray(item.scrapped_urls) ? (item.scrapped_urls as string[]) : b.scrapped_urls,
  };
}

export function normalizeBotsPayload(data: unknown): Bot[] {
  const raw: unknown[] = [];

  if (data == null) {
    // eslint-disable-next-line no-console
    console.warn('[Jug AI] normalizeBotsPayload received null/undefined — API may have returned an empty body.');
    return [];
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;

    // Build a lookup from siteUuid → { chatbot_uuid, agent_uuid } from the bots array.
    const botsBySite: Record<string, { chatbot_uuid?: string; agent_uuid?: string }> = {};
    if (Array.isArray(o.bots)) {
      for (const b of o.bots) {
        if (b && typeof b === 'object') {
          const bot = b as Record<string, unknown>;
          const botId = (bot.uuid ?? bot._id ?? bot.id) as string | undefined;
          const siteId = (bot.siteUuid ?? bot.site_uuid) as string | undefined;
          const type = (bot.type ?? bot.widget_type ?? bot.widgetType ?? 'chatbot') as string;
          if (botId && siteId) {
            if (!botsBySite[siteId]) botsBySite[siteId] = {};
            if (type === 'agent') {
              botsBySite[siteId].agent_uuid = botId;
            } else {
              botsBySite[siteId].chatbot_uuid = botId;
            }
          }
        }
      }
    }

    // Cards are based on sites — one card per site entry.
    if (Array.isArray(o.sites) && o.sites.length > 0) {
      for (const s of o.sites) {
        if (s && typeof s === 'object') {
          const site = { ...(s as Record<string, unknown>) };
          const siteId = (site.uuid ?? site._id ?? site.id) as string | undefined;
          if (siteId && botsBySite[siteId]) {
            site.chatbot_uuid = botsBySite[siteId].chatbot_uuid;
            site.agent_uuid = botsBySite[siteId].agent_uuid;
          }
          raw.push(site);
        }
      }
    } else if (Array.isArray(o.bots)) {
      // Fallback: if no sites array, use bots directly (legacy)
      raw.push(...o.bots);
    } else if (Array.isArray(o.data)) {
      raw.push(...o.data);
    } else if (Array.isArray(o.items)) {
      raw.push(...o.items);
    } else {
      // eslint-disable-next-line no-console
      console.warn('[Jug AI] normalizeBotsPayload: unexpected response shape', Object.keys(o));
    }
  } else if (Array.isArray(data)) {
    raw.push(...data);
  } else {
    // eslint-disable-next-line no-console
    console.warn('[Jug AI] normalizeBotsPayload: unexpected data type', typeof data);
  }

  const seen = new Set<string>();
  const out: Bot[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = (o.uuid ?? o._id ?? o.id) as string | undefined;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(mapApiBot({ ...o, uuid: id }));
  }

  return out;
}
