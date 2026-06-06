import { useState, useEffect } from 'react';
import Icon from '../../../../components/shared/Icon';
import { uid } from './referenceData';

export default function EntitiesField({
  entities, setEntities, disabled,
  entitiesChanged,
  onUpdateEntity, onCancelEntity,
  onRowUpdate, onRowDelete, onRowCancel,
  saving, entityOptions,
}) {
  const [expanded, setExpanded] = useState(false);
  const [dirtyIds, setDirtyIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const multiple = entities.length > 1;

  useEffect(() => {
    if (!saving) setSavingId(null);
  }, [saving]);

  const update = (id, val) => {
    if (disabled) return;
    setEntities(prev => prev.map(e => (e.id === id ? { ...e, value: val } : e)));
    setDirtyIds(prev => new Set(prev).add(id));
  };
  const add    = () => {
    if (disabled) return;
    setEntities(prev => [...prev, { id: uid(), value: '' }]);
    setExpanded(true);
  };
  const isSaved = (entity) => entity.docEntityId != null;

  const handleRowUpdate = (id) => {
    setDirtyIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setSavingId(id);
    onRowUpdate(id);
  };

  const handleRowCancel = (id) => {
    setDirtyIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    onRowCancel(id);
  };

  if (!expanded) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={entities[0]?.value ?? ''}
              onChange={e => update(entities[0]?.id, e.target.value)}
              disabled={disabled}
              className="field-input appearance-none cursor-pointer pr-9 bg-[#f9fafc] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Not Entity Selected</option>
              {entityOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <Icon name="chev_d" size={16} color="#9aa3bd"
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            onClick={() => { if (!disabled) setExpanded(true); }}
            disabled={disabled}
            title={multiple ? 'Show all entities' : 'Add more entities'}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#e8edf7] text-[#1e2d4a]
              text-[12px] font-bold hover:bg-[#1e2d4a] hover:text-white transition-all shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="expand" size={14} color="currentColor" />
            {multiple ? `+${entities.length - 1}` : 'Multiple'}
          </button>
        </div>
        {entitiesChanged && !disabled && (
          <div className="flex items-center gap-2 mt-3">
            <button onClick={onCancelEntity} disabled={saving}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-500 text-[12px] font-bold
                hover:bg-slate-50 transition-colors disabled:opacity-40">
              Cancel
            </button>
            <button onClick={onUpdateEntity} disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#c0392b] text-white text-[12px] font-bold
                hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5">
              {saving && <Icon name="save" size={13} color="#fff" className="animate-spin" />}
              Update document entity
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="slidein border border-[#e2e6ef] rounded-xl p-3 bg-[#f9fafc]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {entities.length} Publisher {entities.length === 1 ? 'Entity' : 'Entities'}
        </span>
        <button onClick={() => setExpanded(false)}
          className="text-[11px] font-bold text-[#c0392b] hover:underline flex items-center gap-1">
          Collapse <Icon name="chev_d" size={13} color="#c0392b" className="rotate-180" />
        </button>
      </div>
      <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`}>
        {entities.map((e, i) => {
          const saved = isSaved(e);
          const dirty = dirtyIds.has(e.id);
          const showActions = !saved || dirty;
          return (
            <div key={e.id} className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium shrink-0 w-4 text-right">{i + 1}.</span>
              <div className="relative flex-1">
                <select value={e.value} onChange={ev => update(e.id, ev.target.value)}
                  disabled={disabled || (dirtyIds.size > 0 && !dirtyIds.has(e.id)) || (saving && savingId && e.id !== savingId)}
                  className="field-input appearance-none cursor-pointer pr-9 bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">Not Entity Selected</option>
                  {entityOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <Icon name="chev_d" size={16} color="#9aa3bd"
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {showActions ? (
                <>
                  <button onClick={() => handleRowUpdate(e.id)} disabled={disabled || saving || !e.value}
                    className="px-3 py-2 rounded-lg bg-[#c0392b] text-white text-[12px] font-bold
                      hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                    Update document entity
                  </button>
                  <button onClick={() => handleRowCancel(e.id)} disabled={disabled || saving}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-500 text-[12px] font-bold
                      hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => onRowDelete(e.id)} disabled={disabled || saving}
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                    text-[#c0392b] hover:bg-[#c0392b]/10 disabled:text-slate-300 disabled:cursor-not-allowed">
                  <Icon name="trash" size={15} color="currentColor" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={add} disabled={disabled}
        className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#c0392b]/40
          text-[#c0392b] text-[12px] font-bold hover:bg-[#c0392b]/5 transition-colors w-full justify-center
          disabled:opacity-40 disabled:cursor-not-allowed">
        <Icon name="plus" size={14} color="currentColor" /> Add another entity
      </button>
    </div>
  );
}
