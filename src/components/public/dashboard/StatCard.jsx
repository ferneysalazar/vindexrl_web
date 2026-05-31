import Icon from '../../shared/Icon';
import VerDetalles from '../../shared/VerDetalles';

export function renderIcon(icon, size) {
  if (typeof icon === 'function') return icon({ size });
  return <Icon name={icon} size={size} color="currentColor" />;
}

export const variants = {
  blue:        { card: 'bg-[#1e2d4a] text-white',       sub: 'text-white/60',    iconBg: 'bg-white/10'   },
  blueMid:     { card: 'bg-[#253659] text-white',        sub: 'text-white/60',    iconBg: 'bg-white/10'   },
  blueLight:   { card: 'bg-[#e8edf7] text-[#1e2d4a]',   sub: 'text-[#6274a0]',   iconBg: 'bg-[#1e2d4a]/10'},
  yellow:      { card: 'bg-[#d4921a] text-white',        sub: 'text-white/70',    iconBg: 'bg-black/15'   },
  yellowLight: { card: 'bg-[#fdf3dc] text-[#7a4d00]',   sub: 'text-[#b87a20]',   iconBg: 'bg-[#d4921a]/20'},
  white:       { card: 'bg-white text-[#1e2d4a]',        sub: 'text-slate-400',   iconBg: 'bg-[#d4921a]/10'},
};

export default function StatCard({ label, value, icon, variant = 'white', change, link }) {
  const v = variants[variant];
  return (
    <div className={`${v.card} rounded-xl p-5 pb-3 shadow-sm relative overflow-hidden flex flex-col`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-black/5" />
      <div className="flex items-start justify-between flex-1">
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-[0.09em] mb-2 ${v.sub}`}>
            {label}
          </div>
          <div className="text-[30px] font-bold leading-none">{value}</div>
          {change && (
            <div className={`flex items-center gap-0.5 mt-2 text-[12px] ${v.sub}`}>
              <Icon name={change.up ? 'arrow_up' : 'arrow_dn'} size={13} color="currentColor" />
              {change.text}
            </div>
          )}
        </div>
        <div className={`${v.iconBg} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
          {renderIcon(icon, 22)}
        </div>
      </div>
      <div className="flex justify-end mt-3 pt-2.5 border-t border-current/10">
        <VerDetalles href={link} className={v.sub} />
      </div>
    </div>
  );
}
