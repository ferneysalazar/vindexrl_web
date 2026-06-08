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
      background: rgba(255, 255, 255, 0.40);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      user-select: none;
      transition: box-shadow 0.2s ease, background-color 0.2s ease;
    }
    .vrl-toolbar-main-row {
      display: flex;
      align-items: center;
      padding: 4px 8px 4px 4px;
      gap: 6px;
      width: 100%;
      box-sizing: border-box;
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
      z-index: 1000001;
    }
    .vrl-toolbar-btn:hover::after { opacity: 1; transform: translateX(-50%) scale(1); }
    .vrl-toolbar-sep {
      width: 1px;
      height: 20px;
      background: rgba(0,0,0,0.1);
      margin: 0 2px;
      flex-shrink: 0;
    }
    #vrlLinkPanel {
      display: none;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      margin-top: 6px;
      padding: 10px;
      box-sizing: border-box;
      position: relative;
      color: #333;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      min-width: 420px;
    }
    .vrl-doc-search-label {
      font-size: 11px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 7px;
    }
    .vrl-doc-search-row {
      display: flex;
      gap: 5px;
      align-items: center;
      flex-wrap: wrap;
    }
    .vrl-doc-search-input {
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      padding: 4px 6px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: rgba(255, 255, 255, 0.85);
      color: #333;
      outline: none;
      min-width: 0;
      transition: border-color 0.15s;
    }
    .vrl-doc-search-input:focus { border-color: rgba(0, 100, 255, 0.4); }
    .vrl-doc-search-input.input-type   { width: 62px; }
    .vrl-doc-search-input.input-number { width: 70px; }
    .vrl-doc-search-input.input-year   { width: 52px; }
    .vrl-doc-search-input.input-entity { width: 80px; }
    .vrl-doc-search-btn {
      background: rgba(0, 100, 255, 0.08);
      border: 1px solid rgba(0, 100, 255, 0.22);
      border-radius: 5px;
      padding: 4px 9px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1a56cc;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .vrl-doc-search-btn:hover { background: rgba(0, 100, 255, 0.15); }
    .vrl-doc-search-btn:active { background: rgba(0, 100, 255, 0.22); }
    .vrl-doc-results {
      margin-top: 8px;
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.65);
    }
    .vrl-doc-result-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      padding: 5px 8px;
      font-size: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: background 0.1s;
      overflow: hidden;
    }
    .vrl-doc-result-item:last-child { border-bottom: none; }
    .vrl-doc-result-item:hover { background: rgba(0, 100, 255, 0.06); }
    .vrl-doc-result-item:hover .vrl-doc-result-name { color: #1a56cc; }
    .vrl-doc-result-index {
      flex-shrink: 0;
      min-width: 16px;
      text-align: right;
      font-size: 10px;
      color: #ccc;
      line-height: 16px;
      padding-top: 1px;
      font-family: monospace;
    }
    .vrl-doc-result-body {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    .vrl-doc-result-name {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #333;
      transition: color 0.1s;
    }
    .vrl-doc-result-id {
      display: block;
      font-size: 10px;
      color: #aaa;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }
    .vrl-doc-results-msg {
      padding: 8px;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    `;
    document.head.appendChild(style);

    const toolbar = document.createElement('div');
    toolbar.className = 'vrl-floating-toolbar';

    const mainRow = document.createElement('div');
    mainRow.className = 'vrl-toolbar-main-row';
    toolbar.appendChild(mainRow);

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
    mainRow.appendChild(dragHandle);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'vrl-toolbar-btn';
    deleteButton.setAttribute('data-tooltip', 'Delete spots in selection');
    deleteButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 20H4" />
      <path d="M20 8l-6 6H6v-4l6-6z" />
    </svg>
    `;
    mainRow.appendChild(deleteButton);

    // Replaced SVG markup with absolute path coordinates using direct currentColor fill
    const panelButton = document.createElement('button');
    panelButton.className = 'vrl-toolbar-btn';
    panelButton.setAttribute('data-tooltip', 'Toggle link panel');
    panelButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H11V5h8v14z"/>
    </svg>
    `;
    mainRow.appendChild(panelButton);

    const sep = document.createElement('div');
    sep.className = 'vrl-toolbar-sep';
    mainRow.appendChild(sep);

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
    mainRow.appendChild(saveButton);

    const linkPanel = document.createElement('div');
    linkPanel.id = 'vrlLinkPanel';
    linkPanel.innerHTML = `
      <div class="vrl-doc-search-label">Document Search</div>
      <div class="vrl-doc-search-row">
        <input class="vrl-doc-search-input input-type"   id="vrlSearchType"   type="text" placeholder="Type" />
        <input class="vrl-doc-search-input input-number" id="vrlSearchNumber" type="text" placeholder="Number" />
        <input class="vrl-doc-search-input input-year"   id="vrlSearchYear"   type="text" placeholder="Year" />
        <input class="vrl-doc-search-input input-entity" id="vrlSearchEntity" type="text" placeholder="Entity" />
        <button class="vrl-doc-search-btn" id="vrlSearchDocsBtn">Search Documents</button>
      </div>
      <div class="vrl-doc-results" id="vrlDocResults" style="display:none;"></div>
    `;
    toolbar.appendChild(linkPanel);

    document.body.appendChild(toolbar);

    function searchDocuments(type, number, year, entity) {
      const resultsEl = document.getElementById('vrlDocResults');
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = '<div class="vrl-doc-results-msg">Searching…</div>';

      if (!window.opener) {
        resultsEl.innerHTML = '<div class="vrl-doc-results-msg">No opener window.</div>';
        return;
      }

      window.opener.postMessage(
        { type: 'vrl-search-documents', params: { type, number, year, entity } },
        window.opener.location.origin
      );

      adjustPanelBoundary();
    }

    window.addEventListener('message', function (e) {
      if (e.data?.type !== 'vrl-search-results') return;
      const resultsEl = document.getElementById('vrlDocResults');
      if (!resultsEl) return;
      const docs = e.data.documents || [];
      if (!docs.length) {
        resultsEl.innerHTML = '<div class="vrl-doc-results-msg">No documents found.</div>';
      } else {
        resultsEl.innerHTML = docs.map((doc, i) => {
          const name = doc.documentName || [doc.normTypeName, doc.number, doc.year].filter(Boolean).join(' · ') || String(doc);
          return `<div class="vrl-doc-result-item" data-id="${doc.id}" title="${name}">
            <span class="vrl-doc-result-index">${i + 1}</span>
            <span class="vrl-doc-result-body">
              <span class="vrl-doc-result-name">${name}</span>
              <span class="vrl-doc-result-id">${doc.id}</span>
            </span>
          </div>`;
        }).join('');
      }
      adjustPanelBoundary();
    });

    document.getElementById('vrlSearchDocsBtn').addEventListener('click', function () {
      const type   = document.getElementById('vrlSearchType').value.trim();
      const number = document.getElementById('vrlSearchNumber').value.trim();
      const year   = document.getElementById('vrlSearchYear').value.trim();
      const entity = document.getElementById('vrlSearchEntity').value.trim();
      searchDocuments(type, number, year, entity);
    });

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    function adjustPanelBoundary() {
      if (linkPanel.style.display !== 'block') return;

      linkPanel.style.left = '0px';
      
      const toolbarRect = toolbar.getBoundingClientRect();
      const panelWidth = linkPanel.offsetWidth;
      const viewportWidth = window.innerWidth;

      let targetLeft = 0;

      if (toolbarRect.left + panelWidth > viewportWidth - 10) {
        targetLeft = viewportWidth - toolbarRect.left - panelWidth - 10;
      }
      if (toolbarRect.left + targetLeft < 10) {
        targetLeft = 10 - toolbarRect.left;
      }

      linkPanel.style.left = `${targetLeft}px`;
    }

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
      
      adjustPanelBoundary();
    }

    function dragEnd() {
      isDragging = false;
      document.removeEventListener('mousemove', dragMove);
      document.removeEventListener('mouseup', dragEnd);
    }

    panelButton.addEventListener('click', function () {
      const isVisible = linkPanel.style.display === 'block';
      linkPanel.style.display = isVisible ? 'none' : 'block';
      adjustPanelBoundary();
    });

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
        adjustPanelBoundary();
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

    window.addEventListener('resize', adjustPanelBoundary);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVrlToolbar);
  } else {
    initVrlToolbar();
  }
})();