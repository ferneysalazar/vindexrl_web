// src/components/shared/Logo.jsx
import Icon from './Icon';

export default function Logo({ subtitle = 'Gerencia Normativa' }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-md bg-[#c0392b] flex items-center justify-center shrink-0">
        <Icon name="scales" size={20} color="#fff" />
      </div>
      <div>
        <div className="font-display text-[19px] font-bold text-white tracking-widest leading-none">
          VindexRL
        </div>
        <div className="text-[9px] text-white/40 tracking-[0.14em] uppercase mt-0.5">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
