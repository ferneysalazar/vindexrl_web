// src/components/admin/AdminFooter.jsx
import Icon from '../shared/Icon';

export default function AdminFooter() {
  return (
    <footer className="bg-[#1e2d4a] mt-8">
      <div className="border-t border-white/[0.08] px-7 py-4 flex flex-wrap items-center
        justify-between gap-2 text-[11px] text-white/30">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#c0392b] flex items-center justify-center">
            <Icon name="scales" size={13} color="#fff" />
          </div>
          <span>© 2026 VindexRL Legal Management. Admin Portal.</span>
        </div>
        <div className="flex gap-5">
          {['Privacy Policy', 'Terms of Service'].map(l => (
            <span
              key={l}
              className="cursor-pointer hover:text-white/75 transition-colors"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
