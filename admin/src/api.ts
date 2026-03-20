const getConfig = () => window.jugAiConfig;

async function request(method: string, path: string, body?: any): Promise<any> {
  const { restUrl, nonce } = getConfig();
  const opts: RequestInit = {
    method,
    headers: {
      'X-WP-Nonce': nonce,
      'Content-Type': 'application/json',
    },
  };

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${restUrl}${path}`, opts);

  if (res.status === 401 || res.status === 403) {
    window.location.hash = '#/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json();
}

const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: any) => request('POST', path, body),
  put: (path: string, body?: any) => request('PUT', path, body),
  del: (path: string) => request('DELETE', path),
  streamUrl: (path: string): Promise<{ url: string; token: string }> =>
    request('GET', path),
};

export default api;
