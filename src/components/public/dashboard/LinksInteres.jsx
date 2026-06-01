const LinksSectorInstitution = [
  { sectorInstitution: 'Gestion Jurídica Pública', text: 'Modelo de Gestión Jurídica Pública - MGJP', url: "http://www.eltiempo.com", type: 'External', color: '#d4921a' },
  { sectorInstitution: 'Gestion Jurídica Pública', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#d4921a' },
  { sectorInstitution: 'Gestion Jurídica Pública', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#d4921a' },
  { sectorInstitution: 'Gestion Jurídica Pública', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#d4921a' },
  { sectorInstitution: 'Gestion Jurídica Pública', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#d4921a' },
  { sectorInstitution: 'Gestion Jurídica Pública', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#d4921a' },
  { sectorInstitution: 'Instituto de Desarrollo Urbano', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#2e7d55' },
  { sectorInstitution: 'Instituto de Desarrollo Urbano', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#2e7d55' },
  { sectorInstitution: 'Instituto de Desarrollo Urbano', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#2e7d55' },
  { sectorInstitution: 'Instituto de Desarrollo Urbano', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#2e7d55' },
  { sectorInstitution: 'Manuales de Procedimientos', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#c0392b' },
  { sectorInstitution: 'Manuales de Procedimientos', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#c0392b' },
  { sectorInstitution: 'Manuales de Procedimientos', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#c0392b' },
  { sectorInstitution: 'Manuales de Procedimientos', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#c0392b' },
  { sectorInstitution: 'Manuales de Procedimientos', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#c0392b' },
  { sectorInstitution: 'Planes de Desarrollo', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#4a6bbf' },
  { sectorInstitution: 'Planes de Desarrollo', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#4a6bbf' },
  { sectorInstitution: 'Planes de Desarrollo', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#4a6bbf' },
  { sectorInstitution: 'Planes de Desarrollo', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#4a6bbf' },
  { sectorInstitution: 'Planes de Desarrollo', text: 'Lorem Ipsum Dolor', url: "http://www.eltiempo.com", type: 'External', color: '#4a6bbf' },
];

export default function LinksInteres() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-display text-[16px] font-semibold text-[#1e2d4a] mb-4">
        Links de Interés
      </h3>
      <div className="flex flex-col gap-2.5">
        {LinksSectorInstitution.map((e, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#f4f6fb]"
            style={{ borderLeft: `3px solid ${e.color}` }}
          >
            <div className="text-[12px] font-bold text-slate-400 w-10 shrink-0">{e.time}</div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold">{e.label}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{e.type}</div>
            </div>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
          </div>
        ))}
      </div>
    </div>
  );
}
