// src/pages/admin/documents/DocumentsTable.jsx
import Icon from '../../../components/shared/Icon';
import { ROWS_PER_PAGE } from './mockData';

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-lg text-[12px] font-bold flex items-center justify-center transition-all
        ${active   ? 'bg-[#c0392b] text-white shadow-sm' : ''}
        ${disabled ? 'text-slate-300 cursor-not-allowed' : !active ? 'text-slate-500 hover:bg-slate-200' : ''}`}
    >
      {children}
    </button>
  );
}

export default function DocumentsTable({ rows, sorted, curPage, totalPages, setPage, sortCol, sortDir, onSort, onView }) {
  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <Icon name="sort" size={13} color="#c8ccdc" />;
    return <Icon name={sortDir === 'asc' ? 'sort_asc' : 'sort_desc'} size={13} color="#c0392b" />;
  };

  const ThBtn = ({ col, label, className = '' }) => (
    <th className={`px-4 py-3 text-left select-none ${className}`}>
      <button
        onClick={() => onSort(col)}
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em]
          text-slate-400 hover:text-[#1e2d4a] transition-colors"
      >
        {label}<SortIcon col={col} />
      </button>
    </th>
  );

  // Smart page numbers with ellipsis
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - curPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f4f6fb] border-b border-slate-100">
              <th className="px-4 py-3 text-left w-8">
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">#</span>
              </th>
              <ThBtn col="name"   label="Document Name"  className="min-w-[340px]" />
              <ThBtn col="year"   label="Year"           className="w-20" />
              <ThBtn col="entity" label="Issuing Entity" className="min-w-[180px]" />
              <ThBtn col="themes" label="Themes"         className="w-24" />
              <th className="px-4 py-3 text-center w-28">
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-[13px]">
                  No documents match your filters.
                </td>
              </tr>
            ) : rows.map((doc, i) => (
              <tr key={doc.id} className="border-t border-slate-100 row-hover transition-colors">
                <td className="px-4 py-3.5 text-[11px] text-slate-300 font-mono">
                  {(curPage - 1) * ROWS_PER_PAGE + i + 1}
                </td>
                <td className="px-4 py-3.5 max-w-[380px]">
                  <div
                    className="text-[13px] font-semibold text-[#1e2d4a] leading-snug line-clamp-2"
                    title={doc.name}
                  >
                    {doc.name}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12px] font-bold text-slate-500 bg-[#f4f6fb]
                    px-2.5 py-1 rounded-md whitespace-nowrap">
                    {doc.year}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[12px] text-slate-600 whitespace-nowrap">{doc.entity}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 bg-[#1e2d4a]/[0.08] text-[#1e2d4a]
                    text-[11px] font-bold rounded-full px-2.5 py-0.5">
                    <Icon name="themes" size={10} color="#c0392b" />
                    {doc.themes}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onView(doc)}
                      title="View"
                      className="w-8 h-8 rounded-lg flex items-center justify-center
                        bg-[#e8edf7] text-[#1e2d4a] hover:bg-[#1e2d4a] hover:text-white transition-all"
                    >
                      <Icon name="view" size={14} color="currentColor" />
                    </button>
                    <button
                      title="Edit"
                      className="w-8 h-8 rounded-lg flex items-center justify-center
                        bg-[#fdf3dc] text-[#d4921a] hover:bg-[#d4921a] hover:text-white transition-all"
                    >
                      <Icon name="edit" size={14} color="currentColor" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3.5 border-t border-slate-100 flex flex-wrap items-center
        justify-between gap-3 bg-[#f4f6fb]">
        <span className="text-[12px] text-slate-400">
          Showing{' '}
          <span className="font-bold text-[#1e2d4a]">{(curPage - 1) * ROWS_PER_PAGE + 1}</span>–
          <span className="font-bold text-[#1e2d4a]">{Math.min(curPage * ROWS_PER_PAGE, sorted.length)}</span>
          {' '}of{' '}
          <span className="font-bold text-[#1e2d4a]">{sorted.length}</span> documents
        </span>
        <div className="flex items-center gap-1">
          <PageBtn disabled={curPage === 1} onClick={() => setPage(p => p - 1)}>
            <Icon name="chev_l" size={15} color="currentColor" />
          </PageBtn>
          {pageNumbers.map((p, i) =>
            p === '…'
              ? <span key={`e${i}`} className="w-8 text-center text-slate-400 text-[12px]">…</span>
              : <PageBtn key={p} active={p === curPage} onClick={() => setPage(p)}>{p}</PageBtn>
          )}
          <PageBtn disabled={curPage === totalPages} onClick={() => setPage(p => p + 1)}>
            <Icon name="chev_r" size={15} color="currentColor" />
          </PageBtn>
        </div>
      </div>
    </div>
  );
}
