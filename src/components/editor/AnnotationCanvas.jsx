import { useState, useRef, useEffect, useCallback } from 'react';

const HANDLE_SIZE = 12; // px — square handle dimensions
const MIN_SIZE    = 10; // px — minimum rectangle width and height

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

// ── AnnotationCanvas ──────────────────────────────────────────────────────────

/**
 * Props:
 *   x, y        — initial top-left position (px, relative to page wrapper)
 *   isSelected  — whether this annotation is currently selected
 *   onSelect    — called when the user clicks the red handle to select this annotation
 */
export default function AnnotationCanvas({ x: initX, y: initY, isSelected, onSelect }) {
  const canvasRef = useRef(null);
  const dragRef   = useRef(null);

  const [pos, setPos] = useState({ x: initX, y: initY, w: 30, h: 20 });

  // Keep a ref in sync so drag closures always read the latest position.
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; });

  // ── Draw dashed rectangle whenever dimensions change ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = posRef.current;
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
  }, [pos.w, pos.h]);

  // ── Handle drag ───────────────────────────────────────────────────────────
  const startDrag = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();

    const { x, y, w, h } = posRef.current;
    dragRef.current = {
      direction,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: x, startY: y,
      startW: w, startH: h,
    };

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

      setPos({ x: nx, y: ny, w: nw, h: nh });
    };

    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }, []);

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

      {/* Resize handles — only visible when this annotation is selected */}
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
