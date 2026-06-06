import Icon from '../../../../components/shared/Icon';

export default function ThemesField({ rows, disabled, themeNames, themeTree, onAdd, onEdit, onDelete }) {
  return (
    <div className="border border-[#e2e6ef] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          {rows.length} Subtheme{rows.length !== 1 ? 's' : ''}
        </span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#f4f6fb]">
            <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 w-10">#</th>
            <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Theme / Subtheme</th>
            <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Detail</th>
            <th className="px-4 py-2.5 w-24"></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-[12px]">
              No themes added.
            </td></tr>
          ) : rows.map((r, i) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-4 py-3 text-[11px] text-slate-300 font-mono">{i + 1}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1e2d4a]">
                  <Icon name="themes" size={12} color="#c0392b" />{r.theme} — {r.sub}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
                  {r.detail || '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button onClick={() => onEdit(r)} disabled={disabled}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-[#1e2d4a] hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Icon name="edit" size={13} color="currentColor" />
                    </button>
                  )}
                  <button onClick={() => onDelete(r.id)} disabled={disabled}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[#c0392b] hover:bg-[#c0392b]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <Icon name="trash" size={13} color="currentColor" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-100 bg-[#f9fafc] p-3">
        <button onClick={onAdd} disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#c0392b]/40
            text-[#c0392b] text-[12px] font-bold hover:bg-[#c0392b]/5 transition-colors w-full justify-center
            disabled:opacity-40 disabled:cursor-not-allowed">
          <Icon name="plus" size={14} color="currentColor" /> Add a new subtheme
        </button>
      </div>
    </div>
  );
}
