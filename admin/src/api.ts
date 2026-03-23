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

  // Separate path from query string and join properly (restUrl may already contain '?')
  const [pathPart, qsPart] = path.split('?');
  let url = `${restUrl}${pathPart}`;
  if (qsPart) {
    url += (restUrl.includes('?') ? '&' : '?') + qsPart;
  }

  let res: Response;
  try {
    res = await fetch(url, opts);
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

  // Training embeddings
  getTrainingEmbeddings: (uuid: string, skip: number, limit: number, embeddingType: string): Promise<{ items: any[]; total_count: number }> =>
    request('GET', `training/${uuid}/embeddings?skip=${skip}&limit=${limit}&embedding_type=${encodeURIComponent(embeddingType)}`),
  deleteEmbedding: (uuid: string, embeddingId: string, embeddingType: string) =>
    request('DELETE', `training/${uuid}/embedding/${embeddingId}?embedding_type=${encodeURIComponent(embeddingType)}`),
  deleteAllEmbeddings: (uuid: string, embeddingType: string) =>
    request('DELETE', `training/${uuid}/embeddings?embedding_type=${encodeURIComponent(embeddingType)}`),

  // Test retrieval
  testRetrieval: (uuid: string, query: string, topK: number, embeddingType: string): Promise<any[]> =>
    request('POST', `training/${uuid}/${encodeURIComponent(embeddingType)}/retrieve`, { query, top_k: topK }),

  // Training: bulk text, file upload, file train
  addTrainingBulk: (uuid: string, data: string[], fingerprint?: string, embeddingType?: string) =>
    request('POST', `training/${uuid}/bulk`, { data, fingerprint, embedding_type: embeddingType || 'free' }),
  uploadTrainingFile: async (file: File): Promise<{ uuid: string; fileName: string; text: string; error?: string }> => {
    const { restUrl, nonce } = getConfig();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${restUrl}training/file/upload`, {
      method: 'POST',
      headers: { 'X-WP-Nonce': nonce },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { uuid: '', fileName: '', text: '', error: err.message || err.error || `Upload failed (${res.status})` };
    }
    return res.json();
  },
  trainFile: (trainingUuid: string, body: { fileUuid: string; text: string; fingerprint?: string; chunkSize: number; overlap: number; fileName: string; embeddingType: string }) =>
    request('POST', `training/file/${body.fileUuid}/train?embedding_type=${encodeURIComponent(body.embeddingType)}`, {
      text: body.text,
      fingerprint: body.fingerprint,
      chunk_size: body.chunkSize,
      overlap: body.overlap,
      fileName: body.fileName,
      training_uuid: trainingUuid,
    }),

  // Discover URLs
  discoverUrls: (siteUrl: string, exclude: string[], limit: number): Promise<string[]> =>
    request('POST', 'scrape/discover', { website: siteUrl, exclude_urls: exclude, max_count: limit }),
};

export default api;
