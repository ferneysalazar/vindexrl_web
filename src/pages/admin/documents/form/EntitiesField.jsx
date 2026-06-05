import { useState } from 'react';
import Icon from '../../../../components/shared/Icon';
import { ENTITIES, uid } from './referenceData';

export default function EntitiesField({ entities, setEntities }) {
  const [expanded, setExpanded] = useState(false);
  const multiple = entities.length > 1;

  const update = (id, val) => setEntities(prev => prev.map(e => (e.id === id ? { ...e, value: val } : e)));
  const add    = () => { setEntities(prev => [...prev, { id: uid(), value: '' }]); setExpanded(true); };
  const remove = (id) => setEntities(prev => (prev.length > 1 ? prev.filter(e => e.id !== id) : prev));

  if (!expanded) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={entities[0].value}
            onChange={e => update(entities[0].id, e.target.value)}
            className="field-input appearance-none cursor-pointer pr-9"
          >
            <option value="">Select publisher entity…</option>
            {ENTITIES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <Icon name="chev_d" size={16} color="#9aa3bd"
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <button
          onClick={() => setExpanded(true)}
          title={multiple ? 'Show all entities' : 'Add more entities'}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#e8edf7] text-[#1e2d4a]
            text-[12px] font-bold hover:bg-[#1e2d4a] hover:text-white transition-all shrink-0"
        >
          <Icon name="expand" size={14} color="currentColor" />
          {multiple ? `+${entities.length - 1}` : 'Multiple'}
        </button>
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
      <div className="flex flex-col gap-2">
        {entities.map((e, i) => (
          <div key={e.id} className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#1e2d4a] text-white text-[11px] font-bold
              flex items-center justify-center shrink-0">{i + 1}</span>
            <div className="relative flex-1">
              <select value={e.value} onChange={ev => update(e.id, ev.target.value)}
                className="field-input appearance-none cursor-pointer pr-9 bg-white">
                <option value="">Select entity…</option>
                {ENTITIES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <Icon name="chev_d" size={16} color="#9aa3bd"
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button onClick={() => remove(e.id)} disabled={entities.length === 1}
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                ${entities.length === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-[#c0392b] hover:bg-[#c0392b]/10'}`}>
              <Icon name="trash" size={15} color="currentColor" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add}
        className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#c0392b]/40
          text-[#c0392b] text-[12px] font-bold hover:bg-[#c0392b]/5 transition-colors w-full justify-center">
        <Icon name="plus" size={14} color="currentColor" /> Add another entity
      </button>
    </div>
  );
}
