// src/components/admin/AdminHeader.jsx
import Icon from '../shared/Icon';
import Logo from '../shared/Logo';

export default function AdminHeader({ open, setOpen }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-[100] bg-[#1e2d4a]
      border-b border-white/[0.06] flex items-center shadow-lg">

      <button
        onClick={() => setOpen(o => !o)}
        className="w-16 h-16 flex items-center justify-center shrink-0
          text-white hover:bg-black/10 transition-colors"
      >
        <Icon name={open ? 'close' : 'menu'} size={22} color="currentColor" />
      </button>

      <div className={`transition-opacity duration-200 shrink-0 pl-1 ${open ? 'opacity-0' : 'opacity-100'}`}>
        <Logo subtitle="Admin Portal" />
      </div>
      <div className="flex-1" />

      {/* Admin badge */}
      <div className="hidden sm:flex items-center gap-2 bg-[#c0392b]/20 border border-[#c0392b]/30
        rounded-lg px-3 py-1.5 mr-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#c0392b]" />
        <span className="text-[11px] font-bold text-[#c0392b] tracking-wide uppercase">Admin Mode</span>
      </div>

      <button className="relative w-10 h-10 rounded-lg flex items-center justify-center
        text-white/65 hover:bg-black/10 transition-colors mr-1">
        <Icon name="bell" size={20} color="currentColor" />
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#c0392b]
          border-2 border-[#1e2d4a]" />
      </button>

      <div className="w-9 h-9 rounded-full bg-[#c0392b] flex items-center justify-center
        mr-4 shrink-0 border-2 border-white/20 cursor-pointer">
        <Icon name="user" size={17} color="#fff" />
      </div>
    </header>
  );
}
