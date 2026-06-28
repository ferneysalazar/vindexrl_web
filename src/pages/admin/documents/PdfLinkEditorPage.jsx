/**
 * PdfLinkEditorPage — two-panel PDF document viewer inside EditorLayout.
 *
 * Layout:
 *   ┌─ Strip (130px) ─┬─────────── Viewer ──────────────┐
 *   │ scrollable       │ toolbar (zoom + back)            │
 *   │ thumbnails       │ scrollable full-res page cards   │
 *   └──────────────────┴──────────────────────────────────┘
 *
 * Thumbnail loading strategy:
 *   1. rasterDocs.get() → total_pages  → build that many skeleton slots.
 *   2. Eagerly fetch the first INITIAL_LOAD pages at low resolution.
 *   3. For all remaining pages: an IntersectionObserver (root = aside) watches
 *      which strip slots enter the viewport. Entries are pushed onto a LIFO stack.
 *      When the user stops scrolling / pressing keys for IDLE_DELAY_MS (1 s), the
 *      stack is flushed: pages are popped in reverse-insertion order (most recently
 *      seen first) and fetched. Pages that scroll out of view before the timer
 *      fires are removed from the stack so only "paused-on" pages load.
 *
 * Memory management:
 *   All blob URLs are tracked in blobUrlsRef and revoked on unmount. The raw Blob
 *   objects remain in the module-level _rasterCache (api.js) so re-opening the
 *   editor skips the network.
 *
 * TODO: replace RASTER_DOC_ID with the actual `docId` URL param once the raster
 *       service has all documents indexed.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../../components/shared/Icon';
import { I } from '../../../icons';
import { rasterDocs, rasterPages } from '../../../services/api';

const THUMBNAIL_WIDTH  = 110;
const THUMBNAIL_HEIGHT = Math.round(THUMBNAIL_WIDTH * (297 / 210)); // A4 ratio ≈ 156px

const BASE_PAGE_WIDTH = 794;   // A4 at 96 dpi
const INITIAL_LOAD    = 5;     // pages fetched eagerly on open
const IDLE_DELAY_MS   = 1000;  // ms of inactivity before LIFO queue is flushed

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
  const [pageCount,  setPageCount]  = useState(null); // null = page count not yet known
  const [thumbnails, setThumbnails] = useState([]);   // blob URL per slot, null while loading

  // Blob URL tracking — all created URLs are revoked on unmount
  const blobUrlsRef  = useRef([]);
  const cancelledRef = useRef(false); // set true on unmount to abort in-flight callbacks

  // DOM refs
  const asideRef      = useRef(null); // the aside element (scroll listener + observer root)
  const stripSlotRefs = useRef([]);   // one ref per strip button (for IntersectionObserver)
  const pageRefs      = useRef([]);   // one ref per viewer card (for scrollToPage)

  // LIFO lazy-load bookkeeping — all refs, no renders needed
  const lifoStack   = useRef([]);          // pages waiting to load; last item = highest priority
  const loadingSet  = useRef(new Set());   // pages currently being fetched (prevents duplicates)
  const loadedSet   = useRef(new Set());   // pages successfully loaded (guards enqueue check)
  const debounceRef = useRef(null);        // idle-detection setTimeout handle
  const observerRef = useRef(null);        // IntersectionObserver instance

  const handleGoBack = () => {
    navigate('/admin/documents', state?.docItem ? { state: { restoreItem: state.docItem } } : {});
  };

  // Smooth-scrolls the viewer to the card at the given 0-based index.
  // Works even before the thumbnail image has loaded.
  const scrollToPage = (index) => {
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Effect 1 ─────────────────────────────────────────────────────────────────
  // Fetch total_pages from the raster service, then eagerly load the first
  // INITIAL_LOAD thumbnails without waiting for user interaction.
  useEffect(() => {
    cancelledRef.current = false;

    rasterDocs.get(RASTER_DOC_ID)
      .then(({ total_pages }) => {
        if (cancelledRef.current) return;

        setPageCount(total_pages);
        setThumbnails(Array(total_pages).fill(null));

        Array.from({ length: Math.min(total_pages, INITIAL_LOAD) }, (_, i) => i + 1)
          .forEach(page => {
            loadingSet.current.add(page);
            rasterPages.get(RASTER_DOC_ID, page, 'low')
              .then(blobUrl => {
                if (cancelledRef.current) { URL.revokeObjectURL(blobUrl); return; }
                blobUrlsRef.current.push(blobUrl);
                loadingSet.current.delete(page);
                loadedSet.current.add(page);
                // Unobserve now that this slot is filled (no-op if observer not yet set up)
                observerRef.current?.unobserve(stripSlotRefs.current[page - 1]);
                setThumbnails(prev => {
                  const next = [...prev];
                  next[page - 1] = blobUrl;
                  return next;
                });
              })
              .catch(() => { loadingSet.current.delete(page); });
          });
      })
      .catch(() => {});

    return () => {
      cancelledRef.current = true;
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // ── Effect 2 ─────────────────────────────────────────────────────────────────
  // Set up IntersectionObserver and the debounced LIFO loader once the strip
  // DOM slots exist (i.e. after pageCount is known and the component re-rendered).
  useEffect(() => {
    if (!pageCount) return;

    const aside = asideRef.current;

    // Drain the LIFO stack: pop each page (most recently visible first) and fetch it.
    // All pops fire their fetches in parallel — LIFO order sets fetch priority,
    // not serialisation.
    const flushQueue = () => {
      while (lifoStack.current.length > 0) {
        const page = lifoStack.current.pop();
        if (loadedSet.current.has(page) || loadingSet.current.has(page)) continue;

        loadingSet.current.add(page);
        rasterPages.get(RASTER_DOC_ID, page, 'low')
          .then(blobUrl => {
            if (cancelledRef.current) { URL.revokeObjectURL(blobUrl); return; }
            blobUrlsRef.current.push(blobUrl);
            loadingSet.current.delete(page);
            loadedSet.current.add(page);
            // Slot is filled — stop observing it
            observerRef.current?.unobserve(stripSlotRefs.current[page - 1]);
            setThumbnails(prev => {
              const next = [...prev];
              next[page - 1] = blobUrl;
              return next;
            });
          })
          .catch(() => { loadingSet.current.delete(page); });
      }
    };

    // Restart the idle timer. Loading only begins after the user has been
    // still for IDLE_DELAY_MS — any scroll or key event resets the clock.
    const resetDebounce = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(flushQueue, IDLE_DELAY_MS);
    };

    // IntersectionObserver root = aside so only slots visible inside the strip
    // panel trigger callbacks (not the entire page).
    // threshold: 0 → any visible pixel counts as intersecting.
    const observer = new IntersectionObserver((entries) => {
      let queued = false;

      entries.forEach(entry => {
        const page = parseInt(entry.target.dataset.page, 10);

        if (entry.isIntersecting) {
          // Slot scrolled into view — push onto LIFO stack if not already tracked
          if (
            !loadedSet.current.has(page) &&
            !loadingSet.current.has(page) &&
            !lifoStack.current.includes(page)
          ) {
            lifoStack.current.push(page);
            queued = true;
          }
        } else {
          // Slot scrolled out of view — remove from stack if not yet fetching.
          // This ensures only pages the user actually stopped on get loaded.
          if (!loadingSet.current.has(page)) {
            const idx = lifoStack.current.indexOf(page);
            if (idx !== -1) lifoStack.current.splice(idx, 1);
          }
        }
      });

      if (queued) resetDebounce();
    }, { root: aside, threshold: 0 });

    observerRef.current = observer;

    // Observe all strip slots that are not already loading or loaded
    stripSlotRefs.current.forEach((el, i) => {
      const page = i + 1;
      if (el && !loadedSet.current.has(page) && !loadingSet.current.has(page)) {
        observer.observe(el);
      }
    });

    // Scroll on the strip or any key press resets the idle timer so loading
    // never begins while the user is actively navigating
    const onActivity = () => resetDebounce();
    aside?.addEventListener('scroll', onActivity);
    window.addEventListener('keydown', onActivity);

    return () => {
      observer.disconnect();
      aside?.removeEventListener('scroll', onActivity);
      window.removeEventListener('keydown', onActivity);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pageCount]);

  const pageWidth  = Math.round(BASE_PAGE_WIDTH * zoom);
  const pageHeight = Math.round(1123 * zoom);
  const pages      = pageCount ? Array.from({ length: pageCount }, (_, i) => i + 1) : [];

  return (
    <>
      {/* ── Strip ── thumbnail sidebar */}
      <aside ref={asideRef} className="w-[130px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
        {pageCount === null ? (
          // Skeleton while rasterDocs.get() is in flight
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
              ref={el => { stripSlotRefs.current[i] = el; }}
              data-page={page}
              onClick={() => scrollToPage(i)}
              className="w-full flex flex-col items-center px-[10px] pt-[10px] pb-[8px] hover:bg-slate-50 transition-colors group"
            >
              <div
                className="w-[110px] rounded border border-slate-200 group-hover:border-[#1e2d4a]/25 transition-colors overflow-hidden flex items-center justify-center bg-slate-100"
                style={{ height: THUMBNAIL_HEIGHT }}
              >
                {thumbnails[i] ? (
                  <img src={thumbnails[i]} alt={`Page ${page}`} className="w-full h-full object-contain" />
                ) : (
                  // Pulsing skeleton — slot is clickable even before the image arrives
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
            Each card gets a pageRef so Strip thumbnail clicks can scroll to it. */}
        <div className="flex-1 overflow-y-auto py-8">
          <div className="flex flex-col items-center gap-8">
            {pages.map((page, i) => (
              <div
                key={page}
                ref={el => { pageRefs.current[i] = el; }}
                className="flex flex-col items-center gap-2"
              >
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
