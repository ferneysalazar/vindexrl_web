// src/layouts/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminFooter from '../components/admin/AdminFooter';
import { ADMIN_NAV } from '../constants/adminNav';
import { I } from '../icons';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 960);
  const location = useLocation();

  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 960);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Derive current page label from URL
  const segment     = location.pathname.split('/').pop();
  const currentPage = ADMIN_NAV.find(n => n.id === segment);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fb]">
      <AdminHeader open={sidebarOpen} setOpen={setSidebarOpen} />
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div
        className="flex-1 flex flex-col transition-all duration-[280ms] ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ marginLeft: sidebarOpen ? '265px' : '0px', marginTop: '64px' }}
      >
        {/* Breadcrumb: home link, then admin section and current page */}
        <div className="bg-white border-b border-slate-100 px-7 py-2.5 flex items-center gap-1.5
          text-[11px] text-slate-400">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-[#1e2d4a] transition-colors">
            <I.house size={13} />
            <span>VindexRL</span>
          </button>
          <span className="text-slate-300">›</span>
          <span className="text-[#c0392b] font-bold text-[10px] uppercase tracking-wide">Admin</span>
          <span className="text-slate-300">›</span>
          <span className="text-[#1e2d4a] font-bold">{currentPage?.label || 'Dashboard'}</span>
        </div>

        {/* Page content — rendered by child routes */}
        <main className="flex-1 px-7 py-5">
          <Outlet />
        </main>

        <AdminFooter />
      </div>
    </div>
  );
}
