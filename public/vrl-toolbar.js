/**
 * vrl-toolbar.js
 *
 * Floating annotation toolbar injected into HTML documents opened by the VRL viewer.
 * The toolbar is a fixed-position panel that the user can drag anywhere on screen.
 *
 * Toolbar buttons (left → right):
 *  ⠿  Drag handle        — reposition the toolbar by mouse drag.
 *  ✏  Delete spots       — removes all <note-wrapper> anchors inside the current
 *                           text selection (mousedown so selection is still live).
 *  ↩  Undo               — removes the most recently added anchor (LIFO stack).
 *                           Disabled until the first anchor is placed.
 *  ↓• Spots navigation   — toggle: opens the navigator and optionally scopes it to
 *                           a text selection that was active at toggle time.
 *  ▥  Link panel         — toggle: shows/hides the Document Search panel.
 *  💾 Save               — serialises the document and sends it to the opener window
 *                           via postMessage after a confirmation dialog.
 *
 * Cross-script communication:
 *  - vrl-annotation.js dispatches 'vrl-anchor-added' CustomEvents on document
 *    after every successful placement. This toolbar listens for those events to
 *    maintain its undo stack and re-render the spots navigator — no shared globals.
 *  - The save payload is posted to window.opener so the parent DocumentForm can
 *    persist the HTML without this window needing server credentials.
 *  - Document search results arrive via a 'vrl-search-results' message from the
 *    opener in response to 'vrl-search-documents' requests.
 */
(function () {
  // Base URL for all API calls. Reads from a <meta name="vrl-api-base"> tag
  // injected by the backend when serving HTML files, so it works in any
  // environment without hardcoding. Falls back to the local dev server.
  const API_BASE = document.querySelector('meta[name="vrl-api-base"]')?.getAttribute('content')
    || 'http://localhost:3000/api';

  // ---------------------------------------------------------------------------
  // Link types cache
  // ---------------------------------------------------------------------------
  // Fetched once on script load (before DOMContentLoaded) so the data is ready
  // by the time any toolbar function needs it. Stored as a Map keyed by id for
  // O(1) lookup. Will be passed as a parameter to toolbar functions that need it.
  const linkTypesMap = new Map();

  fetch(`${API_BASE}/link-types`)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      (Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []).forEach(function (lt) {
        linkTypesMap.set(lt.id, lt);
      });
      console.log(`📋 Loaded ${linkTypesMap.size} link types`);
    })
    .catch(function (err) {
      console.error('Failed to load link types:', err);
    });

  /**
   * Builds the entire toolbar DOM, wires all event listeners, and appends the
   * toolbar to document.body. Called once after DOMContentLoaded (or immediately
   * if the document is already interactive).
   */
  function initVrlToolbar() {
    console.log('📦 Initializing Floating Annotation Toolbar...');

    // -------------------------------------------------------------------------
    // Stylesheet
    // -------------------------------------------------------------------------
    // All toolbar styles are injected programmatically so this file ships as a
    // single self-contained script with no external CSS dependency.
    const style = document.createElement('style');
    style.textContent = `
    /* --- Toolbar shell --- */
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

    /* --- Drag handle --- */
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

    /* --- Icon buttons --- */
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
    /* Disabled state: pointer-events:none prevents tooltip from showing on hover. */
    .vrl-toolbar-btn:disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
    /* Active/toggled-on state (used by spots nav and link panel buttons). */
    .vrl-toolbar-btn.vrl-active { background: rgba(0, 100, 255, 0.1); color: #1a56cc; }
    .vrl-toolbar-btn.vrl-active:hover { background: rgba(0, 100, 255, 0.16); }

    /* --- Spots navigator --- */
    /* Hidden by default; .vrl-nav-visible switches it to flex when the toggle is on. */
    #vrlSpotsNav {
      display: none;
      flex-direction: column;
      gap: 0;
      padding-bottom: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    #vrlSpotsNav.vrl-nav-visible { display: flex; }
    /* Inner row: prev arrow, number list, next arrow, expand toggle. */
    #vrlSpotsNavRow {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    /* Link properties form — hidden until toggle is activated. */
    #vrlLinkProps {
      display: none;
      padding-top: 8px;
      margin-top: 6px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
    #vrlLinkProps.vrl-expanded { display: block; }
    .vrl-link-props-title {
      font-size: 11px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 5px;
    }
    .vrl-link-props-id {
      font-size: 10px;
      color: #ccc;
      font-family: monospace;
      margin-bottom: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .vrl-link-type-select {
      width: 100%;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      padding: 4px 6px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: rgba(255, 255, 255, 0.85);
      color: #333;
      outline: none;
      cursor: pointer;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .vrl-link-type-select:focus { border-color: rgba(0, 100, 255, 0.4); }
    .vrl-link-side-group {
      display: flex;
      gap: 10px;
      margin-top: 7px;
    }
    .vrl-link-side-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #444;
      cursor: pointer;
    }
    .vrl-link-side-label input[type="radio"] { cursor: pointer; }
    .vrl-link-text-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: #888;
      letter-spacing: 0.06em;
      margin-top: 8px;
      margin-bottom: 4px;
      display: block;
    }
    .vrl-link-text-area {
      width: 100%;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      padding: 4px 6px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: rgba(255, 255, 255, 0.85);
      color: #333;
      outline: none;
      resize: none;
      box-sizing: border-box;
      transition: border-color 0.15s;
      line-height: 1.4;
    }
    .vrl-link-text-area:focus { border-color: rgba(0, 100, 255, 0.4); }
    .vrl-link-text-wrapper { position: relative; }
    .vrl-link-text-reset {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 16px;
      height: 16px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #bbb;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      transition: color 0.1s, background 0.1s;
    }
    .vrl-link-text-reset:hover { color: #555; background: rgba(0,0,0,0.06); }
    .vrl-link-text-reset[data-tooltip] { position: absolute; }
    .vrl-link-text-reset[data-tooltip]::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: calc(100% + 5px);
      right: 0;
      transform: scale(0.9);
      transform-origin: bottom right;
      background: #1e1e1e;
      color: #fff;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 3px 7px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s, transform 0.15s;
    }
    .vrl-link-text-reset[data-tooltip]:hover::after { opacity: 1; transform: scale(1); }
    .vrl-link-article-toggle {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 8px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #444;
      cursor: pointer;
    }
    .vrl-link-article-toggle input[type="checkbox"] { cursor: pointer; }
    .vrl-link-article-fields {
      display: none;
      flex-direction: column;
      gap: 5px;
      margin-top: 6px;
    }
    .vrl-link-article-fields.vrl-visible { display: flex; }
    .vrl-link-article-input {
      width: 100%;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      padding: 4px 6px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: rgba(255, 255, 255, 0.85);
      color: #333;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .vrl-link-article-input:focus { border-color: rgba(0, 100, 255, 0.4); }
    .vrl-spots-nav-arrow {
      background: transparent;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 4px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #555;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1;
      padding: 0;
      flex-shrink: 0;
      transition: background 0.12s;
    }
    .vrl-spots-nav-arrow:hover { background: rgba(0, 0, 0, 0.06); }
    .vrl-spots-nav-arrow:disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
    .vrl-spots-nav-arrow[data-tooltip]::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: -28px;
      left: 50%;
      transform: translateX(-50%) scale(0.9);
      background: #1e1e1e;
      color: #fff;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 3px 7px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: all 0.15s ease;
      z-index: 1000001;
    }
    .vrl-spots-nav-arrow[data-tooltip]:hover::after { opacity: 1; transform: translateX(-50%) scale(1); }
    .vrl-spots-nav-list {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1px;
      flex: 1;
    }
    /* Individual spot number pill. */
    .vrl-spots-nav-item {
      min-width: 20px;
      height: 20px;
      border-radius: 4px;
      border: none;
      background: transparent;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #555;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      transition: background 0.12s;
      flex-shrink: 0;
    }
    .vrl-spots-nav-item:hover { background: rgba(0, 0, 0, 0.06); }
    /* Highlighted pill for the currently active spot. */
    @keyframes vrl-spot-pulse {
      0%   { transform: scale(1);   text-shadow: none; }
      35%  { transform: scale(1.5); text-shadow: 0 0 14px rgba(220, 38, 38, 0.75); }
      100% { transform: scale(1);   text-shadow: none; }
    }
    .vrl-spot-pulse { animation: vrl-spot-pulse 0.65s ease-out; }
    .vrl-spots-nav-item.vrl-nav-current {
      background: rgba(0, 100, 255, 0.12);
      color: #1a56cc;
      font-weight: 600;
    }
    /* Ellipsis separator shown when the spot count exceeds 7. */
    .vrl-spots-nav-ellipsis {
      font-size: 11px;
      color: #bbb;
      padding: 0 1px;
      line-height: 20px;
      flex-shrink: 0;
    }

    /* --- Tooltip (CSS-only, no JS) --- */
    /* data-tooltip value is rendered via ::after pseudo-element. */
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

    /* --- Visual separator between button groups --- */
    .vrl-toolbar-sep {
      width: 1px;
      height: 20px;
      background: rgba(0,0,0,0.1);
      margin: 0 2px;
      flex-shrink: 0;
    }

    /* --- Link panel (document search + spots navigator container) --- */
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
      position: relative;   /* allows left offset for boundary correction */
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
    .vrl-doc-result-item.vrl-selected { background: rgba(0, 100, 255, 0.10); }
    .vrl-doc-result-item.vrl-selected .vrl-doc-result-name { color: #1a56cc; font-weight: 500; }
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

    /* --- Save confirmation modal --- */
    .vrl-confirm-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000002;   /* above the toolbar's z-index 999999 */
      background: rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vrl-confirm-box {
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      padding: 20px 22px 16px;
      min-width: 240px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .vrl-confirm-title {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .vrl-confirm-msg {
      font-size: 12px;
      color: #666;
      margin-bottom: 16px;
    }
    .vrl-confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .vrl-confirm-cancel {
      background: transparent;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 12px;
      font-family: inherit;
      color: #555;
      cursor: pointer;
      transition: background 0.15s;
    }
    .vrl-confirm-cancel:hover { background: rgba(0, 0, 0, 0.05); }
    .vrl-confirm-save {
      background: #28a745;
      border: none;
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 12px;
      font-family: inherit;
      color: #fff;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .vrl-confirm-save:hover { opacity: 0.88; }

    /* --- Link save button (inside link props form) --- */
    .vrl-link-save-btn {
      display: block;
      width: 100%;
      margin-top: 10px;
      padding: 5px 10px;
      background: rgba(0, 100, 255, 0.08);
      border: 1px solid rgba(0, 100, 255, 0.22);
      border-radius: 5px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1a56cc;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .vrl-link-save-btn:hover { background: rgba(0, 100, 255, 0.15); }
    .vrl-link-save-btn:active { background: rgba(0, 100, 255, 0.22); }
    .vrl-link-save-btn.vrl-saved { background: rgba(40, 167, 69, 0.1); border-color: rgba(40, 167, 69, 0.3); color: #28a745; }
    .vrl-link-save-btn.vrl-error { background: rgba(220, 53, 69, 0.08); border-color: rgba(220, 53, 69, 0.3); color: #dc3545; }
    .vrl-link-save-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .vrl-link-form-actions {
      display: flex;
      gap: 5px;
      margin-top: 10px;
    }
    .vrl-link-form-actions .vrl-link-save-btn { flex: 1; margin-top: 0; }
    .vrl-link-cancel-btn {
      flex: 1;
      padding: 5px 10px;
      background: transparent;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 5px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #555;
      cursor: pointer;
      transition: background 0.15s;
    }
    .vrl-link-cancel-btn:hover { background: rgba(0, 0, 0, 0.05); }
    .vrl-link-cancel-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    `;
    document.head.appendChild(style);

    // -------------------------------------------------------------------------
    // Toolbar DOM construction
    // -------------------------------------------------------------------------

    const toolbar = document.createElement('div');
    toolbar.className = 'vrl-floating-toolbar';

    const mainRow = document.createElement('div');
    mainRow.className = 'vrl-toolbar-main-row';
    toolbar.appendChild(mainRow);

    // Six-dot grid icon — purely decorative; the mousedown listener below makes
    // this div the drag initiator.
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

    // Delete button — sweeps all <note-wrapper> anchors inside the live text selection.
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

    // Undo button — removes the last anchor from the UUID stack (LIFO).
    // Starts disabled; enabled by the 'vrl-anchor-added' listener below.
    const undoButton = document.createElement('button');
    undoButton.className = 'vrl-toolbar-btn';
    undoButton.setAttribute('data-tooltip', 'Undo last anchor');
    undoButton.disabled = true;
    undoButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
    </svg>
    `;
    mainRow.appendChild(undoButton);

    // Spots navigation toggle — shows/hides the navigator strip inside #vrlLinkPanel.
    // If a text selection is active at click time, the navigator is scoped to spots
    // inside that selection only; otherwise it covers all spots in the document.
    const spotsNavButton = document.createElement('button');
    spotsNavButton.className = 'vrl-toolbar-btn';
    spotsNavButton.setAttribute('data-tooltip', 'Spots navigation');
    spotsNavButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v14"/><path d="m19 9-7 7-7-7"/><circle cx="12" cy="21" r="1"/>
    </svg>
    `;
    mainRow.appendChild(spotsNavButton);

    /**
     * Spots nav toggle handler.
     *
     * On activation:
     *  1. Reads window.getSelection() immediately (before the panel opens and the
     *     user's selection is cleared by the click). A non-collapsed range is cloned
     *     into spotsNavRange so getAllSpots() can filter by it. cloneRange() is
     *     necessary because the live Range object mutates as the selection changes.
     *  2. Forces #vrlLinkPanel open so the navigator strip is visible.
     *  3. Resets currentSpotIndex to -1 (nothing selected in this new scope).
     *
     * On deactivation:
     *  spotsNavRange is cleared so subsequent getAllSpots() calls return all spots.
     */
    spotsNavButton.addEventListener('click', function () {
      const isActive = spotsNavButton.classList.toggle('vrl-active');
      const spotsNav = document.getElementById('vrlSpotsNav');
      if (isActive) {
        const sel = window.getSelection();
        spotsNavRange = (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed)
          ? sel.getRangeAt(0).cloneRange()
          : null;
        linkPanel.style.display = 'block';
        spotsNav.classList.add('vrl-nav-visible');
        currentSpotIndex = -1;
        renderSpotsNav();
        adjustPanelBoundary();
      } else {
        spotsNavRange = null;
        spotsNav.classList.remove('vrl-nav-visible');
        adjustPanelBoundary();
      }
    });

    // Link panel toggle — shows/hides the document search panel independently of
    // the spots navigator. Uses absolute path coordinates (fill) to avoid SVG
    // stroke-width scaling issues at small sizes.
    const panelButton = document.createElement('button');
    panelButton.className = 'vrl-toolbar-btn';
    panelButton.setAttribute('data-tooltip', 'Toggle link panel');
    panelButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H11V5h8v14z"/>
    </svg>
    `;
    mainRow.appendChild(panelButton);

    // Visual separator between the editing buttons and the save button.
    const sep = document.createElement('div');
    sep.className = 'vrl-toolbar-sep';
    mainRow.appendChild(sep);

    // Save button — triggers a confirmation dialog then serialises and posts the HTML.
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

    // -------------------------------------------------------------------------
    // Link panel HTML
    // -------------------------------------------------------------------------
    // The panel is a child of the toolbar <div> (not document.body) so it moves
    // with the toolbar during drag. #vrlSpotsNav sits above the search form and
    // is only shown when the spots nav toggle is active.
    const linkPanel = document.createElement('div');
    linkPanel.id = 'vrlLinkPanel';
    linkPanel.innerHTML = `
      <div id="vrlSpotsNav">
        <div id="vrlSpotsNavRow">
          <button class="vrl-spots-nav-arrow" id="vrlSpotsPrev" data-tooltip="Previous spot">&#8249;</button>
          <div class="vrl-spots-nav-list" id="vrlSpotsNavList"></div>
          <button class="vrl-spots-nav-arrow" id="vrlSpotsNext" data-tooltip="Next spot">&#8250;</button>
          <div class="vrl-toolbar-sep"></div>
          <button class="vrl-spots-nav-arrow" id="vrlLinkPropsToggle" data-tooltip="Link properties">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
        <div id="vrlLinkProps">
          <div class="vrl-link-props-title">Link Properties</div>
          <div class="vrl-link-props-id" id="vrlLinkPropsSpotId">—</div>
          <select class="vrl-link-type-select" id="vrlLinkTypeSelect">
            <option value="">Select link type…</option>
          </select>
          <span class="vrl-link-text-label">Side of the link</span>
          <div class="vrl-link-side-group">
            <label class="vrl-link-side-label">
              <input type="radio" name="vrlLinkSide" value="active" checked /> Active side
            </label>
            <label class="vrl-link-side-label">
              <input type="radio" name="vrlLinkSide" value="passive" /> Passive side
            </label>
          </div>
          <span class="vrl-link-text-label">Document Gender</span>
          <div class="vrl-link-side-group">
            <label class="vrl-link-side-label">
              <input type="radio" name="vrlLinkGender" value="feminine" checked /> Femenine
            </label>
            <label class="vrl-link-side-label">
              <input type="radio" name="vrlLinkGender" value="masculine" /> Masculine
            </label>
          </div>
          <label class="vrl-link-article-toggle">
            <input type="checkbox" id="vrlArticleToggle" /> Link to an specific article
          </label>
          <div class="vrl-link-article-fields" id="vrlArticleFields">
            <span class="vrl-link-text-label">Article text</span>
            <input class="vrl-link-article-input" id="vrlArticleText" type="text" placeholder="Article text…" />
            <span class="vrl-link-text-label">Article anchor</span>
            <input class="vrl-link-article-input" id="vrlArticleAnchor" type="text" placeholder="Article anchor…" />
          </div>
          <span class="vrl-link-text-label">Link Text</span>
          <div class="vrl-link-text-wrapper">
            <textarea class="vrl-link-text-area" id="vrlLinkText" rows="2"></textarea>
            <button class="vrl-link-text-reset" id="vrlLinkTextReset" data-tooltip="Reset to calculated value">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </div>
          <div class="vrl-link-form-actions">
            <button class="vrl-link-cancel-btn" id="vrlLinkCancelBtn" disabled>Cancel</button>
            <button class="vrl-link-save-btn" id="vrlLinkSaveBtn" disabled>Save link</button>
          </div>
        </div>
      </div>
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

    // -------------------------------------------------------------------------
    // Undo stack
    // -------------------------------------------------------------------------
    // Each entry is the data-vrl-id UUID of a placed <note-wrapper>. LIFO: the
    // most recently added UUID is at the end of the array and popped first.
    //
    // The stack is fed by 'vrl-anchor-added' events dispatched by vrl-annotation.js
    // after every successful Mode 2 or Mode 3 insertion. Using a custom event rather
    // than a direct function reference keeps the two scripts fully decoupled —
    // either can be reloaded independently without breaking the other.
    const undoStack = [];

    // When the user clicks a spot directly in the document, vrl-annotation.js dispatches
    // 'vrl-spot-selected' with the spot's vrl-id. Navigate the form to that spot.
    document.addEventListener('vrl-spot-selected', function (e) {
      if (!e.detail.id) return;
      const spots = getAllSpots();
      const index = spots.findIndex(function (nw) { return nw.dataset.vrlId === e.detail.id; });
      if (index !== -1) navigateToSpot(index);
    });

    document.addEventListener('vrl-anchor-added', function (e) {
      undoStack.push(e.detail.id);
      undoButton.disabled = false;
      // Re-render the navigator so the newly added spot appears in the list.
      renderSpotsNav();
    });

    /**
     * Undo click handler.
     *
     * Pops UUIDs from the stack until it finds one whose element is still in the
     * DOM (isConnected). Stale IDs can accumulate when the delete-sweep button
     * removes spots that were also in the undo stack — skipping them silently
     * avoids a no-op that would consume the user's undo action without visible
     * effect.
     *
     * After removal, parent.normalize() merges any text nodes that were split when
     * the <note-wrapper> was inserted (inline Mode 2 anchors split their surrounding
     * text node into two). Leaving split text nodes causes subtle issues with Range
     * offsets and copy-paste in some browsers.
     */
    undoButton.addEventListener('click', function () {
      while (undoStack.length > 0) {
        const id = undoStack.pop();
        const el = document.querySelector(`note-wrapper[data-vrl-id="${id}"]`);
        if (el && el.isConnected) {
          const parent = el.parentNode;
          el.remove();
          if (parent) parent.normalize();
          break;
        }
      }
      if (undoStack.length === 0) undoButton.disabled = true;
      renderSpotsNav();
    });

    // -------------------------------------------------------------------------
    // Spots navigator state
    // -------------------------------------------------------------------------
    // currentSpotIndex: 0-based index into the array returned by getAllSpots().
    //   -1 means no spot is currently highlighted by the navigator.
    //
    // spotsNavRange: a cloned Range capturing the text selection at the moment the
    //   navigator was toggled on. getAllSpots() uses it to filter anchors via
    //   Range.intersectsNode(). null means "show all spots in the document".
    let currentSpotIndex = -1;
    let spotsNavRange = null;

    /**
     * Returns the set of <note-wrapper> elements to navigate.
     *
     * When spotsNavRange is set, filters the full document-order list to only
     * those elements that intersect the captured range. Range.intersectsNode()
     * returns true for elements fully inside, partially inside, or spanning the
     * range boundary — the right semantics for "spots within this selection".
     */
    function getAllSpots() {
      const all = Array.from(document.querySelectorAll('note-wrapper'));
      if (!spotsNavRange) return all;
      return all.filter(nw => spotsNavRange.intersectsNode(nw));
    }

    /**
     * Re-renders the #vrlSpotsNavList contents and updates the prev/next button
     * disabled states. No-ops if the navigator is not currently visible.
     *
     * Ellipsis strategy (keeps the list compact for large documents):
     *  ≤ 7 spots: show every number.
     *  > 7 spots: show first 3 numbers, then '…', then last 3 numbers.
     *  The currently active index is always highlighted regardless of whether its
     *  number appears in the truncated view (the arrows still work).
     *
     * Prev is disabled at the first spot (index 0) or when nothing is selected.
     * Next is disabled at the last spot. If nothing is selected (index -1) the
     * next button is still enabled so the first click starts navigation from spot 1.
     */
    function renderSpotsNav() {
      const spotsNav = document.getElementById('vrlSpotsNav');
      if (!spotsNav || !spotsNav.classList.contains('vrl-nav-visible')) return;

      const spots = getAllSpots();
      const n = spots.length;
      const navList = document.getElementById('vrlSpotsNavList');
      const prevBtn = document.getElementById('vrlSpotsPrev');
      const nextBtn = document.getElementById('vrlSpotsNext');

      navList.innerHTML = '';

      if (n === 0) {
        const empty = document.createElement('span');
        empty.className = 'vrl-spots-nav-ellipsis';
        empty.textContent = 'No spots';
        navList.appendChild(empty);
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      // Build the item list: array of 0-based indices interspersed with '…'.
      const items = n <= 7
        ? Array.from({ length: n }, (_, i) => i)
        : [0, 1, 2, '…', n - 3, n - 2, n - 1];

      items.forEach(function (item) {
        if (item === '…') {
          const el = document.createElement('span');
          el.className = 'vrl-spots-nav-ellipsis';
          el.textContent = '…';
          navList.appendChild(el);
        } else {
          const btn = document.createElement('button');
          btn.className = 'vrl-spots-nav-item' + (item === currentSpotIndex ? ' vrl-nav-current' : '');
          btn.textContent = item + 1;  // display as 1-based
          btn.addEventListener('click', function () { navigateToSpot(item); });
          navList.appendChild(btn);
        }
      });

      // currentSpotIndex <= 0 covers both "at first spot" and "nothing selected" (-1).
      // Also disable arrows when there are unsaved changes to prevent losing edits.
      prevBtn.disabled = isDirty || currentSpotIndex <= 0;
      nextBtn.disabled = isDirty || currentSpotIndex >= n - 1;
    }

    /**
     * Navigates to the spot at the given 0-based index within getAllSpots().
     *
     * Selection handoff to vrl-annotation.js:
     *  vrl-annotation.js manages selectedSpotEl internally. Rather than sharing
     *  that variable, we directly manipulate .vrl-spot-selected on the span via
     *  querySelector. The annotation script's next click will find the class
     *  already removed and behave correctly (removing a missing class is a no-op).
     *
     * Scroll strategy:
     *  We scroll the inner <span> (the visible red dot) rather than the
     *  <note-wrapper> itself, because <note-wrapper> has display:contents and
     *  therefore has no layout box — scrollIntoView on it is a no-op in most
     *  browsers. The viewport check ensures we only scroll when the dot is
     *  actually off-screen; if it is already visible we leave the page position
     *  untouched.
     *
     * @param {number} index - 0-based position in the getAllSpots() array.
     */
    function navigateToSpot(index) {
      if (isDirty) return;
      const spots = getAllSpots();
      if (index < 0 || index >= spots.length) return;

      // Deselect the previously highlighted spot indicator.
      const prevSelected = document.querySelector('.vrl-spot > span.vrl-spot-selected');
      if (prevSelected) prevSelected.classList.remove('vrl-spot-selected');

      currentSpotIndex = index;
      const target = spots[index];
      loadLinkPropsState(target.dataset.vrlId);
      const snapshot = captureFormState();
      baselineStore[target.dataset.vrlId] = snapshot;
      linkPropsStore[target.dataset.vrlId] = { ...snapshot };
      isDirty = false;
      const span = target.querySelector('span');
      if (span) {
        span.classList.add('vrl-spot-selected');
        // Only scroll if the red dot is outside the current viewport.
        const rect = span.getBoundingClientRect();
        const inViewport = rect.top >= 0 && rect.bottom <= window.innerHeight
                        && rect.left >= 0 && rect.right <= window.innerWidth;
        if (!inViewport) span.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      renderSpotsNav();
      syncLinkPropsSpotId();
    }

    // Tracks the document selected from the search results list.
    let selectedDocName = null;
    let selectedDocId = null;

    // When true the user has manually edited the Link Text field; auto-compute is suppressed.
    let linkTextUserEdited = false;

    // -------------------------------------------------------------------------
    // Per-spot form state store
    // -------------------------------------------------------------------------
    // linkPropsStore  — current values keyed by data-vrl-id, updated on every change.
    // baselineStore   — snapshot taken on navigation (or after save); cancel restores to this.
    // isDirty         — true when the current spot has unsaved changes.
    const linkPropsStore = {};
    const baselineStore  = {};
    let isDirty = false;

    function captureFormState() {
      return {
        linkTypeId:         document.getElementById('vrlLinkTypeSelect').value,
        linkSide:           document.querySelector('input[name="vrlLinkSide"]:checked')?.value || 'active',
        linkGender:         document.querySelector('input[name="vrlLinkGender"]:checked')?.value || 'feminine',
        articleToggle:      document.getElementById('vrlArticleToggle').checked,
        articleText:        document.getElementById('vrlArticleText').value,
        articleAnchor:      document.getElementById('vrlArticleAnchor').value,
        linkText:           document.getElementById('vrlLinkText').value,
        linkTextUserEdited,
        selectedDocId,
        selectedDocName,
      };
    }

    function updateFormActionButtons() {
      const spots = getAllSpots();
      const spot = currentSpotIndex >= 0 ? spots[currentSpotIndex] : null;
      const cancelBtn = document.getElementById('vrlLinkCancelBtn');
      const saveBtn   = document.getElementById('vrlLinkSaveBtn');
      if (cancelBtn) cancelBtn.disabled = !isDirty;
      if (saveBtn) {
        saveBtn.textContent = (spot && spot.dataset.linkDocumentId) ? 'Update link' : 'Save link';
        saveBtn.disabled = !spot;
      }
    }

    function saveLinkPropsState() {
      const spots = getAllSpots();
      const spot = currentSpotIndex >= 0 ? spots[currentSpotIndex] : null;
      if (!spot || !spot.dataset.vrlId) return;
      linkPropsStore[spot.dataset.vrlId] = captureFormState();
      if (!isDirty) {
        isDirty = true;
        updateFormActionButtons();
        renderSpotsNav();
      }
    }

    function loadLinkPropsState(spotId) {
      const state = linkPropsStore[spotId];

      // Reset every field to its default before applying stored state.
      document.getElementById('vrlLinkTypeSelect').value = '';
      document.querySelector('input[name="vrlLinkSide"][value="active"]').checked = true;
      document.querySelector('input[name="vrlLinkGender"][value="feminine"]').checked = true;
      document.getElementById('vrlArticleToggle').checked = false;
      document.getElementById('vrlArticleFields').classList.remove('vrl-visible');
      document.getElementById('vrlArticleText').value = '';
      document.getElementById('vrlArticleAnchor').value = '';
      document.getElementById('vrlLinkText').value = '';
      linkTextUserEdited = false;
      selectedDocId   = null;
      selectedDocName = null;

      if (!state) return;

      document.getElementById('vrlLinkTypeSelect').value = state.linkTypeId || '';
      const sideEl = document.querySelector(`input[name="vrlLinkSide"][value="${state.linkSide}"]`);
      if (sideEl) sideEl.checked = true;
      const genderEl = document.querySelector(`input[name="vrlLinkGender"][value="${state.linkGender}"]`);
      if (genderEl) genderEl.checked = true;
      document.getElementById('vrlArticleToggle').checked = !!state.articleToggle;
      document.getElementById('vrlArticleFields').classList.toggle('vrl-visible', !!state.articleToggle);
      document.getElementById('vrlArticleText').value   = state.articleText   || '';
      document.getElementById('vrlArticleAnchor').value = state.articleAnchor || '';
      document.getElementById('vrlLinkText').value      = state.linkText      || '';
      linkTextUserEdited = !!state.linkTextUserEdited;
      selectedDocId      = state.selectedDocId   || null;
      selectedDocName    = state.selectedDocName || null;
    }

    // Recomputes the Link Text textarea from the current link type, gender, and selected document.
    // Skips silently if the user has manually edited the field.
    function computeLinkText() {
      if (linkTextUserEdited) return;
      const textarea = document.getElementById('vrlLinkText');
      if (!textarea) return;
      const sel = document.getElementById('vrlLinkTypeSelect');
      const linkType = sel ? linkTypesMap.get(sel.value) : null;
      const activeVerb = linkType ? (linkType.active_verb || linkType.name || '') : '';
      const genderEl = document.querySelector('input[name="vrlLinkGender"]:checked');
      const article = genderEl && genderEl.value === 'masculine' ? 'el' : 'la';
      const articleToggle = document.getElementById('vrlArticleToggle');
      const articleText = document.getElementById('vrlArticleText');
      const articlePhrase = (articleToggle && articleToggle.checked && articleText && articleText.value.trim())
        ? ('el ' + articleText.value.trim() + ' de')
        : '';
      const parts = [
        activeVerb,
        articlePhrase,
        selectedDocName ? (article + ' ' + selectedDocName) : '',
      ].filter(Boolean);
      textarea.value = parts.join(' ');
    }

    // Rebuilds the link type <select> from the cached linkTypesMap.
    // Called each time the form is expanded so it always reflects the latest data.
    function populateLinkTypeSelect() {
      const sel = document.getElementById('vrlLinkTypeSelect');
      if (!sel) return;
      const previous = sel.value;
      sel.innerHTML = '<option value="">Select link type…</option>';
      linkTypesMap.forEach(function (lt) {
        const opt = document.createElement('option');
        opt.value = lt.id;
        opt.textContent = lt.name || lt.label || String(lt.id);
        sel.appendChild(opt);
      });
      if (previous) sel.value = previous;
    }

    // Updates the spot ID label and all form action button states.
    function syncLinkPropsSpotId() {
      const el = document.getElementById('vrlLinkPropsSpotId');
      if (!el) return;
      const spots = getAllSpots();
      const spot = currentSpotIndex >= 0 ? spots[currentSpotIndex] : null;
      el.textContent = spot ? (spot.dataset.vrlId || '—') : '—';
      updateFormActionButtons();
    }

    // Prev arrow: step back one spot. Disabled at index 0 so this will not fire
    // when index is already 0 (pointer-events:none), but guard anyway.
    document.getElementById('vrlSpotsPrev').addEventListener('click', function () {
      navigateToSpot(currentSpotIndex - 1);
    });

    // Next arrow: if nothing is selected yet (-1), navigate to the first spot (0);
    // otherwise advance by one.
    document.getElementById('vrlSpotsNext').addEventListener('click', function () {
      navigateToSpot(currentSpotIndex === -1 ? 0 : currentSpotIndex + 1);
    });

    // Expand / collapse the Link Properties form.
    // The SVG chevron flips between down (collapsed) and up (expanded).
    // On expand, populate the select from linkTypesMap and sync the spot ID label.
    document.getElementById('vrlLinkPropsToggle').addEventListener('click', function () {
      const form = document.getElementById('vrlLinkProps');
      const expanded = form.classList.toggle('vrl-expanded');
      this.querySelector('svg path').setAttribute('d',
        expanded ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'
      );
      if (expanded) {
        populateLinkTypeSelect();
        syncLinkPropsSpotId();
      }
      adjustPanelBoundary();
    });

    // -------------------------------------------------------------------------
    // Document search
    // -------------------------------------------------------------------------
    /**
     * Sends a search request to the opener window via postMessage and shows a
     * loading placeholder. Results arrive asynchronously via the 'message' listener
     * below. Requires window.opener to exist — the document must be opened from
     * the DocumentForm editor, not navigated to directly.
     */
    function searchDocuments(type, number, year, entity) {
      const resultsEl = document.getElementById('vrlDocResults');
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = '<div class="vrl-doc-results-msg">Searching…</div>';
      selectedDocName = null;
      computeLinkText();

      if (!window.opener) {
        resultsEl.innerHTML = '<div class="vrl-doc-results-msg">No opener window.</div>';
        return;
      }

      window.opener.postMessage(
        { type: 'vrl-search-documents', params: { type, number, year, entity } },
        window.opener.location.origin  // restrict to the same origin for security
      );

      adjustPanelBoundary();
    }

    /**
     * Handles 'vrl-search-results' messages from the opener window.
     *
     * The opener's DocumentForm listens for 'vrl-search-documents', queries its
     * data source, and posts back a 'vrl-search-results' message containing a
     * documents array. Each entry may have documentName, normTypeName, number,
     * year, and id fields — we fall back gracefully if any are missing.
     */
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

    document.getElementById('vrlLinkText').addEventListener('input', function () {
      linkTextUserEdited = true;
      saveLinkPropsState();
    });

    document.getElementById('vrlLinkTextReset').addEventListener('click', function () {
      linkTextUserEdited = false;
      computeLinkText();
      saveLinkPropsState();
    });

    document.getElementById('vrlArticleToggle').addEventListener('change', function () {
      document.getElementById('vrlArticleFields').classList.toggle('vrl-visible', this.checked);
      computeLinkText();
      saveLinkPropsState();
    });

    document.getElementById('vrlArticleText').addEventListener('input', function () {
      computeLinkText();
      saveLinkPropsState();
    });

    document.getElementById('vrlArticleText').addEventListener('blur', function () {
      const anchor = document.getElementById('vrlArticleAnchor');
      if (anchor && !anchor.value.trim()) {
        anchor.value = this.value.trim().toLowerCase().replace(/\s+/g, '-');
      }
      saveLinkPropsState();
    });

    document.getElementById('vrlArticleAnchor').addEventListener('input', saveLinkPropsState);

    document.getElementById('vrlLinkTypeSelect').addEventListener('change', function () {
      computeLinkText();
      saveLinkPropsState();
    });

    document.getElementById('vrlLinkProps').addEventListener('change', function (e) {
      if (e.target.name === 'vrlLinkGender' || e.target.name === 'vrlLinkSide') {
        computeLinkText();
        saveLinkPropsState();
      }
    });

    document.getElementById('vrlDocResults').addEventListener('click', function (e) {
      const item = e.target.closest('.vrl-doc-result-item');
      if (!item) return;
      document.querySelectorAll('.vrl-doc-result-item.vrl-selected')
        .forEach(function (el) { el.classList.remove('vrl-selected'); });
      item.classList.add('vrl-selected');
      selectedDocName = item.querySelector('.vrl-doc-result-name')?.textContent || null;
      selectedDocId = item.dataset.id || null;
      computeLinkText();
      saveLinkPropsState();
    });

    // -------------------------------------------------------------------------
    // Link document save / update
    // -------------------------------------------------------------------------
    /**
     * POSTs a new link_document record or PUTs an update to an existing one.
     *
     * Endpoint: /documentLink (POST) or /documentLink/:linkDocumentId (PUT)
     *
     * Payload fields map directly to the link_document table columns:
     *  - link_id              — the spot's data-vrl-id (anchor UUID in the HTML)
     *  - source_document_id   — the document being edited; read from the
     *                           <meta name="vrl-document-id"> tag injected by the
     *                           backend when it serves the HTML file
     *  - target_document_id   — the document chosen in the search results panel
     *  - link_type_id         — selected link type
     *  - link_side            — 'A' (active) or 'P' (passive)
     *  - target_document_gender — 'M' or 'F'
     *  - specific_article     — boolean
     *  - target_article_text / target_article_anchor — only when specific_article
     *  - link_text            — computed or manually edited text
     *
     * On a successful POST the response is expected to contain the new record's id
     * so it can be stored on the spot element for subsequent PUT requests.
     */
    document.getElementById('vrlLinkCancelBtn').addEventListener('click', function () {
      const spots = getAllSpots();
      const spot = currentSpotIndex >= 0 ? spots[currentSpotIndex] : null;
      if (!spot) return;
      const spotId = spot.dataset.vrlId;
      // Restore store to baseline and re-apply to form.
      if (baselineStore[spotId]) {
        linkPropsStore[spotId] = { ...baselineStore[spotId] };
      } else {
        delete linkPropsStore[spotId];
      }
      loadLinkPropsState(spotId);
      isDirty = false;
      updateFormActionButtons();
      renderSpotsNav();
    });

    document.getElementById('vrlLinkSaveBtn').addEventListener('click', function () {
      const spots = getAllSpots();
      const spot = currentSpotIndex >= 0 ? spots[currentSpotIndex] : null;
      if (!spot) {
        console.warn('No spot selected — navigate to a spot before saving.');
        return;
      }

      const linkDocumentId = spot.dataset.linkDocumentId || null;
      const isUpdate = !!linkDocumentId;
      const btn = document.getElementById('vrlLinkSaveBtn');

      const sideVal = document.querySelector('input[name="vrlLinkSide"]:checked')?.value;
      const genderVal = document.querySelector('input[name="vrlLinkGender"]:checked')?.value;
      const articleChecked = document.getElementById('vrlArticleToggle').checked;

      const payload = {
        link_id: spot.dataset.vrlId,
        source_document_id: document.querySelector('meta[name="vrl-document-id"]')?.getAttribute('content') || null,
        target_document_id: selectedDocId,
        link_type_id: document.getElementById('vrlLinkTypeSelect').value || null,
        link_side: sideVal === 'active' ? 'A' : 'P',
        target_document_gender: genderVal === 'masculine' ? 'M' : 'F',
        specific_article: articleChecked,
        target_article_text: articleChecked ? (document.getElementById('vrlArticleText').value.trim() || null) : null,
        target_article_anchor: articleChecked ? (document.getElementById('vrlArticleAnchor').value.trim() || null) : null,
        link_text: document.getElementById('vrlLinkText').value.trim() || null,
      };

      const url = isUpdate ? `${API_BASE}/documentLink/${linkDocumentId}` : `${API_BASE}/documentLink`;

      fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(function (data) {
          if (!isUpdate && data.id) {
            spot.dataset.linkDocumentId = data.id;
          }
          // Advance baseline so cancel would now restore to this saved state.
          baselineStore[spot.dataset.vrlId] = { ...linkPropsStore[spot.dataset.vrlId] };
          isDirty = false;
          updateFormActionButtons();
          renderSpotsNav();
          btn.textContent = 'Saved ✓';
          btn.classList.add('vrl-saved');
          setTimeout(function () {
            btn.textContent = 'Update link';
            btn.classList.remove('vrl-saved');
          }, 2000);
        })
        .catch(function (err) {
          console.error('Failed to save link document:', err);
          btn.textContent = 'Error — retry';
          btn.classList.add('vrl-error');
          setTimeout(function () {
            btn.textContent = isUpdate ? 'Update link' : 'Save link';
            btn.classList.remove('vrl-error');
          }, 2000);
        });
    });

    document.getElementById('vrlSearchDocsBtn').addEventListener('click', function () {
      const type   = document.getElementById('vrlSearchType').value.trim();
      const number = document.getElementById('vrlSearchNumber').value.trim();
      const year   = document.getElementById('vrlSearchYear').value.trim();
      const entity = document.getElementById('vrlSearchEntity').value.trim();
      searchDocuments(type, number, year, entity);
    });

    // -------------------------------------------------------------------------
    // Toolbar drag
    // -------------------------------------------------------------------------
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    /**
     * Keeps the link panel within the viewport horizontally after the toolbar
     * is moved or the panel content changes size.
     *
     * The panel is positioned with `left` relative to the toolbar via CSS (it is
     * a child element). We start at left:0 (aligned with the toolbar's left edge)
     * then shift left if the panel would overflow the right edge of the viewport,
     * and clamp so it never goes past the left viewport edge either.
     */
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

    /**
     * Drag start: capture the toolbar's current pixel position and the pointer's
     * starting coordinates. We switch from right/bottom CSS positioning to
     * explicit left/top so we can move the toolbar by setting those values during
     * mousemove. preventDefault stops text selection during the drag.
     */
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

    /**
     * Drag move: compute new position from the delta since drag start,
     * clamped to keep the toolbar at least 10px inside the viewport on all sides.
     */
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

    // Drag end: remove the temporary move/up listeners to avoid accumulating them.
    function dragEnd() {
      isDragging = false;
      document.removeEventListener('mousemove', dragMove);
      document.removeEventListener('mouseup', dragEnd);
    }

    // -------------------------------------------------------------------------
    // Panel button
    // -------------------------------------------------------------------------
    panelButton.addEventListener('click', function () {
      const isVisible = linkPanel.style.display === 'block';
      linkPanel.style.display = isVisible ? 'none' : 'block';
      adjustPanelBoundary();
    });

    // -------------------------------------------------------------------------
    // Delete button — sweep spots in selection
    // -------------------------------------------------------------------------
    /**
     * Uses mousedown (not click) so the text selection is still live when the
     * handler runs. A click event fires after mouseup, at which point most browsers
     * have already collapsed the selection.
     *
     * Strategy:
     *  1. Clone the selection range contents into a DocumentFragment — this is a
     *     cheap structural copy that lets us count matching elements without touching
     *     the live DOM.
     *  2. If the clone contains any .vrl-spot / note-wrapper elements, query the
     *     live container for all such elements and remove those that the Selection
     *     object reports as contained (selection.containsNode with allowPartial:true
     *     handles anchors that straddle a selection boundary).
     *  3. normalize() merges any split text nodes left behind by inline anchors.
     *
     * preventDefault stops the mousedown from moving the caret, which would
     * collapse the selection before we can read it.
     */
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
        renderSpotsNav();
        adjustPanelBoundary();
      } else {
        console.log("No targets detected inside the selected scope.");
      }
    });

    // -------------------------------------------------------------------------
    // Save
    // -------------------------------------------------------------------------
    /**
     * Serialises the current document and posts it to window.opener.
     *
     * The toolbar itself and the two injected scripts (#vindexrlScript1 and
     * #vindexrl-toolbar) are stripped from the clone before serialisation so the
     * saved HTML is a clean document without runtime tooling.
     *
     * cloneNode(true) is used instead of document.documentElement.outerHTML
     * because it gives us a live DOM tree we can mutate (strip nodes) before
     * turning it into a string — outerHTML is a one-shot serialisation with no
     * opportunity to filter.
     *
     * The opener receives a 'vrl-save' postMessage containing the raw HTML string.
     * A green flash on the save button confirms the message was sent.
     */
    function doSave() {
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
    }

    /**
     * Save button click: show a confirmation modal before overwriting.
     * The modal is appended to document.body (not inside the toolbar) so it
     * covers the full viewport via position:fixed + inset:0.
     */
    saveButton.addEventListener('click', function () {
      const overlay = document.createElement('div');
      overlay.className = 'vrl-confirm-overlay';
      overlay.innerHTML = `
        <div class="vrl-confirm-box">
          <div class="vrl-confirm-title">Save document</div>
          <div class="vrl-confirm-msg">This will overwrite the current saved version. Continue?</div>
          <div class="vrl-confirm-actions">
            <button class="vrl-confirm-cancel">Cancel</button>
            <button class="vrl-confirm-save">Save</button>
          </div>
        </div>
      `;

      overlay.querySelector('.vrl-confirm-cancel').addEventListener('click', () => overlay.remove());
      overlay.querySelector('.vrl-confirm-save').addEventListener('click', () => {
        overlay.remove();
        doSave();
      });

      document.body.appendChild(overlay);
    });

    // Re-check panel boundary whenever the viewport is resized (e.g. device rotation).
    window.addEventListener('resize', adjustPanelBoundary);

    // Pulse the selected spot every 4 seconds to draw attention to it.
    setInterval(function () {
      const selected = document.querySelector('.vrl-spot > span.vrl-spot-selected');
      if (!selected) return;
      selected.classList.remove('vrl-spot-pulse');
      void selected.offsetWidth; // force reflow so the animation restarts cleanly
      selected.classList.add('vrl-spot-pulse');
    }, 4000);
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------
  // If the document is still parsing (readyState === 'loading'), defer until
  // DOMContentLoaded so document.body exists before we append the toolbar.
  // Otherwise call immediately — the document is already interactive.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVrlToolbar);
  } else {
    initVrlToolbar();
  }
})();
