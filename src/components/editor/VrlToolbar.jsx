import { useState, useRef, useCallback } from 'react';
import './VrlToolbar.css';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function DragIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
      <circle cx="2" cy="2" r="1.5" />
      <circle cx="2" cy="8" r="1.5" />
      <circle cx="2" cy="14" r="1.5" />
      <circle cx="8" cy="2" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="14" r="1.5" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H4" />
      <path d="M20 8l-6 6H6v-4l6-6z" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function SpotsNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v14" />
      <path d="m19 9-7 7-7-7" />
      <circle cx="12" cy="21" r="1" />
    </svg>
  );
}

function LinkPanelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H11V5h8v14z" />
    </svg>
  );
}

function ViewSpotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 10H3M21 6H3M21 14H3M17 18H3" />
    </svg>
  );
}

function ViewLinksIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// ── Spots navigator ───────────────────────────────────────────────────────────

function SpotsNavigator({ spots, currentSpotIndex, isDirty, onNavigate, onToggleLinkProps, linkPropsExpanded }) {
  const n = spots.length;

  const navItems = n <= 7
    ? Array.from({ length: n }, (_, i) => i)
    : [0, 1, 2, '…', n - 3, n - 2, n - 1];

  return (
    <div className="vrl-spots-nav">
      <div className="vrl-spots-nav-row">
        <button
          className="vrl-spots-nav-arrow"
          data-tooltip="Previous spot"
          disabled={isDirty || currentSpotIndex <= 0}
          onClick={() => onNavigate(currentSpotIndex - 1)}
        >
          ‹
        </button>

        <div className="vrl-spots-nav-list">
          {n === 0 ? (
            <span className="vrl-spots-nav-ellipsis">No spots</span>
          ) : (
            navItems.map((item, i) =>
              item === '…' ? (
                <span key={`ell-${i}`} className="vrl-spots-nav-ellipsis">…</span>
              ) : (
                <button
                  key={item}
                  className={`vrl-spots-nav-item${item === currentSpotIndex ? ' vrl-nav-current' : ''}`}
                  onClick={() => onNavigate(item)}
                >
                  {item + 1}
                </button>
              )
            )
          )}
        </div>

        <button
          className="vrl-spots-nav-arrow"
          data-tooltip="Next spot"
          disabled={isDirty || currentSpotIndex >= n - 1}
          onClick={() => onNavigate(currentSpotIndex === -1 ? 0 : currentSpotIndex + 1)}
        >
          ›
        </button>

        <div className="vrl-toolbar-sep" />

        <button
          className="vrl-spots-nav-arrow"
          data-tooltip="Link properties"
          onClick={onToggleLinkProps}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={linkPropsExpanded ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Link properties form ──────────────────────────────────────────────────────

function LinkPropsForm({
  spotId,
  linkDocumentId,
  linkTypes,
  linkTypeId, setLinkTypeId,
  linkSide, setLinkSide,
  linkGender, setLinkGender,
  articleToggle, setArticleToggle,
  articleText, setArticleText,
  articleAnchor, setArticleAnchor,
  linkText, setLinkText,
  selectedDocId,
  isDirty,
  onMarkDirty,
  onCancel,
  onSave,
  onResetLinkText,
}) {
  return (
    <div className="vrl-link-props">
      <div className="vrl-link-props-title">Link Properties</div>
      <div className="vrl-link-props-id">{spotId ?? '—'}</div>

      <select
        className="vrl-link-type-select"
        value={linkTypeId}
        onChange={e => { setLinkTypeId(e.target.value); onMarkDirty(); }}
      >
        <option value="">Select link type…</option>
        {linkTypes.map(lt => (
          <option key={lt.id} value={lt.id}>{lt.name}</option>
        ))}
      </select>

      <span className="vrl-link-text-label">Side of the link</span>
      <div className="vrl-link-side-group">
        <label className="vrl-link-side-label">
          <input
            type="radio"
            name="vrlLinkSide"
            value="active"
            checked={linkSide === 'active'}
            onChange={() => { setLinkSide('active'); onMarkDirty(); }}
          /> Active side
        </label>
        <label className="vrl-link-side-label">
          <input
            type="radio"
            name="vrlLinkSide"
            value="passive"
            checked={linkSide === 'passive'}
            onChange={() => { setLinkSide('passive'); onMarkDirty(); }}
          /> Passive side
        </label>
      </div>

      <span className="vrl-link-text-label">Document Gender</span>
      <div className="vrl-link-side-group">
        <label className="vrl-link-side-label">
          <input
            type="radio"
            name="vrlLinkGender"
            value="feminine"
            checked={linkGender === 'feminine'}
            onChange={() => { setLinkGender('feminine'); onMarkDirty(); }}
          /> Femenine
        </label>
        <label className="vrl-link-side-label">
          <input
            type="radio"
            name="vrlLinkGender"
            value="masculine"
            checked={linkGender === 'masculine'}
            onChange={() => { setLinkGender('masculine'); onMarkDirty(); }}
          /> Masculine
        </label>
      </div>

      <label className="vrl-link-article-toggle">
        <input
          type="checkbox"
          checked={articleToggle}
          onChange={e => { setArticleToggle(e.target.checked); onMarkDirty(); }}
        /> Link to an specific article
      </label>

      {articleToggle && (
        <div className="vrl-link-article-fields">
          <span className="vrl-link-text-label">Article text</span>
          <input
            className="vrl-link-article-input"
            type="text"
            placeholder="Article text…"
            value={articleText}
            onChange={e => { setArticleText(e.target.value); onMarkDirty(); }}
          />
          <span className="vrl-link-text-label">Article anchor</span>
          <input
            className="vrl-link-article-input"
            type="text"
            placeholder="Article anchor…"
            value={articleAnchor}
            onChange={e => { setArticleAnchor(e.target.value); onMarkDirty(); }}
          />
        </div>
      )}

      <span className="vrl-link-text-label">Link Text</span>
      <div className="vrl-link-text-wrapper">
        <textarea
          className="vrl-link-text-area"
          rows={2}
          value={linkText}
          onChange={e => { setLinkText(e.target.value); onMarkDirty(); }}
        />
        <button
          className="vrl-link-text-reset"
          data-tooltip="Reset to calculated value"
          onClick={onResetLinkText}
        >
          <ResetIcon />
        </button>
      </div>

      <div className="vrl-link-doc-id-row">
        <span className="vrl-link-doc-id-label">Target ID:</span>
        <span className="vrl-link-doc-id-value">{selectedDocId ?? '—'}</span>
      </div>

      <div className="vrl-link-form-actions">
        <button
          className="vrl-link-cancel-btn"
          disabled={!isDirty}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="vrl-link-save-btn"
          disabled={!spotId}
          onClick={onSave}
        >
          {linkDocumentId ? 'Update link' : 'Save link'}
        </button>
      </div>
    </div>
  );
}

// ── Document search panel ─────────────────────────────────────────────────────

function DocSearchPanel({ searchType, setSearchType, searchNumber, setSearchNumber, searchYear, setSearchYear, searchEntity, setSearchEntity, onSearch, searchResults, selectedDocId, onSelectResult }) {
  return (
    <>
      <div className="vrl-doc-search-label">Document Search</div>
      <div className="vrl-doc-search-row">
        <input
          className="vrl-doc-search-input input-type"
          type="text"
          placeholder="Type"
          value={searchType}
          onChange={e => setSearchType(e.target.value)}
        />
        <input
          className="vrl-doc-search-input input-number"
          type="text"
          placeholder="Number"
          value={searchNumber}
          onChange={e => setSearchNumber(e.target.value)}
        />
        <input
          className="vrl-doc-search-input input-year"
          type="text"
          placeholder="Year"
          value={searchYear}
          onChange={e => setSearchYear(e.target.value)}
        />
        <input
          className="vrl-doc-search-input input-entity"
          type="text"
          placeholder="Entity"
          value={searchEntity}
          onChange={e => setSearchEntity(e.target.value)}
        />
        <button className="vrl-doc-search-btn" onClick={onSearch}>
          Search Documents
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="vrl-doc-results">
          {searchResults.map((doc, i) => {
            const name = doc.documentName
              || [doc.normTypeName, doc.number, doc.year].filter(Boolean).join(' · ')
              || String(doc.id);
            return (
              <div
                key={doc.id}
                className={`vrl-doc-result-item${selectedDocId === doc.id ? ' vrl-selected' : ''}`}
                onClick={() => onSelectResult(doc, name)}
              >
                <span className="vrl-doc-result-index">{i + 1}</span>
                <span className="vrl-doc-result-body">
                  <span className="vrl-doc-result-name">{name}</span>
                  <span className="vrl-doc-result-id">{doc.id}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Save confirmation modal ───────────────────────────────────────────────────

function SaveConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="vrl-confirm-overlay">
      <div className="vrl-confirm-box">
        <div className="vrl-confirm-title">Save document</div>
        <div className="vrl-confirm-msg">This will overwrite the current saved version. Continue?</div>
        <div className="vrl-confirm-actions">
          <button className="vrl-confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className="vrl-confirm-save" onClick={onConfirm}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Main toolbar component ────────────────────────────────────────────────────

/**
 * Props:
 *   spots            [{ id, linkDocumentId? }]  — spots to navigate (scan DOM in parent)
 *   currentSpotIndex number                      — index into spots[]
 *   undoEnabled      boolean                     — enables the undo button
 *   linkTypes        [{ id, name }]              — options for link type select
 *   searchResults    [{ id, documentName?, normTypeName?, number?, year? }]
 *
 * Callback props (implement the logic in the parent):
 *   onDeleteSpots()                    — mousedown: delete spots in current selection
 *   onUndo()                           — undo last anchor
 *   onNavigate(index)                  — navigate to spot at index
 *   onSave()                           — called after save confirmation
 *   onSearch({ type, number, year, entity }) — trigger document search
 *   onSaveLinkProps(formValues)        — save / update a link document record
 *   onCancelLinkProps()                — cancel link props edits
 *   onResetLinkText()                  — reset link text to auto-computed value
 *   onViewToggle(mode)                 — 'spots' | 'paragraphs'
 */
export default function VrlToolbar({
  spots = [],
  currentSpotIndex = -1,
  undoEnabled = false,
  linkTypes = [],
  searchResults = [],
  onDeleteSpots,
  onUndo,
  onNavigate,
  onSave,
  onSearch,
  onSaveLinkProps,
  onCancelLinkProps,
  onResetLinkText,
  onViewToggle,
}) {
  // ── UI panel state ────────────────────────────────────────────────────────
  const [linkPanelOpen,    setLinkPanelOpen]    = useState(false);
  const [spotsNavActive,   setSpotsNavActive]   = useState(false);
  const [linkPropsExpanded, setLinkPropsExpanded] = useState(false);
  const [viewMode,         setViewMode]         = useState('spots');
  const [showSaveConfirm,  setShowSaveConfirm]  = useState(false);

  // ── Link props form state ─────────────────────────────────────────────────
  const [linkTypeId,    setLinkTypeId]    = useState('');
  const [linkSide,      setLinkSide]      = useState('active');
  const [linkGender,    setLinkGender]    = useState('feminine');
  const [articleToggle, setArticleToggle] = useState(false);
  const [articleText,   setArticleText]   = useState('');
  const [articleAnchor, setArticleAnchor] = useState('');
  const [linkText,      setLinkText]      = useState('');
  const [isDirty,       setIsDirty]       = useState(false);

  // ── Document search state ─────────────────────────────────────────────────
  const [searchType,   setSearchType]   = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [searchYear,   setSearchYear]   = useState('');
  const [searchEntity, setSearchEntity] = useState('');
  const [selectedDocId,   setSelectedDocId]   = useState(null);
  const [selectedDocName, setSelectedDocName] = useState(null);

  // ── Drag state ────────────────────────────────────────────────────────────
  const toolbarRef = useRef(null);
  const [dragPos, setDragPos] = useState(null); // null = use CSS default (top:20, right:20)
  const drag = useRef({ active: false, startX: 0, startY: 0, initLeft: 0, initTop: 0 });

  const handleDragStart = useCallback((e) => {
    const rect = toolbarRef.current.getBoundingClientRect();
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, initLeft: rect.left, initTop: rect.top };

    const onMove = (ev) => {
      if (!drag.current.active) return;
      const { startX, startY, initLeft, initTop } = drag.current;
      const el = toolbarRef.current;
      const newLeft = Math.max(10, Math.min(initLeft + (ev.clientX - startX), window.innerWidth  - el.offsetWidth  - 10));
      const newTop  = Math.max(10, Math.min(initTop  + (ev.clientY - startY), window.innerHeight - el.offsetHeight - 10));
      setDragPos({ left: newLeft, top: newTop });
    };
    const onUp = () => {
      drag.current.active = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    setDragPos({ left: rect.left, top: rect.top });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  }, []);

  // ── Panel toggles ─────────────────────────────────────────────────────────
  const handleSpotsNavToggle = useCallback(() => {
    setSpotsNavActive(v => {
      if (!v) setLinkPanelOpen(true);
      return !v;
    });
  }, []);

  const handlePanelToggle = useCallback(() => {
    setLinkPanelOpen(v => !v);
  }, []);

  const handleViewToggle = useCallback(() => {
    const next = viewMode === 'spots' ? 'paragraphs' : 'spots';
    setViewMode(next);
    onViewToggle?.(next);
  }, [viewMode, onViewToggle]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSaveConfirm = useCallback(() => {
    setShowSaveConfirm(false);
    onSave?.();
  }, [onSave]);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    onSearch?.({ type: searchType, number: searchNumber, year: searchYear, entity: searchEntity });
  }, [onSearch, searchType, searchNumber, searchYear, searchEntity]);

  const handleSelectResult = useCallback((doc, name) => {
    setSelectedDocId(doc.id);
    setSelectedDocName(name);
    setIsDirty(true);
  }, []);

  // ── Link props ────────────────────────────────────────────────────────────
  const markDirty = useCallback(() => setIsDirty(true), []);

  const handleLinkPropsCancel = useCallback(() => {
    setIsDirty(false);
    onCancelLinkProps?.();
  }, [onCancelLinkProps]);

  const handleLinkPropsSave = useCallback(() => {
    onSaveLinkProps?.({
      linkTypeId, linkSide, linkGender,
      articleToggle, articleText, articleAnchor,
      linkText, selectedDocId, selectedDocName,
    });
  }, [onSaveLinkProps, linkTypeId, linkSide, linkGender, articleToggle, articleText, articleAnchor, linkText, selectedDocId, selectedDocName]);

  const handleResetLinkText = useCallback(() => {
    onResetLinkText?.();
  }, [onResetLinkText]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentSpot = currentSpotIndex >= 0 && currentSpotIndex < spots.length
    ? spots[currentSpotIndex]
    : null;

  const toolbarStyle = dragPos
    ? { top: dragPos.top, left: dragPos.left, right: 'auto', bottom: 'auto' }
    : undefined;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div ref={toolbarRef} className="vrl-floating-toolbar" style={toolbarStyle}>

        {/* Main button row */}
        <div className="vrl-toolbar-main-row">

          <div className="vrl-toolbar-drag-handle" onMouseDown={handleDragStart}>
            <DragIcon />
          </div>

          <button
            className="vrl-toolbar-btn"
            data-tooltip="Delete spots in selection"
            onMouseDown={onDeleteSpots}
          >
            <DeleteIcon />
          </button>

          <button
            className="vrl-toolbar-btn"
            data-tooltip="Undo last anchor"
            disabled={!undoEnabled}
            onClick={onUndo}
          >
            <UndoIcon />
          </button>

          <button
            className={`vrl-toolbar-btn${spotsNavActive ? ' vrl-active' : ''}`}
            data-tooltip="Spots navigation"
            onClick={handleSpotsNavToggle}
          >
            <SpotsNavIcon />
          </button>

          <button
            className={`vrl-toolbar-btn${linkPanelOpen ? ' vrl-active' : ''}`}
            data-tooltip="Toggle link panel"
            onClick={handlePanelToggle}
          >
            <LinkPanelIcon />
          </button>

          <button
            className={`vrl-toolbar-btn${viewMode === 'paragraphs' ? ' vrl-active' : ''}`}
            data-tooltip={viewMode === 'spots' ? 'Switch to link view' : 'Switch to spots view'}
            onClick={handleViewToggle}
          >
            {viewMode === 'spots' ? <ViewSpotsIcon /> : <ViewLinksIcon />}
          </button>

          <div className="vrl-toolbar-sep" />

          <button
            className="vrl-toolbar-btn"
            data-tooltip="Save HTML"
            onClick={() => setShowSaveConfirm(true)}
          >
            <SaveIcon />
          </button>

        </div>

        {/* Collapsible link panel */}
        {linkPanelOpen && (
          <div className="vrl-link-panel">

            {spotsNavActive && (
              <SpotsNavigator
                spots={spots}
                currentSpotIndex={currentSpotIndex}
                isDirty={isDirty}
                linkPropsExpanded={linkPropsExpanded}
                onNavigate={onNavigate ?? (() => {})}
                onToggleLinkProps={() => setLinkPropsExpanded(v => !v)}
              />
            )}

            {spotsNavActive && linkPropsExpanded && (
              <LinkPropsForm
                spotId={currentSpot?.id ?? null}
                linkDocumentId={currentSpot?.linkDocumentId ?? null}
                linkTypes={linkTypes}
                linkTypeId={linkTypeId}       setLinkTypeId={setLinkTypeId}
                linkSide={linkSide}           setLinkSide={setLinkSide}
                linkGender={linkGender}       setLinkGender={setLinkGender}
                articleToggle={articleToggle} setArticleToggle={setArticleToggle}
                articleText={articleText}     setArticleText={setArticleText}
                articleAnchor={articleAnchor} setArticleAnchor={setArticleAnchor}
                linkText={linkText}           setLinkText={setLinkText}
                selectedDocId={selectedDocId}
                isDirty={isDirty}
                onMarkDirty={markDirty}
                onCancel={handleLinkPropsCancel}
                onSave={handleLinkPropsSave}
                onResetLinkText={handleResetLinkText}
              />
            )}

            <DocSearchPanel
              searchType={searchType}     setSearchType={setSearchType}
              searchNumber={searchNumber} setSearchNumber={setSearchNumber}
              searchYear={searchYear}     setSearchYear={setSearchYear}
              searchEntity={searchEntity} setSearchEntity={setSearchEntity}
              onSearch={handleSearch}
              searchResults={searchResults}
              selectedDocId={selectedDocId}
              onSelectResult={handleSelectResult}
            />

          </div>
        )}

      </div>

      {showSaveConfirm && (
        <SaveConfirmModal
          onCancel={() => setShowSaveConfirm(false)}
          onConfirm={handleSaveConfirm}
        />
      )}
    </>
  );
}
