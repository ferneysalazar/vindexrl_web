import Icon from '../../../../components/shared/Icon';

export function Section({ icon, title, sub, children, disabled }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#1e2d4a] flex items-center justify-center shrink-0">
          <Icon name={icon} size={17} color="#fff" />
        </div>
        <div>
          <h3 className="font-display text-[15px] font-semibold text-[#1e2d4a] leading-none">{title}</h3>
          {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
        </div>
      </div>
      <div className={`p-6 ${disabled ? 'diagonal-pattern' : ''}`}>{children}</div>
    </div>
  );
}

export function Field({ label, required, children, hint, className = '', error }) {
  return (
    <div className={className}>
      <label className={`field-label ${required ? 'req' : ''}`}>{label}</label>
      {children}
      {error && <p className="text-[11px] text-[#c0392b] mt-1">{error}</p>}
      {!error && hint && <p className="text-[11px] text-slate-400 mt-1.5">{hint}</p>}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="field-input appearance-none cursor-pointer pr-9 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <Icon name="chev_d" size={16} color="#9aa3bd"
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
