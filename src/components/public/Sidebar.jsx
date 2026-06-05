import { useNavigate } from 'react-router-dom';
import Icon from '../shared/Icon';
import Logo from '../shared/Logo';
import { NAV } from '../../constants/nav';

function SectionLabel({ text }) {
  return (
    <div className="px-5 pt-2 pb-1 text-[9px] font-bold tracking-[0.12em] uppercase text-white/30">
      {text}
    </div>
  );
}

function NavBtn({ item, active, onSelect }) {
  const on = active === item.id;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`nav-item w-full flex items-center gap-3 px-5 py-[9px] text-[13px] text-left
        ${on ? 'active text-white' : 'text-white/55'}`}
    >
      <Icon name={item.icon} size={16} color="currentColor" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="bg-[#c0392b] text-white text-[10px] font-bold rounded-full px-[7px] py-[2px]">
          {item.badge}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({ active, setActive, open, setOpen }) {
  const navigate = useNavigate();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="sidebar"
        className={`fixed top-0 bottom-0 z-[300] flex flex-col bg-[#1e2d4a] w-[265px]
          shadow-2xl ${open ? 'left-0' : 'left-[-265px]'}`}
      >
        <div className="h-16 flex items-center px-5 bg-black/20 border-b border-white/[0.07] shrink-0">
          <Logo />
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <SectionLabel text="" />
          {NAV.slice(0, 6).map(item => (
            <NavBtn
              key={item.id}
              item={item}
              active={active}
              onSelect={id => { setActive(id); setOpen(false); }}
            />
          ))}
          <SectionLabel text="System" />
          {NAV.slice(6).map(item => (
            <NavBtn
              key={item.id}
              item={item}
              active={active}
              onSelect={id => { setActive(id); setOpen(false); }}
            />
          ))}
          <SectionLabel text="Admin" />
          <button
            onClick={() => { navigate('/admin/documents'); setOpen(false); }}
            className="nav-item w-full flex items-center gap-3 px-5 py-[9px] text-[13px] text-left
              text-white/55 hover:text-white hover:bg-white/5 transition-all"
          >
            <Icon name="documents" size={16} color="currentColor" />
            <span className="flex-1">Documents</span>
          </button>
        </nav>

        <div className="border-t border-white/[0.07] py-2 shrink-0">
          <button className="w-full flex items-center gap-3 px-5 py-2.5 text-white/40
            hover:text-white hover:bg-white/5 transition-all text-[13px]">
            <Icon name="logout" size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
