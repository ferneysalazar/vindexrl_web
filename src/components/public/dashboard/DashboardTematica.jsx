import { useState } from 'react';
import { I } from '../../../icons';

export default function DashboardTematica() {
  const [query, setQuery] = useState('');
  const ready = query.trim().length >= 3;

  function handleSearch() {
    if (!ready) return;
    window.location.href = `/busqueda-tematica?q=${encodeURIComponent(query.trim())}`;
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite palabras del tema…"
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[12px]
            bg-white/70 border border-[#1e2d4a]/15 text-[#1e2d4a]
            placeholder:text-[#6274a0]/60
            focus:outline-none focus:ring-2 focus:ring-[#1e2d4a]/25 focus:border-[#1e2d4a]/40
            transition"
        />
        <button
          onClick={handleSearch}
          disabled={!ready}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold
            transition-all duration-150 shrink-0
            bg-[#1e2d4a] text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:hover:bg-[#253659]"
        >
          <I.search size={13} />
          Buscar
        </button>
      </div>

      <p className="text-[11px] leading-[1.6]">
        Ingrese palabras clave del tema o subtema que busca para ver la lista de categorías en las que están organizados los documentos del sistema.
      </p>

      <p className="text-[11px] leading-[1.6]">
        También puede realizar una búsqueda ALFABÉTICA haciendo click en la letra inicial correspondiente al tema requerido:        
      </p>
      <div className="flex flex-wrap gap-x-1 gap-y-1 pt-1">
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
          <a
            key={letter}
            href={`/busqueda-tematica?letra=${letter}`}
            className="w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold
              bg-white/10 hover:bg-white/25 transition-colors duration-150"
          >
            {letter}
          </a>
        ))}
      </div>
    </div>
  );
}
