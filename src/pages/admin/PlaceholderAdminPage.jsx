// src/pages/admin/PlaceholderAdminPage.jsx
import Icon from '../../components/shared/Icon';
import { ADMIN_NAV } from '../../constants/adminNav';

export default function PlaceholderAdminPage({ pageId }) {
  const page = ADMIN_NAV.find(n => n.id === pageId);
  return (
    <div className="bg-white rounded-xl p-16 shadow-sm text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
        <Icon name={page?.icon || 'documents'} size={28} color="#9098b1" />
      </div>
      <h2 className="font-display text-[22px] text-[#1e2d4a] mb-2">{page?.label}</h2>
      <p className="text-[13px] text-slate-400 max-w-xs mx-auto leading-relaxed">
        This admin section is ready to be built out.
      </p>
    </div>
  );
}
