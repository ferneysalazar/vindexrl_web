import Icon from './Icon';

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

export default function Pagination({ page, totalPages, total, pageSize, label, onPageChange }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="px-5 py-3.5 border-t border-slate-100 flex flex-wrap items-center
      justify-between gap-3 bg-[#f4f6fb]">
      <span className="text-[12px] text-slate-400">
        Showing{' '}
        <span className="font-bold text-[#1e2d4a]">{start}</span>–
        <span className="font-bold text-[#1e2d4a]">{end}</span>
        {' '}of{' '}
        <span className="font-bold text-[#1e2d4a]">{total}</span> {label}
      </span>
      <div className="flex items-center gap-1">
        <PageBtn disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <Icon name="chev_l" size={15} color="currentColor" />
        </PageBtn>
        {pageNumbers.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="w-8 text-center text-slate-400 text-[12px]">…</span>
            : <PageBtn key={p} active={p === page} onClick={() => onPageChange(p)}>{p}</PageBtn>
        )}
        <PageBtn disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <Icon name="chev_r" size={15} color="currentColor" />
        </PageBtn>
      </div>
    </div>
  );
}
