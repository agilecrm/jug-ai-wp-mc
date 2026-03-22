import type { Bot } from '../types';

/**
 * WordPress does not store the bot list locally — it comes from the Jug AI API via the REST proxy.
 * Some API responses may nest lists (`bots`, `data`, `items`) or duplicate entries; we merge known
 * keys and dedupe by `uuid` so the dashboard shows one card per bot.
 */
function mapApiBot(item: Record<string, unknown>): Bot {
  const b = item as unknown as Bot;
  const pageRaw = item.page_count ?? item.pageCount ?? item.count;
  const trainedRaw = item.trained_at ?? item.trainedAt;
  return {
    ...b,
    page_count: typeof pageRaw === 'number' ? pageRaw : b.page_count,
    trained_at:
      typeof trainedRaw === 'number'
        ? trainedRaw
        : trainedRaw != null
          ? Number(trainedRaw)
          : b.trained_at ?? null,
    training_status: (item.training_status ?? item.trainingStatus ?? b.training_status) as string | undefined,
    site_uuid: (item.site_uuid ?? item.siteUuid ?? b.site_uuid) as string | undefined,
  };
}

export function normalizeBotsPayload(data: unknown): Bot[] {
  const raw: unknown[] = [];

  if (Array.isArray(data)) {
    raw.push(...data);
  } else if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.bots)) raw.push(...o.bots);
    if (Array.isArray(o.data)) raw.push(...o.data);
    if (Array.isArray(o.items)) raw.push(...o.items);
  }

  const seen = new Set<string>();
  const out: Bot[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = (o.uuid ?? o.id) as string | undefined;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(mapApiBot({ ...o, uuid: id }));
  }

  return out;
}
