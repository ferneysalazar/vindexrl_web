import { variants, renderIcon } from './StatCard';
import VerDetalles from '../../shared/VerDetalles';

export default function ContentCard({ label, icon, variant = 'white', link, children }) {
  const v = variants[variant];
  return (
    <div className={`${v.card} rounded-xl p-5 pb-3 shadow-sm relative overflow-hidden flex flex-col`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-black/5" />
      <div className="flex items-center justify-between mb-3">
        <div className={`text-[10px] font-bold uppercase tracking-[0.09em] ${v.sub}`}>
          {label}
        </div>
        {icon && (
          <div className={`${v.iconBg} w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}>
            {renderIcon(icon, 16)}
          </div>
        )}
      </div>
      <div className="flex-1">
        {children}
      </div>
      <div className="flex justify-end mt-3 pt-2.5 border-t border-current/10">
        <VerDetalles href={link} className={v.sub} />
      </div>
    </div>
  );
}
