const getConfig = () => window.jugAiConfig;

async function request(method: string, path: string, body?: any): Promise<any> {
  const { restUrl, nonce } = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const opts: RequestInit = {
    method,
    headers: {
      'X-WP-Nonce': nonce,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${restUrl}${path}`, opts);
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out (60s)');
    }
    throw err;
  }
  clearTimeout(timeout);

  if (res.status === 401 || res.status === 403) {
    const body = await res.json().catch(() => ({}));
    window.dispatchEvent(new CustomEvent('jug-ai:rest-unauthorized'));
    throw new Error(body.message || body.error || 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Request failed (${res.status})`);
  }

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: any) => request('POST', path, body),
  put: (path: string, body?: any) => request('PUT', path, body),
  del: (path: string) => request('DELETE', path),
  scrapeStreamUrl: (): Promise<{ url: string; token: string }> =>
    request('GET', 'scrape/stream-url'),
  chatStreamUrl: (): Promise<{ url: string; token: string }> =>
    request('GET', 'chat/stream-url'),
  trainingStreamUrl: (siteUuid: string): Promise<{ url: string; token: string }> =>
    request('GET', `training/site/${siteUuid}/stream-url`),
};

export default api;
