export const BASE = 'http://localhost:3000/api';
export const BASE_RASTER = 'http://localhost:3001/api/';

function toQuery(params) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${msg}`);
  }
  return res.status === 204 ? null : res.json();
}

export const normTypes = {
  list:  (params = {}) => request('/norm-types' + toQuery(params)),
  get:   (id)         => request(`/norm-types/${id}`),
  create:(body)       => request('/norm-types', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/norm-types/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/norm-types/${id}`, { method: 'DELETE' }),
};

export const entityTypes = {
  list:  (params = {}) => request('/entity-types' + toQuery(params)),
  get:   (id)         => request(`/entity-types/${id}`),
  create:(body)       => request('/entity-types', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/entity-types/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/entity-types/${id}`, { method: 'DELETE' }),
};

export const themes = {
  list:  (params = {}) => request('/themes' + toQuery(params)),
  get:   (id)         => request(`/themes/${id}`),
  create:(body)       => request('/themes', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/themes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/themes/${id}`, { method: 'DELETE' }),
};

export const subthemes = {
  list:  (themeId, params = {}) => request(`/subthemes/themes/${themeId}` + toQuery(params)),
  get:   (id)         => request(`/subthemes/${id}`),
  create:(body)       => request('/subthemes', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/subthemes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/subthemes/${id}`, { method: 'DELETE' }),
};

export const entities = {
  list:  (params = {}) => request('/entities' + toQuery(params)),
  get:   (id)         => request(`/entities/${id}`),
  create:(body)       => request('/entities', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/entities/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/entities/${id}`, { method: 'DELETE' }),
};

export const documents = {
  list:  (params = {}) => request('/documents' + toQuery(params)),
  get:   (id)         => request(`/documents/${id}`),
  create:(body)       => request('/documents', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/documents/${id}`, { method: 'DELETE' }),
};

export const xentities = {
  list:  (params = {}) => request('/xentities' + toQuery(params)),
};

export const xdocuments = {
  list:  (params = {}) => request('/xdocuments' + toQuery(params)),
};

export const documentEntities = {
  list:  (docId)           => request(`/documents/${docId}/entities`),
  create:(docId, body)     => request(`/documents/${docId}/entities`, { method: 'POST', body: JSON.stringify(body) }),
  update:(docId, entityDocId, body) => request(`/documents/${docId}/entities/${entityDocId}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(docId, entityId) => request(`/documents/${docId}/entities/${entityId}`, { method: 'DELETE' }),
};

export const xsubthemes = {
  list:  (docId, params = {}) => request(`/documents/${docId}/xsubthemes` + toQuery(params)),
};

export const documentSubthemes = {
  create:(docId, body) => request(`/documents/${docId}/subthemes`, { method: 'POST', body: JSON.stringify(body) }),
  update:(docId, subthemeId, body) => request(`/documents/${docId}/subthemes/${subthemeId}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(docId, subthemeId) => request(`/documents/${docId}/subthemes/${subthemeId}`, { method: 'DELETE' }),
};

// Valid resolution identifiers accepted by the raster service.
// Use 'low' for thumbnails, 'medium' for previews, 'high' for full reading view.
export const RASTER_RES = /** @type {const} */ (['low', 'medium', 'high']);

/**
 * rasterDocs — metadata about a rasterised PDF document.
 *
 * GET /documents/:docId
 * Response: { id, status, total_pages, error_message, created_at, updated_at }
 *
 * Call this first before requesting any pages so you know how many pages
 * exist and can build the correct number of placeholders in the UI.
 */
export const rasterDocs = {
  get: (docId) =>
    fetch(`${BASE_RASTER}documents/${docId}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
        return r.json();
      }),
};

// Module-level blob cache — persists for the lifetime of the app session.
// Keyed as "docId:page:res". Stores the raw Blob (not a blob URL) so each
// caller can create its own URL.createObjectURL() and revoke it on unmount
// without invalidating the shared cached entry. This means the network is
// only hit once per unique (docId, page, resolution) combination.
const _rasterCache = new Map();

/**
 * rasterPages — fetch individual rasterised page images.
 *
 * url(docId, page, res)
 *   Returns the endpoint URL as a plain string. Useful when you want to set
 *   an <img src> directly without a fetch round-trip (e.g. high-res pages
 *   where the browser handles caching natively via HTTP headers).
 *
 * get(docId, page, res)
 *   Fetches the image, caches the raw Blob in _rasterCache, and returns a
 *   temporary blob URL. The caller is responsible for calling
 *   URL.revokeObjectURL() on unmount to free memory. Subsequent calls for
 *   the same (docId, page, res) skip the network and create a new blob URL
 *   from the already-cached Blob.
 *
 * Default resolution is 'low'. Use RASTER_RES for the full list of options.
 */
export const rasterPages = {
  url: (docId, page, res = 'low') =>
    `${BASE_RASTER}documents/${docId}/pages/${page}?res=${res}`,

  get: (docId, page, res = 'low') => {
    const key = `${docId}:${page}:${res}`;
    if (_rasterCache.has(key)) {
      // Cache hit — wrap the stored Blob in a fresh temporary URL
      return Promise.resolve(URL.createObjectURL(_rasterCache.get(key)));
    }
    return fetch(`${BASE_RASTER}documents/${docId}/pages/${page}?res=${res}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
        return r.blob();
      })
      .then(blob => {
        _rasterCache.set(key, blob); // store Blob, not the URL, to decouple cache from URL lifecycle
        return URL.createObjectURL(blob);
      });
  },
};

export const htmlFiles = {
  save: (name, content) => fetch(`${BASE}/html-files/${name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: content,
  }).then(res => {
    if (!res.ok) return res.text().then(msg => { throw new Error(`${res.status}: ${msg}`); });
    return res.status === 204 ? null : res.json();
  }),
};

