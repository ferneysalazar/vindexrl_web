import Icon from '../../shared/Icon';

const ITEMS = [
  { icon: 'phone', label: 'Need Our Services?', value: '+1 200 300 9000',       bg: 'bg-[#e8edf7]', text: 'text-[#1e2d4a]', sub: 'text-[#6274a0]', iconBg: 'bg-[#1e2d4a]/10' },
  { icon: 'clock', label: 'Opening Hours',       value: 'Mon–Sat 08:00–20:00',  bg: 'bg-[#fdf3dc]', text: 'text-[#7a4d00]', sub: 'text-[#b87a20]', iconBg: 'bg-[#d4921a]/20' },
  { icon: 'mail',  label: 'Email Us',            value: 'contact@vindexrl.com', bg: 'bg-[#1e2d4a]', text: 'text-white',     sub: 'text-white/55',  iconBg: 'bg-white/10'      },
];

export default function ContactStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {ITEMS.map((item, i) => (
        <div key={i} className={`${item.bg} rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm`}>
          <div className={`${item.iconBg} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
            <Icon name={item.icon} size={19} color="currentColor" className={item.text} />
          </div>
          <div>
            <div className={`text-[10px] font-bold uppercase tracking-[0.08em] ${item.sub}`}>
              {item.label}
            </div>
            <div className={`text-[13px] font-bold mt-0.5 ${item.text}`}>{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
