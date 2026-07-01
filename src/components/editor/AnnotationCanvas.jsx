import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const HANDLE_SIZE = 12; // px — square handle dimensions
const MIN_SIZE    = 10; // px — minimum rectangle width / height

// ── Resize handle ─────────────────────────────────────────────────────────────

function Handle({ cursor, style, onMouseDown }) {
  const half = HANDLE_SIZE / 2;
  return (
    <div
      style={{
        position: 'absolute',
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        background: '#1a56cc',
        border: '1.5px solid #fff',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
        cursor,
        pointerEvents: 'all',
        ...style,
        marginLeft: -half,
        marginTop: -half,
      }}
      onMouseDown={onMouseDown}
      onClick={e => e.stopPropagation()}
    />
  );
}

// ── Coordinate helpers ────────────────────────────────────────────────────────

function pctToPx({ x, y, w, h }, pageWidth, pageHeight) {
  return {
    x: x * pageWidth  / 100,
    y: y * pageHeight / 100,
    w: w * pageWidth  / 100,
    h: h * pageHeight / 100,
  };
}

function pxToPct({ x, y, w, h }, pageWidth, pageHeight) {
  return {
    x: x * 100 / pageWidth,
    y: y * 100 / pageHeight,
    w: w * 100 / pageWidth,
    h: h * 100 / pageHeight,
  };
}

// ── Link text renderer ────────────────────────────────────────────────────────

/**
 * Renders a link-text string into React nodes, turning every {curly brace}
 * segment into a clickable <a> element — the same convention used by the
 * vrl-toolbar.js annotation engine in the HTML document viewer.
 *
 * Pattern:  "Deroga {Decreto 123 de 2020}" with selectedDocId "abc-123"
 * Output:   "Deroga " + <a href="viewDocument?docId=abc-123">Decreto 123 de 2020</a>
 *
 * When selectedDocId is null the curly-brace content renders as plain text.
 * When text is empty / null the function returns null (renders nothing).
 */
function renderLinkText(text, selectedDocId) {
  if (!text) return null;
  // Split on {…} groups, keeping the delimiters so odd-indexed parts are the
  // curly-brace segments and even-indexed parts are the plain text in between.
  const parts = text.split(/(\{[^}]+\})/);
  return parts.map((part, i) => {
    const match = part.match(/^\{([^}]+)\}$/);
    if (!match) return part || null; // plain text segment (may be empty)
    const inner = match[1]; // text inside the curly braces
    return selectedDocId
      ? <a key={i} href={`viewDocument?docId=${selectedDocId}`} target="_blank" rel="noreferrer"
           style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}>{inner}</a>
      : <span key={i} style={{ color: '#2563eb', fontStyle: 'italic' }}>{inner}</span>;
  });
}

// ── AnnotationCanvas ──────────────────────────────────────────────────────────

/**
 * AnnotationCanvas — a single draggable / resizable annotation rectangle
 * rendered as an absolutely-positioned overlay on top of a PDF page image.
 *
 * ── Coordinate system ────────────────────────────────────────────────────────
 *   All public props (x, y, w, h) are expressed as PERCENTAGES of the rendered
 *   page dimensions so annotations stay in the correct position regardless of
 *   the current zoom level.  Internally the component converts to pixels for
 *   layout and canvas drawing, then converts back to percentages before
 *   reporting changes to the parent via `onChange`.
 *
 * ── Modes ────────────────────────────────────────────────────────────────────
 *   editMode (viewMode = false — default):
 *     • A red 12 × 12 px square in the top-left corner acts as a "grab handle".
 *       Pressing it selects the annotation AND starts a move-drag.
 *     • Four blue resize handles appear at the mid-points of each edge when the
 *       annotation is selected (isSelected = true).
 *     • All handles have pointerEvents: 'all' so they capture mouse events even
 *       though the parent wrapper has pointerEvents: 'none'.
 *
 *   viewMode (viewMode = true):
 *     • All interactive handles are hidden — the annotation is read-only.
 *     • A 16 × 16 px colored badge replaces the red handle.  The badge color
 *       comes from the link type assigned to this spot (badgeColor prop), and
 *       the badge shows the first letter of the link type name (badgeLetter).
 *     • Falls back to red / empty when no link type has been assigned.
 *
 * ── Props ────────────────────────────────────────────────────────────────────
 *   x, y, w, h     — position / size as percentages of pageWidth / pageHeight
 *   pageWidth      — current rendered page width  in px (changes with zoom)
 *   pageHeight     — current rendered page height in px (changes with zoom)
 *   isSelected     — show resize handles (editMode only)
 *   onSelect       — called when the red move handle is pressed (editMode only)
 *   onChange       — called on drag/resize end with { x, y, w, h } percentages
 *   viewMode       — true = read-only view with colored type badge
 *   badgeColor     — CSS color string for the viewMode badge (e.g. '#0D98BA')
 *   badgeLetter    — single letter shown inside the viewMode badge
 *
 * ── Drag / resize mechanics ──────────────────────────────────────────────────
 *   When at rest, `pos` is derived directly from percentage props × page
 *   dimensions, so it auto-corrects on zoom changes — no sync effect needed.
 *   During a drag, `dragPos` (pixels) overrides the derived value to give
 *   smooth pointer-following movement; it is cleared on mouseup after
 *   `onChange` reports the final percentages back to the parent.
 */
export default function AnnotationCanvas({
  x: initX, y: initY, w: initW, h: initH,
  pageWidth, pageHeight,
  isSelected, onSelect, onChange,
  // viewMode: when true the annotation is display-only — no handles, no drag.
  viewMode    = false,
  // badgeColor: hex CSS color for the viewMode top-left badge (with leading #).
  badgeColor  = '#dc2626',
  // badgeLetter: first letter of the link type name displayed inside the badge.
  badgeLetter = '',
  // displayLinkText: the computed or saved link text for this spot.
  // May contain {curly brace} segments that become <a> elements in viewMode.
  displayLinkText = '',
  // selectedDocId: UUID of the target document; used to build the <a> href.
  selectedDocId   = null,
  // scrollContainerRef: ref to the viewer's scrollable div. Used to update
  // the portal panel position as the user scrolls through the document.
  scrollContainerRef = null,
  // locked: true when another spot has unsaved link changes in progress.
  // Disables the move handle so this (non-active) rectangle can't be
  // selected or dragged until the dirty link is saved/cancelled.
  locked = false,
}) {
  const canvasRef  = useRef(null);
  const wrapperRef = useRef(null); // ref on the outer positioned div
  const dragRef    = useRef(null);
  const lastPosRef = useRef(null); // tracks final pixel pos during drag

  // Viewport-relative position + width for the portal info panel.
  // null = panel is not visible.  Updated on open, scroll, and resize.
  const [panelRect, setPanelRect] = useState(null);

  // `dragPos` is only non-null while a drag is in progress.
  const [dragPos, setDragPos] = useState(null);

  // When at rest use prop-derived pixels (zoom-immune); when dragging use the
  // live pixel override so the rectangle follows the pointer smoothly.
  const pos = dragPos ?? pctToPx({ x: initX, y: initY, w: initW, h: initH }, pageWidth, pageHeight);

  // Keep a ref in sync so drag closures always read the latest pixel pos.
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; });

  // ── Portal panel position ─────────────────────────────────────────────────
  // The info panel is rendered via createPortal to document.body so it escapes
  // the viewer's overflow:auto clipping and all nested stacking contexts.
  // We use position:fixed with viewport coordinates derived from wrapperRef.
  //
  // computePanelRect measures the wrapper's viewport rect and returns the
  // fixed-position geometry for the panel:
  //   • right edge  = annotation left edge (panel extends leftward)
  //   • top         = annotation top + 8px (flush with badge bottom)
  //   • width       = min(350, annotation.left - 8)  — never overflows left
  const computePanelRect = useCallback(() => {
    if (!wrapperRef.current) return null;
    const r     = wrapperRef.current.getBoundingClientRect();
    const width = Math.min(350, Math.max(80, Math.floor(r.left) - 8));
    return { top: r.top + 8, left: r.left - width, width };
  }, []);

  // Set position when the panel opens; clear it when it closes.
  useLayoutEffect(() => {
    if (!viewMode || !isSelected) { setPanelRect(null); return; }
    setPanelRect(computePanelRect());
  }, [viewMode, isSelected, computePanelRect]);

  // Keep position in sync while the viewer scrolls or the window resizes.
  useEffect(() => {
    if (!viewMode || !isSelected) return;
    const update = () => setPanelRect(computePanelRect());
    const scrollEl = scrollContainerRef?.current;
    scrollEl?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      scrollEl?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [viewMode, isSelected, scrollContainerRef, computePanelRect]);

  // ── Draw dashed rectangle whenever dimensions change ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = pos;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = viewMode ? 'rgba(255, 160, 50, 0.06)' : 'rgba(255, 160, 50, 0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#1a56cc';
    ctx.lineWidth   = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }, [pos.w, pos.h, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle drag ───────────────────────────────────────────────────────────
  const startDrag = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();

    // Capture pixel state at drag-start from the derived pos (not posRef, which
    // may lag one render behind when this is called immediately after mount).
    const initPx = pctToPx({ x: initX, y: initY, w: initW, h: initH }, pageWidth, pageHeight);
    dragRef.current = {
      direction,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: initPx.x, startY: initPx.y,
      startW: initPx.w, startH: initPx.h,
    };
    lastPosRef.current = null;
    setDragPos(initPx); // enter drag mode

    const onMove = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = ev.clientX - d.startClientX;
      const dy = ev.clientY - d.startClientY;
      let { startX: nx, startY: ny, startW: nw, startH: nh } = d;

      if (d.direction === 'move') {
        nx = d.startX + dx;
        ny = d.startY + dy;
      } else if (d.direction === 'top') {
        const clamp = Math.min(dy, nh - MIN_SIZE);
        ny = d.startY + clamp;
        nh = d.startH - clamp;
      } else if (d.direction === 'bottom') {
        nh = Math.max(MIN_SIZE, d.startH + dy);
      } else if (d.direction === 'left') {
        const clamp = Math.min(dx, nw - MIN_SIZE);
        nx = d.startX + clamp;
        nw = d.startW - clamp;
      } else if (d.direction === 'right') {
        nw = Math.max(MIN_SIZE, d.startW + dx);
      }

      const newPos = { x: nx, y: ny, w: nw, h: nh };
      lastPosRef.current = newPos;
      setDragPos(newPos);
    };

    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      // Report final percentages to parent, then exit drag mode.
      if (lastPosRef.current) {
        onChange?.(pxToPct(lastPosRef.current, pageWidth, pageHeight));
        lastPosRef.current = null;
      }
      setDragPos(null);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }, [initX, initY, initW, initH, pageWidth, pageHeight, onChange]);

  // ── Render ────────────────────────────────────────────────────────────────
  const { x, y, w, h } = pos;

  return (
    <div
      ref={wrapperRef}
      style={{
        position:      'absolute',
        left:          x,
        top:           y,
        width:         w,
        height:        h,
        pointerEvents: 'none',
        // Raise the selected annotation above its siblings so the info panel
        // (which overflows the rectangle bounds leftward) is never obscured.
        zIndex: (viewMode && isSelected) ? 100 : 1,
      }}
    >
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        style={{ display: 'block' }}
      />

      {viewMode ? (
        /**
         * VIEW MODE
         *
         * Three layers, all inside the pointerEvents:'none' wrapper:
         *
         *  1. Clickable overlay — an invisible div covering the full rectangle
         *     area with pointerEvents:'all' so the user can click anywhere on
         *     the annotation to select it (mirrors the red handle in edit mode).
         *
         *  2. Colored badge — 16 × 16 px square at the top-left corner
         *     showing the link type color and initial letter.  Rendered above
         *     the overlay (later in DOM) so it is always visible.
         *
         *  3. Info panel — shown only when the annotation is selected.
         *     Anchored right:100% (right edge flush with the rectangle's left
         *     border) and top:8px (just below the badge's bottom edge, since
         *     the badge center is at y=0, so badge bottom = +8 px).
         *     Width is clamped by useLayoutEffect so it never overflows the
         *     viewport's left edge.  The 6 px left border uses the link type
         *     color.  Link text is rendered with {curly} → <a> substitution.
         */
        <>
          {/* 1. Full-rectangle click target */}
          <div
            style={{
              position:      'absolute',
              inset:         0,
              pointerEvents: 'all',
              cursor:        'pointer',
            }}
            onClick={() => onSelect?.()}
          />

          {/* 2. Link-type badge — top-left corner, centered on the corner point.
               The badge overflows the wrapper bounds (marginLeft/Top: -8) so the
               clickable overlay (inset:0) doesn't cover it. Adding pointerEvents
               and onClick here ensures the full 16×16 badge area is clickable. */}
          <div
            style={{
              position:       'absolute',
              left:           0,
              top:            0,
              width:          16,
              height:         16,
              marginLeft:     -8,
              marginTop:      -8,
              background:     badgeColor,
              borderRadius:   2,
              border:         '1.5px solid #fff',
              boxShadow:      '0 1px 3px rgba(0,0,0,0.35)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          '#fff',
              fontSize:       9,
              fontWeight:     700,
              lineHeight:     1,
              userSelect:     'none',
              pointerEvents:  'all',
              cursor:         'pointer',
            }}
            onClick={() => onSelect?.()}
          >
            {badgeLetter}
          </div>

          {/* 3. Info panel — rendered via portal to document.body so it escapes
               the viewer's overflow:auto clipping and any stacking context.
               Uses position:fixed with viewport coordinates from panelRect. */}
          {isSelected && panelRect && createPortal(
            <div
              style={{
                position:      'fixed',
                top:           panelRect.top,
                left:          panelRect.left,
                width:         panelRect.width,
                height:        150,
                zIndex:        9999,
                background:    'rgba(255,255,255,0.6)',
                borderLeft:    `6px solid ${badgeColor}`,
                overflow:      'auto',
                padding:       '8px 10px',
                boxSizing:     'border-box',
                fontSize:      13,
                lineHeight:    1.55,
                color:         '#1e2d4a',
                pointerEvents: 'all',
                boxShadow:     '0 2px 8px rgba(0,0,0,0.12)',
              }}
            >
              {renderLinkText(displayLinkText, selectedDocId)}
            </div>,
            document.body
          )}
        </>
      ) : (
        /**
         * EDIT MODE — interactive move + resize handles
         *
         * The red handle (top-left) is always rendered so the user can always
         * grab and move the annotation even when it is not "selected".
         * Pressing it fires onSelect() to make this annotation active, then
         * immediately starts a move-drag so the press feels instant.
         *
         * The four blue resize handles only appear when isSelected is true.
         * Each is placed at the mid-point of one edge and starts a directional
         * drag via startDrag(e, direction).
         *
         * All handles set pointerEvents: 'all' (inside the Handle component)
         * to capture mouse events despite the parent wrapper's pointerEvents: 'none'.
         * onClick propagation is stopped on each handle so a handle click does
         * not bubble up to the page wrapper and accidentally trigger handlePageMouseDown.
         */
        <>
          {/* Red move handle — always visible; pressing it selects and moves.
              Disabled while locked (a different spot has unsaved changes). */}
          <Handle
            cursor={locked ? 'not-allowed' : 'move'}
            style={{ left: 0, top: 0, background: '#dc2626', opacity: locked ? 0.4 : 1 }}
            onMouseDown={e => { if (locked) return; onSelect?.(); startDrag(e, 'move'); }}
          />

          {/* Resize handles — mid-point of each edge, visible only when selected */}
          {isSelected && (
            <>
              <Handle
                cursor="n-resize"
                style={{ left: '50%', top: 0 }}
                onMouseDown={e => startDrag(e, 'top')}
              />
              <Handle
                cursor="s-resize"
                style={{ left: '50%', top: '100%' }}
                onMouseDown={e => startDrag(e, 'bottom')}
              />
              <Handle
                cursor="w-resize"
                style={{ left: 0, top: '50%' }}
                onMouseDown={e => startDrag(e, 'left')}
              />
              <Handle
                cursor="e-resize"
                style={{ left: '100%', top: '50%' }}
                onMouseDown={e => startDrag(e, 'right')}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
