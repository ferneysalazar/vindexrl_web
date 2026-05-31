// src/pages/admin/documents/DocumentFilters.jsx
import Icon from '../../../components/shared/Icon';
import { ALL_YEARS, ALL_ENTITIES } from './mockData';

export default function DocumentFilters({ search, setSearch, yearFilter, setYearFilter, entityFilter, setEntityFilter }) {
  const hasFilters = search || yearFilter || entityFilter;

  return (
    <div className="bg-white rounded-xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-3">
      <Icon name="filter" size={16} color="#9098b1" />

      {/* Search */}
      <div className="flex items-center gap-2 bg-[#f4f6fb] border border-slate-200
        rounded-lg px-3 py-2 flex-1 min-w-[200px]">
        <Icon name="search" size={14} color="#9098b1" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by document name…"
          className="bg-transparent text-[13px] text-[#1e2d4a] placeholder-slate-400 flex-1 border-none outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Year */}
      <div className="relative">
        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="appearance-none bg-[#f4f6fb] border border-slate-200 rounded-lg
            pl-3 pr-8 py-2 text-[13px] text-[#1e2d4a] cursor-pointer outline-none"
        >
          <option value="">All years</option>
          {ALL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <Icon name="chev_r" size={14} color="#9098b1"
          className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
      </div>

      {/* Entity */}
      <div className="relative">
        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="appearance-none bg-[#f4f6fb] border border-slate-200 rounded-lg
            pl-3 pr-8 py-2 text-[13px] text-[#1e2d4a] cursor-pointer max-w-[200px] outline-none"
        >
          <option value="">All entities</option>
          {ALL_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <Icon name="chev_r" size={14} color="#9098b1"
          className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => { setSearch(''); setYearFilter(''); setEntityFilter(''); }}
          className="text-[12px] font-semibold text-[#c0392b] hover:underline whitespace-nowrap"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
