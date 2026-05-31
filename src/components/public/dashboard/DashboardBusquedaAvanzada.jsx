import { useState } from 'react';
import { I } from '../../../icons';

export default function DashboardBusquedaAvanzada() {
  const [query, setQuery] = useState('');
  const ready = query.trim().length >= 3;

  function handleSearch() {
    if (!ready) return;
    // navigate to search results — wire to router when available
    window.location.href = `/busqueda-avanzada?q=${encodeURIComponent(query.trim())}`;
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* search row */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite palabras, o datos del documento…"
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

      {/* hint */}
      <p className="text-[11px] leading-[1.6]">
        Ingrese el número del documento, el año de expedición, la entidad que lo expide
        o palabras del contenido del documento.
      </p>

      {/* advanced link */}
      <p className="text-[11px] leading-[1.6]">
        Para ir a la Búsqueda Avanzada con más filtros disponibles de clic{' '}
        <a
          href="/busqueda-avanzada"
          className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          aquí
        </a>
        .
      </p>
    </div>
  );
}
