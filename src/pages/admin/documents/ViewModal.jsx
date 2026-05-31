// src/pages/admin/documents/ViewModal.jsx
import Icon from '../../../components/shared/Icon';

export default function ViewModal({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 flex items-center
            justify-center text-slate-400 hover:bg-slate-200 transition-colors"
        >
          <Icon name="close" size={16} color="currentColor" />
        </button>

        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c0392b] mb-3">
          Document Details
        </div>
        <h2 className="font-display text-[18px] font-bold text-[#1e2d4a] leading-snug mb-6">
          {doc.name}
        </h2>

        <div className="flex flex-col gap-0">
          {[
            { label: 'Year',           value: doc.year },
            { label: 'Issuing Entity', value: doc.entity },
            { label: 'Themes',         value: `${doc.themes} classificatory theme${doc.themes > 1 ? 's' : ''}` },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-4 py-3.5 border-b border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400 w-36 shrink-0">
                {row.label}
              </div>
              <div className="text-[13px] font-semibold text-[#1e2d4a]">{row.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-2.5 rounded-lg bg-[#c0392b] text-white text-[12px] font-bold
            tracking-wide hover:opacity-90 transition-opacity">
            EDIT DOCUMENT
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-500 text-[12px] font-bold
              hover:bg-slate-200 transition-colors tracking-wide"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
