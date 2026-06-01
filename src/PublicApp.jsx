import { useState, useEffect } from 'react';
import { I } from './icons';
import Header from './components/public/Header';
import Sidebar from './components/public/Sidebar';
import Footer from './components/public/Footer';
import Dashboard from './components/public/dashboard/Dashboard';
import PlaceholderPage from './components/public/PlaceholderPage';
import { NAV } from './constants/nav';

const getSavedPage = () => {
  try { return JSON.parse(localStorage.getItem('vindexrl_state') || '{}').page || 'dashboard'; }
  catch { return 'dashboard'; }
};

export default function PublicApp() {
  const [page, setPage] = useState(getSavedPage);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 960);

  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 960);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('vindexrl_state', JSON.stringify({ page }));
  }, [page]);

  const currentPage = NAV.find(n => n.id === page);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fb]">
      <Header open={sidebarOpen} setOpen={setSidebarOpen} />
      <Sidebar
        active={page}
        setActive={setPage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div
        id="main"
        className="flex-1 flex flex-col"
        style={{ marginLeft: sidebarOpen ? '265px' : '0px', marginTop: '64px' }}
      >
        <div className="bg-white border-b border-slate-100 px-7 py-2.5 flex items-center gap-1.5
          text-[11px] text-slate-400">
          <button onClick={() => setPage('dashboard')} className="flex items-center gap-1 hover:text-[#1e2d4a] transition-colors">
            <I.house size={13} />
            <span>VindexRL</span>
          </button>
          <span className="text-slate-300">›</span>
          <span className="text-[#1e2d4a] font-bold">{currentPage?.label}</span>
        </div>

        <div className="px-7 pt-5 pb-0 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[24px] font-bold text-[#1e2d4a] leading-none my-5">
              {page === 'dashboard' ? 'La tecnología digital dirigida a la certeza jurídica que el sector público exige 🧭' : currentPage?.label}
            </h1>
          </div>
        </div>

        <main className="flex-1 px-7 py-5">
          {page === 'dashboard' ? <Dashboard /> : <PlaceholderPage pageId={page} />}
        </main>

        <Footer />
        <div className="px-7 pt-5 pb-0 flex flex-wrap items-start justify-between gap-3">
          <div>
           &nbsp;
          </div>
          {page === 'dashboard' && (
            <button
              className="btn-accent flex items-center gap-2 px-5 py-2.5 rounded-lg
                text-white text-[11px] font-bold tracking-wide"
              style={{ boxShadow: '0 4px 16px rgba(192,57,43,0.4)' }}
            >
              + NEW CASE
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
