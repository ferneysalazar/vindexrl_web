import { useState } from 'react';
import Icon from '../../shared/Icon';

const TABS = {
  mission: {
    label: 'Our Mission',
    text: "VindexRL is dedicated to delivering reliable counsel, ethical representation, and strategic solutions tailored to every client's unique legal needs. We combine deep industry experience and collaborative teamwork to secure strong outcomes and lasting client confidence.",
  },
  vision: {
    label: 'Our Vision',
    text: 'To be the most trusted legal management platform, empowering law firms to deliver exceptional client outcomes through data-driven insights and streamlined operations across every practice area.',
  },
  values: {
    label: 'Our Values',
    text: 'Integrity, precision, and client-first thinking define everything we do. We uphold the highest standards of legal ethics while embracing modern technology to serve our clients more effectively.',
  },
};

export default function AboutPanel() {
  const [tab, setTab] = useState('mission');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl overflow-hidden shadow-md">
      <div className="bg-[#1e2d4a] min-h-[220px] relative flex items-end p-7">
        <div
          className="absolute inset-0"
          style={{ background: 'repeating-linear-gradient(135deg,#1e2d4a 0,#1e2d4a 14px,#253659 14px,#253659 28px)' }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Icon name="scales" size={44} color="rgba(255,255,255,0.12)" />
          <span className="text-[10px] text-white/25 tracking-[0.1em] font-mono">
            attorney / team photo
          </span>
        </div>
        <div className="relative z-10">
          <div className="text-[10px] text-white/50 font-bold tracking-[0.1em] uppercase mb-2">
            Delivering Results
          </div>
          <div className="font-display text-[28px] font-bold text-white leading-tight">
            90+ Lorem Ipsum Dolor Est
          </div>
        </div>
      </div>

      <div className="bg-white p-7">
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-400 mb-2">
          About Our Firm
        </div>
        <h2 className="font-display text-[20px] font-bold text-[#1e2d4a] leading-snug mb-5">
          Lorem Ipsum Dolor Est
        </h2>

        <div className="flex gap-0 mb-5 border-b-2 border-slate-100">
          {Object.entries(TABS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`tab-btn px-4 py-1.5 text-[12px] font-bold mb-[-2px]
                ${tab === k ? 'active' : 'text-slate-400'}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <p className="text-[13px] text-slate-500 leading-[1.75]">{TABS[tab].text}</p>
      </div>
    </div>
  );
}
