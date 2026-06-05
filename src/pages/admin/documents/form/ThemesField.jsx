import { useState } from 'react';
import Icon from '../../../../components/shared/Icon';
import { THEME_TREE, THEME_NAMES, uid } from './referenceData';

export default function ThemesField({ rows, setRows, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const [theme, setTheme] = useState('');
  const [sub, setSub]     = useState('');

  const addRow = () => {
    if (disabled || !theme || !sub) return;
    setRows(prev => [...prev, { id: uid(), theme, sub }]);
    setTheme(''); setSub('');
  };
  const removeRow = (id) => {
    if (disabled) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const first = rows[0];

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className={`flex-1 flex items-center gap-3 field-input bg-[#f9fafc] cursor-default min-h-[42px] ${disabled ? 'opacity-50' : ''}`}>
          {rows.length === 0 ? (
            <span className="text-slate-400 text-[13px]">No themes assigned yet</span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-[#1e2d4a] text-white text-[12px] font-semibold rounded-md px-2.5 py-1">
                <Icon name="themes" size={12} color="#fff" />{first.theme}
                <Icon name="chev_r" size={11} color="rgba(255,255,255,0.5)" />
                <span className="text-white/80">{first.sub}</span>
              </span>
              {rows.length > 1 && (
                <span className="text-[12px] font-bold text-slate-400">+{rows.length - 1} more</span>
              )}
            </div>
          )}
        </div>
        <button onClick={() => { if (!disabled) setExpanded(x => !x); }} disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#e8edf7] text-[#1e2d4a]
            text-[12px] font-bold hover:bg-[#1e2d4a] hover:text-white transition-all shrink-0
            disabled:opacity-40 disabled:cursor-not-allowed">
          <Icon name={expanded ? 'chev_d' : 'expand'} size={14} color="currentColor" className={expanded ? 'rotate-180' : ''} />
          {expanded ? 'Close' : `Details${rows.length ? ` (${rows.length})` : ''}`}
        </button>
      </div>

      {expanded && (
        <div className="slidein mt-3 border border-[#e2e6ef] rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f6fb]">
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 w-10">#</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Theme</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Subtheme</th>
                <th className="px-4 py-2.5 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-[12px]">
                  No themes added. Use the row below to assign one.
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-[11px] text-slate-300 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1e2d4a]">
                      <Icon name="themes" size={12} color="#c0392b" />{r.theme}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
                      <Icon name="subtheme" size={12} color="#9aa3bd" />{r.sub}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeRow(r.id)} disabled={disabled}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[#c0392b] hover:bg-[#c0392b]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Icon name="trash" size={13} color="currentColor" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`border-t border-slate-100 bg-[#f9fafc] p-3 flex items-center gap-2 ${disabled ? 'opacity-40' : ''}`}>
            <div className="relative flex-1">
              <select value={theme} onChange={e => { setTheme(e.target.value); setSub(''); }}
                disabled={disabled}
                className="field-input appearance-none cursor-pointer pr-9 bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">Select theme…</option>
                {THEME_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Icon name="chev_d" size={16} color="#9aa3bd"
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative flex-1">
              <select value={sub} onChange={e => setSub(e.target.value)} disabled={disabled || !theme}
                className="field-input appearance-none cursor-pointer pr-9 bg-white disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">{theme ? 'Select subtheme…' : 'Pick theme first'}</option>
                {theme && THEME_TREE[theme].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Icon name="chev_d" size={16} color="#9aa3bd"
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button onClick={addRow} disabled={disabled || !theme || !sub}
              className={`px-4 py-2.5 rounded-lg text-[12px] font-bold tracking-wide shrink-0 transition-all
                ${disabled || !theme || !sub ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-[#c0392b] text-white hover:opacity-90'}`}>
              ADD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
