import Icon from '../../../../components/shared/Icon';

export default function EntitiesField({
  entities, disabled,
  onRowDelete, saving, onAddEntity, onRowEdit,
}) {
  const savedEntities = entities.filter(e => e.docEntityId != null);

  return (
    <div className="slidein border border-[#e2e6ef] rounded-xl p-3 bg-[#f9fafc]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {savedEntities.length} Publisher {savedEntities.length === 1 ? 'Entity' : 'Entities'}
        </span>
      </div>
      {savedEntities.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[13px] text-slate-400 mb-3">There are no entities for this document.</p>
        </div>
      ) : (
        <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`}>
          {savedEntities.map((e, i) => (
            <div key={e.id} className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium shrink-0 w-4 text-right">{i + 1}.</span>
              <span className="flex-1 text-[13px] text-[#1e2d4a] font-medium">{e.value}</span>
              {onRowEdit && (
                <button onClick={() => onRowEdit(e)} disabled={disabled || saving}
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                    text-slate-400 hover:text-[#1e2d4a] hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed">
                  <Icon name="edit" size={15} color="currentColor" />
                </button>
              )}
              <button onClick={() => onRowDelete(e.id)} disabled={disabled || saving}
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  text-[#c0392b] hover:bg-[#c0392b]/10 disabled:text-slate-300 disabled:cursor-not-allowed">
                <Icon name="trash" size={15} color="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onAddEntity} disabled={disabled}
        className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#c0392b]/40
          text-[#c0392b] text-[12px] font-bold hover:bg-[#c0392b]/5 transition-colors w-full justify-center
          disabled:opacity-40 disabled:cursor-not-allowed">
        <Icon name="plus" size={14} color="currentColor" /> Add a new entity
      </button>
    </div>
  );
}
