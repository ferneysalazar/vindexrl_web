/**
 * EditorLayout — full-screen shell for the PDF Link Editor.
 *
 * Intentionally has no sidebar or admin chrome so the entire viewport is
 * available for the document viewer. It is registered as a sibling of
 * AdminLayout in App.jsx (not nested inside it) so it gets its own layout tree.
 *
 * Navigation contract:
 *   • Opened via navigate(`/admin/documents/:docId/pdf-link-editor`, { state })
 *     from DocumentForm. The state payload carries: docId, docName, docItem.
 *   • The X button calls handleClose, which navigates back to /admin/documents
 *     and passes state.restoreItem so DocumentsPage can reopen the form for
 *     the same document automatically.
 *   • If the user lands here without router state (e.g. direct URL), the header
 *     falls back to a generic title and the close button still works.
 */
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { I } from '../icons';
import Logo from '../components/shared/Logo';

export default function EditorLayout() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const docName = state?.docName ?? (state?.docId ? `Document #${state.docId}` : 'PDF Link Editor');

  const handleClose = () => {
    // Pass docItem back so DocumentsPage can reopen the form without an extra API call
    navigate('/admin/documents', state?.docItem ? { state: { restoreItem: state.docItem } } : {});
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Slim dark header — Logo, document name, close button */}
      <header className="h-12 shrink-0 bg-[#1e2d4a] flex items-center gap-3 px-4 border-b border-white/[0.06] shadow-md">
        <Logo subtitle="PDF Link Editor" />
        <div className="w-px h-5 bg-white/10 mx-2 shrink-0" />
        <span className="flex-1 text-white/60 text-[13px] truncate">{docName}</span>
        <button
          onClick={handleClose}
          title="Close and return to document"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <I.x size={18} />
        </button>
      </header>

      {/* Content area — fills remaining viewport; child route renders here via Outlet */}
      <div className="flex-1 flex overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
