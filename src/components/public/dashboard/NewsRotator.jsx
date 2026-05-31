import { useState, useEffect, useCallback } from 'react';
import { I } from '../../../icons';

const DEFAULT_NEWS = [
  {
    id: 1,
    tag: 'Jurisprudencia',
    title: 'Corte Constitucional amplía protección a trabajadores en plataformas digitales',
    date: '30 may 2026',
    url: '#',
  },
  {
    id: 2,
    tag: 'Legislación',
    title: 'Nuevo reglamento de contratación estatal entra en vigor el próximo trimestre',
    date: '28 may 2026',
    url: '#',
  },
  {
    id: 3,
    tag: 'Doctrina',
    title: 'Consejo de Estado unifica criterios sobre nulidad en actos administrativos',
    date: '26 may 2026',
    url: '#',
  },
  {
    id: 4,
    tag: 'Normativa',
    title: 'MinJusticia publica guía para implementación del nuevo Código Disciplinario',
    date: '24 may 2026',
    url: '#',
  },
  {
    id: 5,
    tag: 'Jurisprudencia',
    title: 'Sala Laboral precisa alcance de la estabilidad reforzada por salud',
    date: '22 may 2026',
    url: '#',
  },
  {
    id: 6,
    tag: 'Legislación',
    title: 'Proyecto de ley busca regular el uso de inteligencia artificial en procesos judiciales',
    date: '20 may 2026',
    url: '#',
  },
];

const INTERVAL = 5000;

export default function NewsRotator({ news = DEFAULT_NEWS }) {
  const items = news.slice(0, 10);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = useCallback((idx) => {
    setVisible(false);
    setTimeout(() => {
      setActive(idx);
      setVisible(true);
    }, 180);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => goTo((active + 1) % items.length), INTERVAL);
    return () => clearTimeout(t);
  }, [active, items.length, goTo]);

  const item = items[active];

  return (
    <div className="flex flex-col gap-3">
      {/* content */}
      <div
        className="transition-opacity duration-[180ms]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="inline-block text-[9px] font-bold uppercase tracking-widest
          bg-black/15 rounded-full px-2 py-0.5 mb-2">
          {item.tag}
        </span>
        <a
          href={item.url}
          className="block text-[13px] font-semibold leading-snug hover:underline line-clamp-3"
        >
          {item.title}
        </a>
        <div className="flex items-center gap-1 mt-2 text-[11px] opacity-60">
          <I.calendar size={11} />
          {item.date}
        </div>
      </div>

      {/* pagination dots */}
      <div className="flex items-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Noticia ${i + 1}`}
            className="transition-all duration-200 rounded-full bg-current shrink-0"
            style={{
              width:   i === active ? 16 : 6,
              height:  6,
              opacity: i === active ? 0.9 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
