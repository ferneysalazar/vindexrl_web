import { useState } from 'react';
import { I } from '../../icons';

const ICON_NAMES = Object.keys(I);

export default function IconsPage() {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(null);

  const filtered = query
    ? ICON_NAMES.filter(n => n.toLowerCase().includes(query.toLowerCase()))
    : ICON_NAMES;

  function copy(name) {
    navigator.clipboard.writeText(`<I.${name} />`);
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1e2d4a]">Icon Inventory</h1>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} of {ICON_NAMES.length} icons — click any card to copy JSX</p>
        </div>
        <input
          type="text"
          placeholder="Filter icons…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-700
            placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c0392b]/30
            focus:border-[#c0392b] w-52"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">No icons match "{query}"</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
          {filtered.map(name => {
            const IconComp = I[name];
            const isCopied = copied === name;
            return (
              <button
                key={name}
                onClick={() => copy(name)}
                title={`Copy <I.${name} />`}
                className="group flex flex-col items-center gap-2.5 p-4 bg-white rounded-xl border
                  border-slate-100 hover:border-[#c0392b]/40 hover:shadow-sm
                  transition-all duration-150 cursor-pointer text-left"
              >
                <div className={`transition-colors duration-150 ${isCopied ? 'text-[#c0392b]' : 'text-slate-600 group-hover:text-[#c0392b]'}`}>
                  <IconComp size={22} />
                </div>
                <span className={`text-[11px] font-mono leading-tight text-center break-all transition-colors duration-150
                  ${isCopied ? 'text-[#c0392b]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {isCopied ? 'copied!' : name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
