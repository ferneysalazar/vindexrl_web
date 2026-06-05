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
  list:  (params = {}) => request('/norm-type' + toQuery(params)),
  get:   (id)         => request(`/norm-type/${id}`),
  create:(body)       => request('/norm-type', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/norm-type/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/norm-type/${id}`, { method: 'DELETE' }),
};

export const entityTypes = {
  list:  (params = {}) => request('/entity-type' + toQuery(params)),
  get:   (id)         => request(`/entity-type/${id}`),
  create:(body)       => request('/entity-type', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/entity-type/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/entity-type/${id}`, { method: 'DELETE' }),
};

export const themes = {
  list:  (params = {}) => request('/theme' + toQuery(params)),
  get:   (id)         => request(`/theme/${id}`),
  create:(body)       => request('/theme', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/theme/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/theme/${id}`, { method: 'DELETE' }),
};

export const subthemes = {
  list:  (themeId, params = {}) => request(`/subtheme/theme/${themeId}` + toQuery(params)),
  get:   (id)         => request(`/subtheme/${id}`),
  create:(body)       => request('/subtheme', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/subtheme/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/subtheme/${id}`, { method: 'DELETE' }),
};

export const entities = {
  list:  (params = {}) => request('/entity' + toQuery(params)),
  get:   (id)         => request(`/entity/${id}`),
  create:(body)       => request('/entity', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/entity/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/entity/${id}`, { method: 'DELETE' }),
};

export const documents = {
  list:  (params = {}) => request('/document' + toQuery(params)),
  get:   (id)         => request(`/document/${id}`),
  create:(body)       => request('/document', { method: 'POST', body: JSON.stringify(body) }),
  update:(id, body)   => request(`/document/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:(id)         => request(`/document/${id}`, { method: 'DELETE' }),
};

export const helpers = {
  entityByIds: (ids) => request('/helpers/entity/by-ids', { method: 'POST', body: JSON.stringify({ ids }) }),
};
