const STATUS = {
  Active:  'bg-emerald-50 text-emerald-700',
  Pending: 'bg-[#fdf3dc] text-[#926110]',
  Closed:  'bg-slate-100 text-slate-500',
  Urgent:  'bg-red-50 text-red-700',
};

const CASES = [
  { id: 'VX-2026-001', title: 'Morrison v. Peterson',   type: 'Civil Litigation', attorney: 'J. Carter',  status: 'Active',  date: 'Apr 18, 2026' },
  { id: 'VX-2026-002', title: 'Estate of Williams',     type: 'Probate',          attorney: 'S. Reeves',  status: 'Pending', date: 'Apr 15, 2026' },
  { id: 'VX-2026-003', title: 'Clarke Employment',      type: 'Labor Law',        attorney: 'J. Carter',  status: 'Urgent',  date: 'Apr 12, 2026' },
  { id: 'VX-2026-004', title: 'Harrison Corp Merger',   type: 'Corporate',        attorney: 'M. Torres',  status: 'Active',  date: 'Apr 10, 2026' },
  { id: 'VX-2026-005', title: 'Tanaka Personal Injury', type: 'Tort',             attorney: 'S. Reeves',  status: 'Closed',  date: 'Apr 03, 2026' },
];

export default function CasesTable() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <h3 className="font-display text-[16px] font-semibold text-[#1e2d4a]">Recent Cases</h3>
        <button className="text-[11px] font-bold text-[#c0392b] border border-[#c0392b]/20
          rounded-md px-3 py-1 hover:bg-[#c0392b]/10 transition-colors tracking-wide">
          VIEW ALL →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f4f6fb]">
              {['Case ID', 'Title', 'Type', 'Attorney', 'Status', 'Date'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[10px] font-black uppercase
                  tracking-[0.1em] text-slate-400 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CASES.map(c => (
              <tr key={c.id} className="border-t border-slate-100 row-hover cursor-pointer">
                <td className="px-5 py-3.5 text-[11px] text-slate-400 font-semibold whitespace-nowrap">{c.id}</td>
                <td className="px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap">{c.title}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500 whitespace-nowrap">{c.type}</td>
                <td className="px-5 py-3.5 text-[12px] text-slate-500 whitespace-nowrap">{c.attorney}</td>
                <td className="px-5 py-3.5">
                  <span className={`${STATUS[c.status]} text-[11px] font-bold rounded-full px-2.5 py-0.5 whitespace-nowrap`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">{c.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
