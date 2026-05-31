import { useState } from 'react';
import { I } from '../../../icons';

export default function DashboardCompilaciones() {
  const [query, setQuery] = useState('');
  const ready = query.trim().length >= 3;

  function handleSearch() {
    if (!ready) return;
    window.location.href = `/compilaciones?q=${encodeURIComponent(query.trim())}`;
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] leading-[1.6]">
        Una compilación normativa es un conjunto de documentos relacionados entre sí por su relevancia para una entidad pública. Estas colecciones actúan como un índice estructurado por temas, diseñado para articular y guiar el acceso a los documentos que las componen.
      </p>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite el tema o el nombre de la entidad…"
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[12px]
            bg-white/80 border border-[#7a4d00]/20 text-[#7a4d00]
            placeholder:text-[#b87a20]/60
            focus:outline-none focus:ring-2 focus:ring-[#7a4d00]/20 focus:border-[#7a4d00]/30
            transition"
        />
        <button
          onClick={handleSearch}
          disabled={!ready}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold
            transition-all duration-150 shrink-0
            bg-[#7a4d00] text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            enabled:hover:bg-[#5c3900]"
        >
          <I.search size={13} />
          Buscar
        </button>
      </div>
      <p className="text-[11px] leading-[1.6]">
        Ingrese algunas palabras del tema o el nombre de la entidad que realizó la compilación normativa por clasificada por tema para buscar las compilaciones o también conocidas como documentos de relatoría.
      </p>

    </div>
  );
}
