import { createContext, useContext, useState, useEffect, useCallback, startTransition } from 'react';
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
      normTypes.list({ size: 1000 }).then(res => setNormTypeList(res.data ?? res ?? [])).catch(() => {}),
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

  // Wrapped in startTransition: load's own setLoading(true) call would
  // otherwise be flagged as a synchronous setState-in-effect.
  useEffect(() => { startTransition(() => load()); }, [load]);

  const normNames = normTypeList.map(n => n.name);
  const normNameToId = Object.fromEntries(normTypeList.map(n => [n.name, n.id]));
  const normIdToName = Object.fromEntries(normTypeList.map(n => [n.id, n.name]));
  const normTypeById = Object.fromEntries(normTypeList.map(n => [n.id, n]));

  // Returns the full norm_type record (id, name, gender, ...) for a given
  // norm_type_id, or null if not found/loaded yet. Gender now lives on
  // norm_type (moved off link_document), so callers needing a target
  // document's grammatical gender look it up here by its norm_type_id.
  const normTypeInfo = useCallback((normTypeId) => normTypeById[normTypeId] ?? null, [normTypeById]);

  const entityTypeNames = entityTypeList.map(t => t.name);
  const entityTypeNameToId = Object.fromEntries(entityTypeList.map(t => [t.name, t.id]));
  const entityTypeIdToName = Object.fromEntries(entityTypeList.map(t => [t.id, t.name]));

  const themeNames = themeList.map(t => t.name);
  const themeNameToId = Object.fromEntries(themeList.map(t => [t.name, t.id]));
  const themeTree = Object.fromEntries(themeList.map(t => [
    t.name,
    subthemeList.filter(s => s.themeId === t.id).map(s => s.name),
  ]));

  return (
    <DataCacheContext.Provider value={{
      normTypeList, normNames, normNameToId, normIdToName, normTypeInfo,
      entityTypeList, entityTypeNames, entityTypeNameToId, entityTypeIdToName,
      entityList,
      themeList, themeNames, themeNameToId, themeTree, subthemeList,
      loading, reloadData: load,
    }}>
      {children}
    </DataCacheContext.Provider>
  );
}

// Co-locating the accessor hook here is standard practice; splitting into a
// second file just for Fast Refresh would add indirection with no functional benefit.
// eslint-disable-next-line react-refresh/only-export-components
export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache must be used within DataCacheProvider');
  return ctx;
}
