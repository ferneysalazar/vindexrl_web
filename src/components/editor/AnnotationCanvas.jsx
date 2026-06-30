import { useState, useRef, useEffect, useCallback } from 'react';

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

// ── AnnotationCanvas ──────────────────────────────────────────────────────────

/**
 * Props:
 *   x, y, w, h   — position / size as percentages of pageWidth / pageHeight
 *   pageWidth    — current rendered page width  in px (changes with zoom)
 *   pageHeight   — current rendered page height in px (changes with zoom)
 *   isSelected   — whether resize handles are visible
 *   onSelect     — called when the red handle is pressed
 *   onChange     — called on drag/resize end with { x, y, w, h } in percentages
 *
 * Position strategy:
 *   When at rest `pos` is derived directly from percentage props × page
 *   dimensions, so it automatically corrects when zoom changes — no sync
 *   effect required. During a drag, `dragPos` (pixels) overrides the
 *   derived value to give smooth movement; it is cleared on mouseup after
 *   `onChange` reports the final percentages back to the parent.
 */
export default function AnnotationCanvas({
  x: initX, y: initY, w: initW, h: initH,
  pageWidth, pageHeight,
  isSelected, onSelect, onChange,
}) {
  const canvasRef  = useRef(null);
  const dragRef    = useRef(null);
  const lastPosRef = useRef(null); // tracks final pixel pos during drag

  // `dragPos` is only non-null while a drag is in progress.
  const [dragPos, setDragPos] = useState(null);

  // When at rest use prop-derived pixels (zoom-immune); when dragging use the
  // live pixel override so the rectangle follows the pointer smoothly.
  const pos = dragPos ?? pctToPx({ x: initX, y: initY, w: initW, h: initH }, pageWidth, pageHeight);

  // Keep a ref in sync so drag closures always read the latest pixel pos.
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; });

  // ── Draw dashed rectangle whenever dimensions change ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = pos;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 160, 50, 0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#1a56cc';
    ctx.lineWidth   = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }, [pos.w, pos.h]); // eslint-disable-line react-hooks/exhaustive-deps

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
      style={{
        position:      'absolute',
        left:          x,
        top:           y,
        width:         w,
        height:        h,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        style={{ display: 'block' }}
      />

      {/* Red move handle — always visible; clicking it selects this annotation */}
      <Handle
        cursor="move"
        style={{ left: 0, top: 0, background: '#dc2626' }}
        onMouseDown={e => { onSelect?.(); startDrag(e, 'move'); }}
      />

      {/* Resize handles — only visible when selected */}
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
    </div>
  );
}
