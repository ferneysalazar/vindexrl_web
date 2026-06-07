(function () {
  function initVrlToolbar() {
    console.log('📦 Initializing Floating Annotation Toolbar...');

    const style = document.createElement('style');
    style.textContent = `
    .vrl-floating-toolbar {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      padding: 4px 8px 4px 4px;
      gap: 6px;
      user-select: none;
      transition: box-shadow 0.2s ease, background-color 0.2s ease;
    }
    .vrl-floating-toolbar:hover {
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 12px 38px rgba(0, 0, 0, 0.1);
    }
    .vrl-toolbar-drag-handle {
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 32px;
      color: rgba(0, 0, 0, 0.3);
    }
    .vrl-toolbar-drag-handle:active { cursor: grabbing; }
    .vrl-toolbar-btn {
      background: transparent;
      border: none;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #4a4a4a;
      transition: all 0.15s ease;
      position: relative;
    }
    .vrl-toolbar-btn:hover { background: rgba(0, 0, 0, 0.05); color: #1a1a1a; }
    .vrl-toolbar-btn:active { background: rgba(0, 0, 0, 0.1); transform: scale(0.96); }
    .vrl-toolbar-btn::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: -32px;
      left: 50%;
      transform: translateX(-50%) scale(0.9);
      background: #1e1e1e;
      color: #ffffff;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: all 0.15s ease;
    }
    .vrl-toolbar-btn:hover::after { opacity: 1; transform: translateX(-50%) scale(1); }
    .vrl-toolbar-sep {
      width: 1px;
      height: 20px;
      background: rgba(0,0,0,0.1);
      margin: 0 2px;
      flex-shrink: 0;
    }
    `;
    document.head.appendChild(style);

    const toolbar = document.createElement('div');
    toolbar.className = 'vrl-floating-toolbar';

    const dragHandle = document.createElement('div');
    dragHandle.className = 'vrl-toolbar-drag-handle';
    dragHandle.innerHTML = `
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
      <circle cx="2" cy="2" r="1.5" />
      <circle cx="2" cy="8" r="1.5" />
      <circle cx="2" cy="14" r="1.5" />
      <circle cx="8" cy="2" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="14" r="1.5" />
    </svg>
    `;
    toolbar.appendChild(dragHandle);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'vrl-toolbar-btn';
    deleteButton.setAttribute('data-tooltip', 'Delete spots in selection');
    deleteButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 20H4" />
      <path d="M20 8l-6 6H6v-4l6-6z" />
    </svg>
    `;
    toolbar.appendChild(deleteButton);

    const sep = document.createElement('div');
    sep.className = 'vrl-toolbar-sep';
    toolbar.appendChild(sep);

    const saveButton = document.createElement('button');
    saveButton.className = 'vrl-toolbar-btn';
    saveButton.setAttribute('data-tooltip', 'Save HTML');
    saveButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
    `;
    toolbar.appendChild(saveButton);

    document.body.appendChild(toolbar);

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    dragHandle.addEventListener('mousedown', function (e) {
      isDragging = true;
      const rect = toolbar.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      toolbar.style.right = 'auto';
      toolbar.style.bottom = 'auto';
      toolbar.style.left = `${initialLeft}px`;
      toolbar.style.top = `${initialTop}px`;
      document.addEventListener('mousemove', dragMove);
      document.addEventListener('mouseup', dragEnd);
      e.preventDefault();
    });

    function dragMove(e) {
      if (!isDragging) return;
      let newLeft = initialLeft + (e.clientX - startX);
      let newTop = initialTop + (e.clientY - startY);
      newLeft = Math.max(10, Math.min(newLeft, window.innerWidth - toolbar.offsetWidth - 10));
      newTop = Math.max(10, Math.min(newTop, window.innerHeight - toolbar.offsetHeight - 10));
      toolbar.style.left = `${newLeft}px`;
      toolbar.style.top = `${newTop}px`;
    }

    function dragEnd() {
      isDragging = false;
      document.removeEventListener('mousemove', dragMove);
      document.removeEventListener('mouseup', dragEnd);
    }

    deleteButton.addEventListener('mousedown', function (e) {
      e.preventDefault();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        console.log("Selection is empty. Highlight text to sweep tags.");
        return;
      }
      const cloneFragment = range.cloneContents();
      const targetsInClone = cloneFragment.querySelectorAll('.vrl-spot, note-wrapper');
      if (targetsInClone.length > 0) {
        let container = range.commonAncestorContainer;
        if (container.nodeType === Node.TEXT_NODE) container = container.parentElement;
        const allLiveSpots = container.querySelectorAll('.vrl-spot, note-wrapper');
        let deletedCount = 0;
        allLiveSpots.forEach(liveSpot => {
          if (selection.containsNode(liveSpot, true)) {
            liveSpot.remove();
            deletedCount++;
          }
        });
        console.log(`🧹 Cleaned ${deletedCount} custom tag wrappers.`);
        container.normalize();
      } else {
        console.log("No targets detected inside the selected scope.");
      }
    });

    saveButton.addEventListener('click', function () {
      const clone = document.documentElement.cloneNode(true);

      ['vindexrlScript1', 'vindexrl-toolbar'].forEach(id => {
        const el = clone.querySelector('#' + id);
        if (el) el.remove();
      });
      const tb = clone.querySelector('.vrl-floating-toolbar');
      if (tb) tb.remove();

      const content = '<!DOCTYPE html>\n' + clone.outerHTML;

      if (window.opener) {
        window.opener.postMessage({ type: 'vrl-save', content }, window.opener.location.origin);
        saveButton.style.color = '#28a745';
        setTimeout(() => saveButton.style.color = '', 1500);
      } else {
        console.error('No opener window found — open this page from the document editor.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVrlToolbar);
  } else {
    initVrlToolbar();
  }
})();
