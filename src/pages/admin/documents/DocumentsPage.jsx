// src/pages/admin/documents/DocumentsPage.jsx
import { useState, useMemo, useEffect } from 'react';
import Icon from '../../../components/shared/Icon';
import DocumentFilters from './DocumentFilters';
import DocumentsTable from './DocumentsTable';
import ViewModal from './ViewModal';
import { DOCUMENTS, ROWS_PER_PAGE } from './mockData';

export default function DocumentsPage() {
  const [search,        setSearch]        = useState('');
  const [yearFilter,    setYearFilter]    = useState('');
  const [entityFilter,  setEntityFilter]  = useState('');
  const [page,          setPage]          = useState(1);
  const [sortCol,       setSortCol]       = useState('name');
  const [sortDir,       setSortDir]       = useState('asc');
  const [selected,      setSelected]      = useState(null);

  // Filter
  const filtered = useMemo(() => {
    let d = DOCUMENTS;
    if (search)        d = d.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    if (yearFilter)    d = d.filter(r => r.year === +yearFilter);
    if (entityFilter)  d = d.filter(r => r.entity === entityFilter);
    return d;
  }, [search, yearFilter, entityFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const curPage    = Math.min(page, totalPages);
  const rows       = sorted.slice((curPage - 1) * ROWS_PER_PAGE, curPage * ROWS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => setPage(1), [search, yearFilter, entityFilter]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-bold text-[#1e2d4a] leading-none">Documents</h1>
          <p className="text-[12px] text-slate-400 mt-1.5">
            {filtered.length} document{filtered.length !== 1 ? 's' : ''} found
            {(search || yearFilter || entityFilter) ? ' (filtered)' : ` · Page ${curPage} of ${totalPages}`}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c0392b]
            text-white text-[11px] font-bold tracking-wide hover:opacity-90 transition-opacity"
          style={{ boxShadow: '0 4px 16px rgba(192,57,43,0.35)' }}
        >
          <Icon name="plus" size={14} color="#fff" /> ADD DOCUMENT
        </button>
      </div>

      {/* Filters */}
      <DocumentFilters
        search={search}           setSearch={setSearch}
        yearFilter={yearFilter}   setYearFilter={setYearFilter}
        entityFilter={entityFilter} setEntityFilter={setEntityFilter}
      />

      {/* Table */}
      <DocumentsTable
        rows={rows}
        sorted={sorted}
        curPage={curPage}
        totalPages={totalPages}
        setPage={setPage}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
        onView={setSelected}
      />

      {/* View modal */}
      <ViewModal doc={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
