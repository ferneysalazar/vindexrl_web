/**
 * PdfLinkEditorPage — two-panel PDF document viewer inside EditorLayout.
 *
 * Layout:
 *   ┌─ Strip (130px) ─┬─────────── Viewer ──────────────┐
 *   │ scrollable       │ toolbar (zoom + back)            │
 *   │ thumbnails       │ scrollable full-res page cards   │
 *   └──────────────────┴──────────────────────────────────┘
 *
 * Thumbnail loading (Strip — low res, cheap):
 *   1. rasterDocs.get() → total_pages  → build skeleton slots.
 *   2. Eagerly fetch first STRIP_INITIAL_LOAD (5) pages at 'low' resolution.
 *   3. Remaining pages: IntersectionObserver (root = aside) watches strip slots.
 *      Visible slots push onto a LIFO stack; slots that scroll away before the
 *      idle timer fires are removed. After IDLE_DELAY_MS of inactivity the stack
 *      is flushed — most-recently-visible page fetched first.
 *
 * Page image loading (Viewer — medium res, expensive):
 *   Same LIFO + debounce algorithm, but scoped to the viewer scroll container.
 *   Only VIEWER_INITIAL_LOAD (2) pages are fetched eagerly to keep initial cost low;
 *   the rest load on demand as the user reads through the document.
 *
 * Strip ↔ Viewer sync:
 *   A third IntersectionObserver (root = viewer scroll container) tracks which
 *   viewer page cards are visible. While sync is enabled, the strip is
 *   programmatically scrolled to keep the current page's thumbnail in view.
 *   Sync is DISABLED when the user touches the strip (pointerdown) and
 *   RE-ENABLED when the user scrolls or clicks inside the viewer panel.
 *
 * Memory management:
 *   All blob URLs from both strip and viewer are tracked in blobUrlsRef and
 *   revoked on unmount. Raw Blobs stay in the module-level _rasterCache (api.js).
 *
 * TODO: replace RASTER_DOC_ID with the actual `docId` URL param once the raster
 *       service has all documents indexed.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { I } from '../../../icons';
import { rasterDocs, rasterPages, linkTypes as linkTypesApi, documentLinks as documentLinksApi } from '../../../services/api';
import VrlToolbar from '../../../components/editor/VrlToolbar';
import AnnotationCanvas from '../../../components/editor/AnnotationCanvas';

const THUMBNAIL_WIDTH  = 110;
const THUMBNAIL_HEIGHT = Math.round(THUMBNAIL_WIDTH * (297 / 210)); // A4 ≈ 156px

const BASE_PAGE_WIDTH        = 794;   // A4 at 96 dpi
const IDLE_DELAY_MS          = 1000;  // ms of inactivity before LIFO queue is flushed
const STRIP_INITIAL_LOAD     = 5;     // strip thumbnails fetched eagerly on open (cheap)
const VIEWER_INITIAL_LOAD    = 2;     // viewer pages fetched eagerly on open (expensive)
const STRIP_RES              = 'low';
const VIEWER_RES             = 'medium';
const HIRES_RES              = 'high';
const READING_DWELL_MS       = 5000;  // ms a page must stay visible before upgrading to high-res

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

  const [zoom,         setZoom]         = useState(1);
  const [pageCount,    setPageCount]    = useState(null);
  const [thumbnails,   setThumbnails]   = useState([]); // strip low-res blob URLs
  const [viewerImages, setViewerImages] = useState([]); // viewer high-res blob URLs

  // All created blob URLs — revoked together on unmount
  const blobUrlsRef  = useRef([]);
  const cancelledRef = useRef(false);

  // DOM refs
  const asideRef       = useRef(null); // strip aside element
  const viewerScrollRef= useRef(null); // viewer scroll container div
  const stripSlotRefs  = useRef([]);   // strip thumbnail buttons
  const pageRefs       = useRef([]);   // viewer page card wrappers

  // ── Strip lazy-load refs ──────────────────────────────────────────────────
  const stripLifoStack  = useRef([]);
  const stripLoadingSet = useRef(new Set());
  const stripLoadedSet  = useRef(new Set());
  const stripDebounce   = useRef(null);
  const stripObserver   = useRef(null);

  // ── Viewer lazy-load refs (medium res) ───────────────────────────────────
  const viewerLifoStack  = useRef([]);
  const viewerLoadingSet = useRef(new Set());
  const viewerLoadedSet  = useRef(new Set());
  const viewerDebounce   = useRef(null);
  const viewerObserver   = useRef(null);

  // ── High-res upgrade refs ─────────────────────────────────────────────────
  // Separate from the medium-res cache. A page upgrades to high-res after it
  // has been continuously visible for READING_DWELL_MS — indicating the user
  // is actually reading it. The raw Blob is stored in _rasterCache (api.js)
  // under the key "docId:page:high", independent of the medium-res entry.
  const hiResLoadedSet  = useRef(new Set()); // pages already upgraded
  const hiResLoadingSet = useRef(new Set()); // upgrades in flight
  const readingTimers   = useRef(new Map()); // page → setTimeout id

  // ── Strip ↔ Viewer sync refs ──────────────────────────────────────────────
  // syncEnabled:  true  = viewer scroll drives strip scroll (default)
  //               false = user is manually controlling the strip; sync paused
  const syncEnabled  = useRef(true);
  // suppressSync: true while scrollToPage() animation is running so the viewer
  // scroll events fired mid-animation cannot accidentally re-enable sync while
  // the viewer is still passing through intermediate pages on the way to the target.
  const suppressSync = useRef(false);

  const handleGoBack = () => {
    navigate('/admin/documents', state?.docItem ? { state: { restoreItem: state.docItem } } : {});
  };

  // Scroll the viewer to the given 0-based page index (called from strip clicks).
  // Suppresses sync for 800 ms — long enough for the smooth-scroll animation to
  // complete — so intermediate pages don't drive the strip back toward page 1.
  const scrollToPage = (index) => {
    suppressSync.current = true;
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { suppressSync.current = false; }, 800);
  };

  // ── Effect 1: fetch page count + eager initial load ───────────────────────
  useEffect(() => {
    cancelledRef.current = false;

    rasterDocs.get(RASTER_DOC_ID)
      .then(({ total_pages }) => {
        if (cancelledRef.current) return;

        setPageCount(total_pages);
        setThumbnails(Array(total_pages).fill(null));
        setViewerImages(Array(total_pages).fill(null));

        const eagerStripPages = Array.from(
          { length: Math.min(total_pages, STRIP_INITIAL_LOAD) },
          (_, i) => i + 1
        );
        const eagerViewerPages = Array.from(
          { length: Math.min(total_pages, VIEWER_INITIAL_LOAD) },
          (_, i) => i + 1
        );

        // Eagerly fetch strip thumbnails (low res, cheap)
        eagerStripPages.forEach(page => {
          stripLoadingSet.current.add(page);
          rasterPages.get(RASTER_DOC_ID, page, STRIP_RES)
            .then(blobUrl => {
              if (cancelledRef.current) { URL.revokeObjectURL(blobUrl); return; }
              blobUrlsRef.current.push(blobUrl);
              stripLoadingSet.current.delete(page);
              stripLoadedSet.current.add(page);
              stripObserver.current?.unobserve(stripSlotRefs.current[page - 1]);
              setThumbnails(prev => {
                const next = [...prev];
                next[page - 1] = blobUrl;
                return next;
              });
            })
            .catch(() => { stripLoadingSet.current.delete(page); });
        });

        // Eagerly fetch viewer images (medium res, expensive — only first VIEWER_INITIAL_LOAD)
        eagerViewerPages.forEach(page => {
          viewerLoadingSet.current.add(page);
          rasterPages.get(RASTER_DOC_ID, page, VIEWER_RES)
            .then(blobUrl => {
              if (cancelledRef.current) { URL.revokeObjectURL(blobUrl); return; }
              blobUrlsRef.current.push(blobUrl);
              viewerLoadingSet.current.delete(page);
              viewerLoadedSet.current.add(page);
              // Do NOT unobserve viewer cards — the observer must keep tracking all
              // pages so visibleViewerPages stays accurate for strip sync.
              // Re-queuing is already blocked by the viewerLoadedSet guard.
              setViewerImages(prev => {
                const next = [...prev];
                next[page - 1] = blobUrl;
                return next;
              });
            })
            .catch(() => { viewerLoadingSet.current.delete(page); });
        });
      })
      .catch(() => {});

    return () => {
      cancelledRef.current = true;
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // ── Effect 2: strip IntersectionObserver + LIFO debounce ─────────────────
  // Runs after pageCount is known (DOM strip slots are mounted).
  useEffect(() => {
    if (!pageCount) return;

    const aside = asideRef.current;

    const flushStripQueue = () => {
      while (stripLifoStack.current.length > 0) {
        const page = stripLifoStack.current.pop();
        if (stripLoadedSet.current.has(page) || stripLoadingSet.current.has(page)) continue;
        stripLoadingSet.current.add(page);
        rasterPages.get(RASTER_DOC_ID, page, STRIP_RES)
          .then(blobUrl => {
            if (cancelledRef.current) { URL.revokeObjectURL(blobUrl); return; }
            blobUrlsRef.current.push(blobUrl);
            stripLoadingSet.current.delete(page);
            stripLoadedSet.current.add(page);
            stripObserver.current?.unobserve(stripSlotRefs.current[page - 1]);
            setThumbnails(prev => {
              const next = [...prev];
              next[page - 1] = blobUrl;
              return next;
            });
          })
          .catch(() => { stripLoadingSet.current.delete(page); });
      }
    };

    const resetStripDebounce = () => {
      if (stripDebounce.current) clearTimeout(stripDebounce.current);
      stripDebounce.current = setTimeout(flushStripQueue, IDLE_DELAY_MS);
    };

    const obs = new IntersectionObserver((entries) => {
      let queued = false;
      entries.forEach(entry => {
        const page = parseInt(entry.target.dataset.page, 10);
        if (entry.isIntersecting) {
          if (
            !stripLoadedSet.current.has(page) &&
            !stripLoadingSet.current.has(page) &&
            !stripLifoStack.current.includes(page)
          ) {
            stripLifoStack.current.push(page);
            queued = true;
          }
        } else {
          if (!stripLoadingSet.current.has(page)) {
            const idx = stripLifoStack.current.indexOf(page);
            if (idx !== -1) stripLifoStack.current.splice(idx, 1);
          }
        }
      });
      if (queued) resetStripDebounce();
    }, { root: aside, threshold: 0 });

    stripObserver.current = obs;

    stripSlotRefs.current.forEach((el, i) => {
      const page = i + 1;
      if (el && !stripLoadedSet.current.has(page) && !stripLoadingSet.current.has(page)) {
        obs.observe(el);
      }
    });

    const onStripActivity = () => resetStripDebounce();
    aside?.addEventListener('scroll', onStripActivity);
    window.addEventListener('keydown', onStripActivity);

    return () => {
      obs.disconnect();
      aside?.removeEventListener('scroll', onStripActivity);
      window.removeEventListener('keydown', onStripActivity);
      if (stripDebounce.current) clearTimeout(stripDebounce.current);
    };
  }, [pageCount]);

  // ── Effect 3: viewer IntersectionObserver + LIFO debounce + strip sync ────
  // Same lazy-load pattern as Effect 2 but for high-res viewer images.
  // Additionally tracks which viewer page is topmost-visible and scrolls
  // the strip to keep it in sync — unless the user has manually touched
  // the strip, in which case sync is paused until they interact with the viewer.
  useEffect(() => {
    if (!pageCount) return;

    const aside    = asideRef.current;
    const viewerEl = viewerScrollRef.current;
    const visibleViewerPages = new Set(); // pages currently intersecting in the viewer

    const flushViewerQueue = () => {
      while (viewerLifoStack.current.length > 0) {
        const page = viewerLifoStack.current.pop();
        if (viewerLoadedSet.current.has(page) || viewerLoadingSet.current.has(page)) continue;
        viewerLoadingSet.current.add(page);
        rasterPages.get(RASTER_DOC_ID, page, VIEWER_RES)
          .then(blobUrl => {
            if (cancelledRef.current) { URL.revokeObjectURL(blobUrl); return; }
            blobUrlsRef.current.push(blobUrl);
            viewerLoadingSet.current.delete(page);
            viewerLoadedSet.current.add(page);
            // Do NOT unobserve — viewer cards must stay observed for strip sync tracking.
            setViewerImages(prev => {
              const next = [...prev];
              next[page - 1] = blobUrl;
              return next;
            });
          })
          .catch(() => { viewerLoadingSet.current.delete(page); });
      }
    };

    const resetViewerDebounce = () => {
      if (viewerDebounce.current) clearTimeout(viewerDebounce.current);
      viewerDebounce.current = setTimeout(flushViewerQueue, IDLE_DELAY_MS);
    };

    const obs = new IntersectionObserver((entries) => {
      let queued = false;

      entries.forEach(entry => {
        const page = parseInt(entry.target.dataset.page, 10);

        if (entry.isIntersecting) {
          visibleViewerPages.add(page);

          // Medium-res lazy-load queue
          if (
            !viewerLoadedSet.current.has(page) &&
            !viewerLoadingSet.current.has(page) &&
            !viewerLifoStack.current.includes(page)
          ) {
            viewerLifoStack.current.push(page);
            queued = true;
          }

          // Reading dwell timer — upgrade to high-res after READING_DWELL_MS
          if (!hiResLoadedSet.current.has(page) && !hiResLoadingSet.current.has(page)) {
            if (!readingTimers.current.has(page)) {
              readingTimers.current.set(page, setTimeout(() => {
                readingTimers.current.delete(page);
                if (cancelledRef.current) return;
                if (hiResLoadedSet.current.has(page) || hiResLoadingSet.current.has(page)) return;
                hiResLoadingSet.current.add(page);
                rasterPages.get(RASTER_DOC_ID, page, HIRES_RES)
                  .then(blobUrl => {
                    if (cancelledRef.current) { URL.revokeObjectURL(blobUrl); return; }
                    blobUrlsRef.current.push(blobUrl);
                    hiResLoadingSet.current.delete(page);
                    hiResLoadedSet.current.add(page);
                    setViewerImages(prev => {
                      const next = [...prev];
                      next[page - 1] = blobUrl;
                      return next;
                    });
                  })
                  .catch(() => { hiResLoadingSet.current.delete(page); });
              }, READING_DWELL_MS));
            }
          }
        } else {
          visibleViewerPages.delete(page);

          // Cancel the high-res upgrade timer — user scrolled away before dwelling
          if (readingTimers.current.has(page)) {
            clearTimeout(readingTimers.current.get(page));
            readingTimers.current.delete(page);
          }

          // Remove from medium-res queue if the page scrolled away before the timer fired
          if (!viewerLoadingSet.current.has(page)) {
            const idx = viewerLifoStack.current.indexOf(page);
            if (idx !== -1) viewerLifoStack.current.splice(idx, 1);
          }
        }
      });

      // Strip sync — scroll the strip to the topmost visible viewer page.
      // Skipped when sync is disabled (user on strip) or suppressed (programmatic scroll).
      if (syncEnabled.current && !suppressSync.current && visibleViewerPages.size > 0) {
        const topPage = Math.min(...visibleViewerPages);
        const stripEl = stripSlotRefs.current[topPage - 1];
        if (stripEl) {
          // block: 'nearest' avoids scrolling the strip when the slot is already visible
          stripEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      if (queued) resetViewerDebounce();
    }, { root: viewerEl, threshold: 0 });

    viewerObserver.current = obs;

    pageRefs.current.forEach((el, i) => {
      const page = i + 1;
      if (el) obs.observe(el);
    });

    // User touches the strip → pause sync so manual strip navigation is uninterrupted
    const onStripPointerDown = () => { syncEnabled.current = false; };
    // User clicks in the viewer → resume sync (always genuine user intent)
    const onViewerResume = () => { syncEnabled.current = true; };
    // Viewer scroll → resume sync only if not a programmatic scroll (suppressSync guard)
    // and always reset the lazy-load debounce regardless.
    const onViewerScroll = () => {
      if (!suppressSync.current) syncEnabled.current = true;
      resetViewerDebounce();
    };
    window.addEventListener('keydown', resetViewerDebounce);

    aside?.addEventListener('pointerdown', onStripPointerDown);
    viewerEl?.addEventListener('scroll',   onViewerScroll);
    viewerEl?.addEventListener('click',    onViewerResume);

    return () => {
      obs.disconnect();
      aside?.removeEventListener('pointerdown', onStripPointerDown);
      viewerEl?.removeEventListener('scroll',   onViewerScroll);
      viewerEl?.removeEventListener('click',    onViewerResume);
      window.removeEventListener('keydown', resetViewerDebounce);
      if (viewerDebounce.current) clearTimeout(viewerDebounce.current);
      readingTimers.current.forEach(id => clearTimeout(id));
      readingTimers.current.clear();
    };
  }, [pageCount]);

  const pageWidth  = Math.round(BASE_PAGE_WIDTH * zoom);
  const pageHeight = Math.round(1123 * zoom);
  const pages      = pageCount ? Array.from({ length: pageCount }, (_, i) => i + 1) : [];

  // ── View / edit mode ─────────────────────────────────────────────────────
  const [isViewMode, setIsViewMode] = useState(false);

  // ── Link types (for badge colors in view mode) ────────────────────────────
  const [linkTypesList, setLinkTypesList] = useState([]);

  useEffect(() => {
    linkTypesApi.list()
      .then(data => {
        const list = Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data : [];
        setLinkTypesList(list);
      })
      .catch(() => {});
  }, []);

  // ── Annotations: { [pageIndex]: [{ id, x, y, w, h }] } ──────────────────
  const [annotations,      setAnnotations]      = useState({});
  const [selectedAnnId,    setSelectedAnnId]    = useState(null);
  // Ghost rect shown while the user is shift-dragging to draw a new annotation.
  // { pageIndex, x, y, w, h } in pixels relative to the page, or null.
  const [drawingRect,      setDrawingRect]      = useState(null);

  // spotId → linkTypeId — kept in sync with the VrlToolbar form so viewMode
  // badges reflect the currently selected link type even before saving.
  const [spotLinkTypes, setSpotLinkTypes] = useState({});
  // initialLinkData seeds VrlToolbar's per-spot form store and linkDocumentIds
  // on mount so the link panel shows pre-saved values for existing annotations.
  const [initialLinkData,  setInitialLinkData]  = useState([]);

  // Load existing document links and reconstruct annotation rectangles exactly
  // as if the user had shift-clicked each one. Each link's position fields
  // (page, page_xpos/ypos/width/height) drive the same setAnnotations setter
  // that handlePageClick uses, so the AnnotationCanvas components mount the
  // same way they would for user-placed annotations.
  // `page` is treated as 0-based to match the loop index in the render.
  // Change to (link.page - 1) if the API returns 1-based page numbers.
  useEffect(() => {
    if (!docId) return;
    documentLinksApi.list(docId)
      .then(links => {
        if (!Array.isArray(links) || !links.length) return;
        const newLinkData = [];
        links.forEach(link => {
          const spotId    = crypto.randomUUID();
          const pageIndex = link.page;
          // Same functional-update pattern as handlePageClick so the canvas mounts.
          setAnnotations(prev => ({
            ...prev,
            [pageIndex]: [
              ...(prev[pageIndex] ?? []),
              { id: spotId, x: link.page_xpos, y: link.page_ypos, w: link.page_width, h: link.page_height },
            ],
          }));
          newLinkData.push({
            spotId,
            linkDocumentId: link.id,
            formState: {
              linkTypeId:         link.link_type_id                    ?? '',
              linkSide:           link.link_side === 'A'               ? 'active'    : 'passive',
              linkGender:         link.target_document_gender === 'M'  ? 'masculine' : 'feminine',
              articleToggle:      link.specific_article                ?? false,
              articleText:        link.target_article_text             ?? '',
              articleAnchor:      link.target_article_anchor           ?? '',
              linkText:           link.link_text                       ?? '',
              // Non-empty saved text is treated as user-edited so it displays as-is.
              linkTextUserEdited: !!link.link_text,
              selectedDocId:      link.target_document_id              ?? null,
              // selectedDocName is not in this response; computed link text falls
              // back to the saved link_text when selectedDocName is null.
              selectedDocName:    null,
            },
          });
        });
        setInitialLinkData(newLinkData);

        // Seed the spotId → linkTypeId map so viewMode badges are ready immediately.
        const types = {};
        newLinkData.forEach(({ spotId, formState: fs }) => {
          if (fs?.linkTypeId) types[spotId] = fs.linkTypeId;
        });
        if (Object.keys(types).length) setSpotLinkTypes(types);
      })
      .catch(err => console.error('Failed to load document links:', err));
  }, [docId]);

  // Deselects all annotations. Also wired to Escape key; call programmatically when needed.
  const deselectAll = useCallback(() => setSelectedAnnId(null), [setSelectedAnnId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') deselectAll(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deselectAll]);

  // ── Spots navigator ───────────────────────────────────────────────────────
  // Flatten all annotations across pages into a single array sorted by
  // page index → y position → x position, matching the reading order.
  const sortedSpots = useMemo(() =>
    Object.entries(annotations)
      .flatMap(([pageIdx, anns]) =>
        anns.map(ann => ({ ...ann, pageIndex: parseInt(pageIdx, 10) }))
      )
      .sort((a, b) => a.pageIndex - b.pageIndex || a.y - b.y || a.x - b.x),
  [annotations]);

  // Index of the currently selected annotation within sortedSpots (-1 = none).
  const currentSpotIndex = useMemo(
    () => sortedSpots.findIndex(s => s.id === selectedAnnId),
    [sortedSpots, selectedAnnId]
  );

  const handleNavigate = useCallback((index) => {
    const spot = sortedSpots[index];
    if (!spot) return;
    setSelectedAnnId(spot.id);
    pageRefs.current[spot.pageIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [sortedSpots]);

  const handleSpotLinkTypeChange = useCallback((spotId, linkTypeId) => {
    setSpotLinkTypes(prev => ({ ...prev, [spotId]: linkTypeId }));
  }, []);

  const handlePageMouseDown = useCallback((e, pageIndex) => {
    if (isViewMode) return;
    if (!e.shiftKey) return;
    e.preventDefault();

    const pageRect = e.currentTarget.getBoundingClientRect();
    const startX   = e.clientX - pageRect.left;
    const startY   = e.clientY - pageRect.top;

    setDrawingRect({ pageIndex, x: startX, y: startY, w: 0, h: 0 });

    const onMove = (ev) => {
      const curX = ev.clientX - pageRect.left;
      const curY = ev.clientY - pageRect.top;
      setDrawingRect({
        pageIndex,
        x: Math.max(0, Math.min(startX, curX)),
        y: Math.max(0, Math.min(startY, curY)),
        w: Math.abs(curX - startX),
        h: Math.abs(curY - startY),
      });
    };

    const onUp = (ev) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      setDrawingRect(null);

      const curX = ev.clientX - pageRect.left;
      const curY = ev.clientY - pageRect.top;
      const px   = Math.max(0, Math.min(startX, curX));
      const py   = Math.max(0, Math.min(startY, curY));
      const pw   = Math.abs(curX - startX);
      const ph   = Math.abs(curY - startY);

      const id = crypto.randomUUID();
      let x, y, w, h;
      if (pw >= 10 && ph >= 10) {
        // Use the custom drag rectangle.
        x = px * 100 / pageWidth;
        y = py * 100 / pageHeight;
        w = pw * 100 / pageWidth;
        h = ph * 100 / pageHeight;
      } else {
        // Too small — fall back to default size centred on the click point.
        x = Math.max(0, (startX - 15) * 100 / pageWidth);
        y = Math.max(0, (startY - 10) * 100 / pageHeight);
        w = 30 * 100 / pageWidth;
        h = 20 * 100 / pageHeight;
      }

      setAnnotations(prev => ({
        ...prev,
        [pageIndex]: [...(prev[pageIndex] ?? []), { id, x, y, w, h }],
      }));
      setSelectedAnnId(id);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }, [isViewMode, pageWidth, pageHeight, setAnnotations, setSelectedAnnId]);

  // Updates the stored percentage values for one annotation after a drag/resize.
  const handleAnnotationChange = useCallback((pageIndex, id, pct) => {
    setAnnotations(prev => ({
      ...prev,
      [pageIndex]: (prev[pageIndex] ?? []).map(ann =>
        ann.id === id ? { ...ann, ...pct } : ann
      ),
    }));
  }, []);

  return (
    <>
      {/* ── Strip ── thumbnail sidebar */}
      <aside ref={asideRef} className="w-[130px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
        {pageCount === null ? (
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

        {/* Toolbar */}
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

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <button
            onClick={() => setIsViewMode(v => !v)}
            title={isViewMode ? 'Switch to edit mode' : 'Switch to view mode'}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors
              ${isViewMode
                ? 'bg-[#1e2d4a] text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-[#1e2d4a]'
              }`}
          >
            {isViewMode ? <I.linkViewMode size={18} /> : <I.linkEditMode size={18} />}
          </button>
        </div>

        {/* Scrollable page list — viewer scroll container, also the IntersectionObserver root */}
        <div ref={viewerScrollRef} className="flex-1 overflow-y-auto py-8">
          <div className="flex flex-col items-center gap-8">
            {pages.map((page, i) => (
              <div
                key={page}
                ref={el => { pageRefs.current[i] = el; }}
                data-page={page}
                className="flex flex-col items-center gap-2"
              >
                {/* Page wrapper — relative so annotations are positioned inside it.
                    Shift+drag draws a custom rectangle; Shift+click uses a default size. */}
                <div
                  className="relative"
                  style={{ width: pageWidth }}
                  onMouseDown={e => handlePageMouseDown(e, i)}
                >
                  <div className="bg-white shadow-2xl overflow-hidden transition-all duration-200">
                    {viewerImages[i] ? (
                      // High-res image loaded — fill the card width, natural height
                      <img
                        src={viewerImages[i]}
                        alt={`Page ${page}`}
                        className="w-full block"
                        draggable={false}
                      />
                    ) : (
                      // Spinner while medium-res image is loading
                      <div
                        className="flex items-center justify-center"
                        style={{ minHeight: pageHeight }}
                      >
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-[#1e2d4a] animate-spin" />
                          <span className="relative text-[12px] font-semibold text-slate-400">{page}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Annotation canvases — absolutely positioned over the page */}
                  {(annotations[i] ?? []).map(ann => {
                    const linkTypeId = spotLinkTypes[ann.id];
                    const lt         = linkTypeId ? linkTypesList.find(l => String(l.id) === String(linkTypeId)) : null;
                    const badgeColor  = lt?.color ? `#${lt.color}` : '#dc2626';
                    const badgeLetter = lt ? (lt.name || lt.label || '').charAt(0).toUpperCase() : '';
                    return (
                      <AnnotationCanvas
                        key={ann.id}
                        x={ann.x}
                        y={ann.y}
                        w={ann.w}
                        h={ann.h}
                        pageWidth={pageWidth}
                        pageHeight={pageHeight}
                        isSelected={selectedAnnId === ann.id}
                        onSelect={() => setSelectedAnnId(ann.id)}
                        onChange={pct => handleAnnotationChange(i, ann.id, pct)}
                        viewMode={isViewMode}
                        badgeColor={badgeColor}
                        badgeLetter={badgeLetter}
                      />
                    );
                  })}

                  {/* Ghost rectangle shown while the user is shift-dragging */}
                  {drawingRect?.pageIndex === i && drawingRect.w > 0 && drawingRect.h > 0 && (
                    <div
                      style={{
                        position:      'absolute',
                        left:          drawingRect.x,
                        top:           drawingRect.y,
                        width:         drawingRect.w,
                        height:        drawingRect.h,
                        border:        '1px dashed #1a56cc',
                        background:    'rgba(255, 160, 50, 0.12)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </div>
                <span className="text-[11px] text-slate-400">{page} / {pageCount}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      <VrlToolbar
        spots={sortedSpots}
        currentSpotIndex={currentSpotIndex}
        onNavigate={handleNavigate}
        sourceDocumentId={docId ?? null}
        initialLinkData={initialLinkData}
        onSpotLinkTypeChange={handleSpotLinkTypeChange}
      />
    </>
  );
}
