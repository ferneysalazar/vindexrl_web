/**
 * PdfLinkEditorPage — two-panel PDF document viewer inside EditorLayout.
 *
 * Layout:
 *   ┌─ Strip (130px) ─┬─────────── Viewer ──────────────┐
 *   │ scrollable       │ toolbar (zoom + back)            │
 *   │ thumbnails       │ scrollable full-res page cards   │
 *   └──────────────────┴──────────────────────────────────┘
 *
 * Startup sequence:
 *   1. Call rasterDocs.get(docId) → { total_pages } to know how many pages exist.
 *   2. Render that many placeholder slots (pulsing skeletons) in both Strip and Viewer.
 *   3. Fire rasterPages.get() in parallel for all pages at 'low' resolution.
 *   4. As each response arrives, replace the corresponding skeleton with the image.
 *      Pages that haven't loaded yet remain clickable (they scroll the viewer).
 *
 * Memory management:
 *   All blob URLs created by rasterPages.get() are tracked in blobUrlsRef and
 *   revoked on unmount. The underlying Blob objects stay in the module-level
 *   _rasterCache (api.js) so re-opening the editor skips the network entirely.
 *
 * TODO: replace RASTER_DOC_ID with the actual `docId` URL param once the raster
 *       service has all documents indexed (currently only one document is deployed).
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../../components/shared/Icon';
import { I } from '../../../icons';
import { rasterDocs, rasterPages } from '../../../services/api';

const THUMBNAIL_WIDTH  = 110;
const THUMBNAIL_HEIGHT = Math.round(THUMBNAIL_WIDTH * (297 / 210)); // A4 ratio ≈ 156px

const BASE_PAGE_WIDTH = 794;   // A4 at 96 dpi
const INITIAL_LOAD    = 5;     // number of pages to fetch thumbnails for on first open
const ZOOM_LEVELS = [
  { label: '100%', scale: 1   },
  { label: '120%', scale: 1.2 },
  { label: '150%', scale: 1.5 },
];

// Temporary: raster service currently only has this document deployed.
// Replace with `docId` from useParams() once all documents are indexed.
const RASTER_DOC_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export default function PdfLinkEditorPage() {
  const { docId } = useParams();
  const navigate   = useNavigate();
  const { state }  = useLocation();

  const [zoom,       setZoom]       = useState(1);
  const [pageCount,  setPageCount]  = useState(null);  // null = page count not yet known
  const [thumbnails, setThumbnails] = useState([]);    // blob URL per slot, null while loading

  // Tracks all blob URLs created this session so we can revoke them on unmount
  const blobUrlsRef = useRef([]);
  // One DOM ref per viewer page card — used by scrollToPage()
  const pageRefs    = useRef([]);

  const handleGoBack = () => {
    // Return to /admin/documents and signal it to reopen the form for this document
    navigate('/admin/documents', state?.docItem ? { state: { restoreItem: state.docItem } } : {});
  };

  // Smooth-scrolls the viewer to the card at the given 0-based index.
  // Called when the user clicks a thumbnail in the Strip, even if the
  // image hasn't loaded yet — the placeholder card is already in the DOM.
  const scrollToPage = (index) => {
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    // cancelled flag prevents state updates after unmount (e.g. user navigates
    // away before all fetches complete)
    let cancelled = false;

    rasterDocs.get(RASTER_DOC_ID)
      .then(({ total_pages }) => {
        if (cancelled) return;

        setPageCount(total_pages);
        setThumbnails(Array(total_pages).fill(null));
        pageRefs.current = Array(total_pages).fill(null);

        // Only fetch the first INITIAL_LOAD pages on open. The rest are fetched
        // on demand (e.g. when the user scrolls or clicks a thumbnail).
        Array.from({ length: Math.min(total_pages, INITIAL_LOAD) }, (_, i) => i + 1).forEach(page => {
          rasterPages.get(RASTER_DOC_ID, page, 'low')
            .then(blobUrl => {
              if (cancelled) {
                // Component unmounted while this was in flight — discard immediately
                URL.revokeObjectURL(blobUrl);
                return;
              }
              blobUrlsRef.current.push(blobUrl);
              setThumbnails(prev => {
                const next = [...prev];
                next[page - 1] = blobUrl;
                return next;
              });
            })
            .catch(() => {}); // leave slot null on error — skeleton placeholder stays
        });
      })
      .catch(() => {}); // strip stays in loading-skeleton state if metadata fetch fails

    return () => {
      cancelled = true;
      // Revoke all blob URLs to release browser memory. The raw Blobs remain
      // in the module-level cache (api.js) for future visits.
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const pageWidth  = Math.round(BASE_PAGE_WIDTH * zoom);
  const pageHeight = Math.round(1123 * zoom);
  const pages      = pageCount ? Array.from({ length: pageCount }, (_, i) => i + 1) : [];

  return (
    <>
      {/* ── Strip ── thumbnail sidebar, 130px wide (110px image + 10px padding each side) */}
      <aside className="w-[130px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
        {pageCount === null ? (
          // Show skeleton slots while waiting for rasterDocs.get() to return total_pages
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center px-[10px] pt-[10px] pb-[8px]">
              <div className="w-[110px] rounded bg-slate-200 animate-pulse" style={{ height: THUMBNAIL_HEIGHT }} />
              <div className="w-6 h-2 mt-2 rounded bg-slate-200 animate-pulse" />
            </div>
          ))
        ) : (
          pages.map((page, i) => (
            <button
              key={page}
              onClick={() => scrollToPage(i)}
              className="w-full flex flex-col items-center px-[10px] pt-[10px] pb-[8px] hover:bg-slate-50 transition-colors group"
            >
              <div
                className="w-[110px] rounded border border-slate-200 group-hover:border-[#1e2d4a]/25 transition-colors overflow-hidden flex items-center justify-center bg-slate-100"
                style={{ height: THUMBNAIL_HEIGHT }}
              >
                {thumbnails[i] ? (
                  // Image arrived — show it
                  <img src={thumbnails[i]} alt={`Page ${page}`} className="w-full h-full object-contain" />
                ) : (
                  // Still loading — pulsing skeleton; button remains clickable to pre-scroll
                  <div className="w-full h-full animate-pulse bg-slate-200" />
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 font-medium">{page}</span>
            </button>
          ))
        )}
      </aside>

      {/* ── Viewer ── toolbar + scrollable page list */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: 'rgb(250, 249, 245)' }}>

        {/* Toolbar — back button and zoom controls */}
        <div className="shrink-0 flex items-center gap-1 px-4 py-2 bg-white border-b border-slate-200">
          <button
            onClick={handleGoBack}
            title="Go back to the document"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-[#1e2d4a] transition-colors mr-2"
          >
            <I.goBack size={18} />
          </button>
          <div className="w-px h-5 bg-slate-200 mr-2" />
          {ZOOM_LEVELS.map(({ label, scale }) => (
            <button
              key={label}
              onClick={() => setZoom(scale)}
              className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors
                ${zoom === scale
                  ? 'bg-[#1e2d4a] text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-[#1e2d4a]'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable page list — one white A4 card per page.
            Each card gets a ref so scrollToPage() can jump to it from the Strip. */}
        <div className="flex-1 overflow-y-auto py-8">
          <div className="flex flex-col items-center gap-8">
            {pages.map((page, i) => (
              <div
                key={page}
                ref={el => pageRefs.current[i] = el}
                className="flex flex-col items-center gap-2"
              >
                {/* Page card — placeholder content; will be replaced by high-res image */}
                <div
                  className="bg-white shadow-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200"
                  style={{ width: pageWidth, minHeight: pageHeight }}
                >
                  <Icon name="pdf" size={56} color="#e2e8f0" />
                  <span className="text-[14px] text-slate-400 font-medium">Page {page}</span>
                  <span className="text-[12px] text-slate-300">Document #{docId}</span>
                </div>
                <span className="text-[11px] text-slate-400">{page} / {pageCount}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
