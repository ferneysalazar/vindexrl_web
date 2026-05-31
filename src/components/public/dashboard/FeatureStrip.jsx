import { useState } from 'react';
import VerDetalles from '../../shared/VerDetalles';
import { renderIcon } from './StatCard';
import { I } from '../../../icons';
import DashboardAvanzada from './DashboardBusquedaAvanzada';
import DashboardTematica from './DashboardTematica';
import DashboardCompilaciones from './DashboardCompilaciones';

const FEATURES = [
  {
    icon: I.search,
    title: 'Búsqueda Avanzada',
    body: DashboardAvanzada,
    link: '/busqueda-avanzada',
    bg: 'bg-[#e8edf7]', text: 'text-[#1e2d4a]', sub: 'text-[#6274a0]', iconBg: 'bg-[#1e2d4a]/10',
  },
  {
    icon: I.notebookTabs,
    title: 'Búsqueda Tematica',
    body: DashboardTematica,
    link: '/busqueda-tematica',
    bg: 'bg-[#253659]', text: 'text-white', sub: 'text-white/60', iconBg: 'bg-white/10',
  },
  {
    icon: I.packageCheck,
    title: 'Compilaciones Normativas',
    body: DashboardCompilaciones,
    link: '/compilaciones',
    bg: 'bg-[#fdf3dc]', text: 'text-[#7a4d00]', sub: 'text-[#b87a20]', iconBg: 'bg-[#d4921a]/20',
  },
];

export default function FeatureStrip() {
  const [active, setActive] = useState(0);
  const item = FEATURES[active];

  return (
    <div className="rounded-xl overflow-hidden shadow-md">

      {/* tab bar */}
      <div className="bg-white flex gap-0 border-b-2 border-slate-100 px-3 pb-2">
        {FEATURES.map((f, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`tab-btn flex items-center gap-1.5 px-4 py-3 text-[12px] font-bold mb-[-2px]
              ${active === i ? 'active' : 'text-slate-400'}`}
          >
            <span className={active === i ? 'text-[#c0392b]' : 'text-slate-300'}>
              {renderIcon(f.icon, 13)}
            </span>
            {f.title}
          </button>
        ))}
      </div>

      {/* active feature panel */}
      <div className={`${item.bg} p-7 pb-3 flex flex-col`}>
        <div className="flex-1">
          <div className={`${item.iconBg} w-11 h-11 rounded-xl flex items-center justify-center mb-4`}>
            {renderIcon(item.icon, 22)}
          </div>
          <div className={`font-display text-[15px] font-semibold mb-2 ${item.text}`}>{item.title}</div>
          <div className={`text-[12px] leading-[1.7] ${item.sub}`}><item.body /></div>
        </div>
        <div className="flex justify-end mt-3 pt-2.5 border-t border-current/10">
          <VerDetalles href={item.link} className={item.sub} />
        </div>
      </div>

    </div>
  );
}
