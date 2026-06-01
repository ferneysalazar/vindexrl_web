import { useState } from 'react';
import { I } from '../../../icons';

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

const sectors = Object.values(
  LinksSectorInstitution.reduce((acc, item) => {
    if (!acc[item.sectorInstitution]) {
      acc[item.sectorInstitution] = { name: item.sectorInstitution, color: item.color, links: [] };
    }
    acc[item.sectorInstitution].links.push({ text: item.text, url: item.url });
    return acc;
  }, {})
);

export default function LinksInteres() {
  const [expanded, setExpanded] = useState(new Set());

  function toggle(name) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-display text-[16px] font-semibold text-[#1e2d4a] mb-4">
        Links de Interés
      </h3>
      <div className="flex flex-col gap-2">
        {sectors.map((sector) => {
          const open = expanded.has(sector.name);
          return (
            <div
              key={sector.name}
              className="rounded-lg bg-[#f4f6fb] overflow-hidden"
              style={{ borderLeft: `3px solid ${sector.color}` }}
            >
              <button
                onClick={() => toggle(sector.name)}
                className="w-full flex items-center justify-between px-4 py-2.5
                  hover:bg-slate-100 transition-colors duration-150"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {sector.name}
                </span>
                <span className="text-slate-400 transition-transform duration-200"
                  style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <I.chev size={14} />
                </span>
              </button>

              {open && (
                <div className="px-4 pb-3 pt-1 grid grid-cols-3 gap-x-4 gap-y-1 border-t border-slate-100">
                  {sector.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-blue-700 hover:underline hover:text-blue-900 transition-colors"
                    >
                      {link.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
