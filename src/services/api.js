export const BASE = 'http://localhost:3000/api';

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

