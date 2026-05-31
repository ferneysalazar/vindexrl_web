import Icon from '../../shared/Icon';
import VerDetalles from '../../shared/VerDetalles';
import DashboardAvanzada from './DashboardAvanzada';
import DashboardTematica from './DashboardTematica';
import DashboardCompilaciones from './DashboardCompilaciones';

const FEATURES = [
  {
    icon: 'shield',
    title: 'Búsqueda Avanzada',
    body: DashboardAvanzada,
    link: '/busqueda-avanzada',
    bg: 'bg-[#e8edf7]', text: 'text-[#1e2d4a]', sub: 'text-[#6274a0]', iconBg: 'bg-[#1e2d4a]/10',
  },
  {
    icon: 'handshake',
    title: 'Búsqueda Tematica',
    body: DashboardTematica,
    link: '/busqueda-tematica',
    bg: 'bg-[#253659]', text: 'text-white', sub: 'text-white/60', iconBg: 'bg-white/10',
  },
  {
    icon: 'award',
    title: 'Compilaciones Normativas',
    body: DashboardCompilaciones,
    link: '/compilaciones',
    bg: 'bg-[#d4921a]', text: 'text-white', sub: 'text-white/70', iconBg: 'bg-black/15',
  },
];

export default function FeatureStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 rounded-xl overflow-hidden shadow-md">
      {FEATURES.map((item, i) => (
        <div key={i} className={`${item.bg} p-7 pb-3 flex flex-col`}>
          <div className="flex-1">
            <div className={`${item.iconBg} w-11 h-11 rounded-xl flex items-center justify-center mb-4`}>
              <Icon name={item.icon} size={22} color="currentColor" className={item.text} />
            </div>
            <div className={`font-display text-[15px] font-semibold mb-2 ${item.text}`}>{item.title}</div>
            <div className={`text-[12px] leading-[1.7] ${item.sub}`}><item.body /></div>
          </div>
          <div className="flex justify-end mt-3 pt-2.5 border-t border-current/10">
            <VerDetalles href={item.link} className={item.sub} />
          </div>
        </div>
      ))}
    </div>
  );
}
