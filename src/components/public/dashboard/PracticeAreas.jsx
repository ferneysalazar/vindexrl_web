import Icon from '../../shared/Icon';

const AREAS = [
  { icon: 'cases',     label: 'Personal Injury', count: 12, max: 15 },
  { icon: 'clients',   label: 'Family Law',      count: 8,  max: 15 },
  { icon: 'billing',   label: 'Criminal Defense',count: 5,  max: 15 },
  { icon: 'documents', label: 'Employment Law',  count: 14, max: 15 },
];

export default function PracticeAreas() {
  return (
    <div className="bg-[#1e2d4a] rounded-xl p-6 shadow-md">
      <h3 className="font-display text-[16px] font-semibold text-white mb-1">Análisis Jurisprudencial</h3>
      <p className="text-[11px] text-white/40 mb-5">Active case distribution</p>
      <div className="flex flex-col gap-4">
        {AREAS.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Icon name={a.icon} size={15} color="#c0392b" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1.5">
                <span className="text-[12px] text-white/80 font-semibold">{a.label}</span>
                <span className="text-[11px] text-white/40">{a.count}</span>
              </div>
              <div className="h-[3px] bg-white/10 rounded-full">
                <div
                  className="h-full bg-[#c0392b] rounded-full transition-all duration-700"
                  style={{ width: `${(a.count / a.max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
