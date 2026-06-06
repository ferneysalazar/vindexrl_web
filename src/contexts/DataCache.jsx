import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { normTypes, entityTypes, entities, themes, subthemes } from '../services/api';

const DataCacheContext = createContext(null);

export function DataCacheProvider({ children }) {
  const [normTypeList, setNormTypeList] = useState([]);
  const [entityTypeList, setEntityTypeList] = useState([]);
  const [entityList, setEntityList] = useState([]);
  const [themeList, setThemeList] = useState([]);
  const [subthemeList, setSubthemeList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      normTypes.list().then(res => setNormTypeList(res.data ?? res ?? [])).catch(() => {}),
      entityTypes.list().then(res => setEntityTypeList(res.data ?? res ?? [])).catch(() => {}),
      entities.list().then(res => setEntityList(res.data ?? res ?? [])).catch(() => {}),
      themes.list({ size: 100 }).then(res => {
        const t = res.data ?? res ?? [];
        setThemeList(t);
        return Promise.all(t.map(th =>
          subthemes.list(th.id, { size: 100 })
            .then(sr => ({ themeId: th.id, subthemes: sr.data ?? sr ?? [] }))
            .catch(() => ({ themeId: th.id, subthemes: [] }))
        ));
      }).then(all => {
        setSubthemeList(all.flatMap(g => g.subthemes));
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const normNames = normTypeList.map(n => n.name);
  const normNameToId = Object.fromEntries(normTypeList.map(n => [n.name, n.id]));
  const normIdToName = Object.fromEntries(normTypeList.map(n => [n.id, n.name]));

  const entityTypeNames = entityTypeList.map(t => t.name);
  const entityTypeNameToId = Object.fromEntries(entityTypeList.map(t => [t.name, t.id]));
  const entityTypeIdToName = Object.fromEntries(entityTypeList.map(t => [t.id, t.name]));

  const themeNames = themeList.map(t => t.name);
  const themeNameToId = Object.fromEntries(themeList.map(t => [t.name, t.id]));
  const themeTree = Object.fromEntries(themeList.map(t => [
    t.name,
    subthemeList.filter(s => s.themeId === t.id).map(s => s.name),
  ]));
  const subthemeNameToId = Object.fromEntries(subthemeList.map(s => [s.name, s.id]));

  return (
    <DataCacheContext.Provider value={{
      normTypeList, normNames, normNameToId, normIdToName,
      entityTypeList, entityTypeNames, entityTypeNameToId, entityTypeIdToName,
      entityList,
      themeList, themeNames, themeNameToId, themeTree, subthemeList,
      loading, reloadData: load,
    }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache must be used within DataCacheProvider');
  return ctx;
}
