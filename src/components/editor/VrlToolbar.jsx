import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { xdocuments, linkTypes as linkTypesApi, documentLinks as documentLinksApi } from '../../services/api';
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

// ── Per-spot form defaults ────────────────────────────────────────────────────

const DEFAULT_FORM = {
  linkTypeId:           '',
  linkSide:             'active',
  linkGender:           'feminine',
  articleToggle:        false,
  articleText:          '',
  articleAnchor:        '',
  targetDocumentType:   'pdf',
  linkText:             '',       // only used when linkTextUserEdited === true
  linkTextUserEdited:   false,
  selectedDocId:        null,
  selectedDocName:      null,
};

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
                  disabled={isDirty && item !== currentSpotIndex}
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
  formState,
  displayLinkText,
  onChange,
  onArticleTextBlur,
  isDirty,
  saveLinkStatus,
  onCancel,
  onSave,
  onDrop,
}) {
  const { linkTypeId, linkSide, linkGender, articleToggle, articleText, articleAnchor, targetDocumentType, selectedDocId } = formState;

  // Save is only valid when both a link type and non-empty link text are present.
  const canSave = !!linkTypeId && !!displayLinkText.trim();

  const saveLabel =
    saveLinkStatus === 'saving' ? 'Saving…'
    : saveLinkStatus === 'saved'  ? 'Saved ✓'
    : saveLinkStatus === 'error'  ? 'Error — retry'
    : linkDocumentId              ? 'Update link'
    : 'Save link';

  // In creation mode (no backend record yet) Cancel always removes the annotation.
  // In update mode Cancel restores the baseline and is only active when dirty.
  const isCreation     = !linkDocumentId;
  const handleCancel   = isCreation ? onDrop : onCancel;
  const cancelDisabled = isCreation ? false : !isDirty;

  return (
    <div className="vrl-link-props">
      <div className="vrl-link-props-title">Link Properties</div>
      <div className="vrl-link-props-id">{spotId ?? '—'}</div>

      <select
        className="vrl-link-type-select"
        value={linkTypeId}
        onChange={e => onChange({ linkTypeId: e.target.value })}
      >
        <option value="">Select link type…</option>
        {linkTypes.map(lt => (
          <option key={lt.id} value={lt.id}>{lt.name || lt.label || String(lt.id)}</option>
        ))}
      </select>

      <span className="vrl-link-text-label">Side of the link</span>
      <div className="vrl-link-side-group">
        <label className="vrl-link-side-label">
          <input type="radio" name="vrlLinkSide" value="active"
            checked={linkSide === 'active'}
            onChange={() => onChange({ linkSide: 'active' })}
          /> Active side
        </label>
        <label className="vrl-link-side-label">
          <input type="radio" name="vrlLinkSide" value="passive"
            checked={linkSide === 'passive'}
            onChange={() => onChange({ linkSide: 'passive' })}
          /> Passive side
        </label>
      </div>

      <span className="vrl-link-text-label">Document Gender</span>
      <div className="vrl-link-side-group">
        <label className="vrl-link-side-label">
          <input type="radio" name="vrlLinkGender" value="feminine"
            checked={linkGender === 'feminine'}
            onChange={() => onChange({ linkGender: 'feminine' })}
          /> Femenine
        </label>
        <label className="vrl-link-side-label">
          <input type="radio" name="vrlLinkGender" value="masculine"
            checked={linkGender === 'masculine'}
            onChange={() => onChange({ linkGender: 'masculine' })}
          /> Masculine
        </label>
      </div>

      <label className="vrl-link-article-toggle">
        <input type="checkbox"
          checked={articleToggle}
          onChange={e => onChange({ articleToggle: e.target.checked })}
        /> Link to an specific article
      </label>

      {articleToggle && (
        <div className="vrl-link-article-fields vrl-visible">
          <span className="vrl-link-text-label">Article text</span>
          <input
            className="vrl-link-article-input"
            type="text"
            placeholder="Article text…"
            value={articleText}
            onChange={e => onChange({ articleText: e.target.value })}
            onBlur={onArticleTextBlur}
          />
          <span className="vrl-link-text-label">Article anchor</span>
          <input
            className="vrl-link-article-input"
            type="text"
            placeholder="Article anchor…"
            value={articleAnchor}
            onChange={e => onChange({ articleAnchor: e.target.value })}
          />
        </div>
      )}

      <span className="vrl-link-text-label">Target Document Type</span>
      <div className="vrl-link-side-group">
        {['pdf', 'html'].map(type => (
          <label key={type} className="vrl-link-side-label">
            <input
              type="radio"
              name={`targetDocumentType-${spotId}`}
              value={type}
              checked={targetDocumentType === type}
              onChange={() => onChange({ targetDocumentType: type })}
            />
            {type.toUpperCase()}
          </label>
        ))}
      </div>

      <span className="vrl-link-text-label">Link Text</span>
      <div className="vrl-link-text-wrapper">
        <textarea
          className="vrl-link-text-area"
          rows={2}
          value={displayLinkText}
          onChange={e => onChange({ linkText: e.target.value, linkTextUserEdited: true })}
        />
        <button
          className="vrl-link-text-reset"
          data-tooltip="Reset to calculated text"
          onClick={() => onChange({ linkTextUserEdited: false, linkText: '' })}
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
          disabled={cancelDisabled}
          onClick={handleCancel}
        >
          Cancel
        </button>

        {!isCreation && !canSave ? (
          /* Update mode + invalid form — replace save button with red Drop link */
          <button className="vrl-link-drop-btn" onClick={onDrop}>
            Drop link
          </button>
        ) : (
          /* Creation mode (always) or update mode with valid form — show Save/Update.
             In update mode also requires isDirty; in creation mode isDirty is not relevant. */
          <button
            className={`vrl-link-save-btn${saveLinkStatus === 'saved' ? ' vrl-saved' : saveLinkStatus === 'error' ? ' vrl-error' : ''}`}
            disabled={!canSave || !spotId || saveLinkStatus === 'saving' || (!isCreation && !isDirty)}
            onClick={onSave}
          >
            {saveLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Document search panel ─────────────────────────────────────────────────────

function DocSearchPanel({
  searchType, setSearchType,
  searchNumber, setSearchNumber,
  searchYear, setSearchYear,
  searchEntity, setSearchEntity,
  onSearch, searchStatus, searchResults,
  selectedDocId, onSelectResult,
}) {
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
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <input
          className="vrl-doc-search-input input-number"
          type="text"
          placeholder="Number"
          value={searchNumber}
          onChange={e => setSearchNumber(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <input
          className="vrl-doc-search-input input-year"
          type="text"
          placeholder="Year"
          value={searchYear}
          onChange={e => setSearchYear(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <input
          className="vrl-doc-search-input input-entity"
          type="text"
          placeholder="Entity"
          value={searchEntity}
          onChange={e => setSearchEntity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />
        <button className="vrl-doc-search-btn" onClick={onSearch} disabled={searchStatus === 'loading'}>
          {searchStatus === 'loading' ? 'Searching…' : 'Search Documents'}
        </button>
      </div>

      {searchStatus === 'loading' && (
        <div className="vrl-doc-results">
          <div className="vrl-doc-results-msg">Searching…</div>
        </div>
      )}

      {searchStatus === 'empty' && (
        <div className="vrl-doc-results">
          <div className="vrl-doc-results-msg">No documents found.</div>
        </div>
      )}

      {searchStatus === 'done' && searchResults.length > 0 && (
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
 *   spots             [{ id, ... }]  — annotation spots for the navigator
 *   currentSpotIndex  number         — index into spots[] (-1 = none selected)
 *   undoEnabled       boolean
 *   sourceDocumentId  string|null    — ID of the document being edited (for link save payload)
 *
 * Callback props (implement the logic in the parent):
 *   onDeleteSpots()           — mousedown: delete spots in current selection
 *   onUndo()                  — undo last anchor
 *   onNavigate(index)         — navigate to spot at index
 *   onSave()                  — called after save confirmation
 *   onViewToggle(mode)        — 'spots' | 'paragraphs'
 *
 * Link types are fetched internally from GET /link-types.
 * Link document save/update is handled internally via POST/PUT /documentLink.
 * Per-spot form state is maintained internally with save/cancel/baseline semantics.
 */
export default function VrlToolbar({
  spots = [],
  currentSpotIndex = -1,
  undoEnabled = false,
  sourceDocumentId = null,
  // Pre-seeded from GET /documentLinks: [{ spotId, linkDocumentId, formState }]
  initialLinkData = [],
  onDeleteSpots,
  onUndo,
  onNavigate,
  onSave,
  onViewToggle,
  /**
   * onSpotLinkTypeChange(spotId, linkTypeId)
   *
   * Optional callback fired whenever the user selects a different link type
   * from the dropdown for the currently active annotation spot.
   *
   * The parent (PdfLinkEditorPage) uses this to keep its `spotLinkTypes` map
   * up to date so that viewMode badge colors reflect the current selection in
   * real time — before the user clicks "Save link" and the change is persisted.
   *
   * Only called when `linkTypeId` is part of the form patch, not on every
   * field change, to avoid unnecessary state updates in the parent.
   */
  onSpotLinkTypeChange,
  /**
   * onSpotDataChange(spotId, displayLinkText, selectedDocId)
   *
   * Optional callback fired whenever the display text or target document
   * changes for the currently active spot.
   *
   * The parent (PdfLinkEditorPage) stores this in `spotDisplayData` so the
   * viewMode info panel shows the current link text and correct <a> href
   * in real time — again, without needing a save.
   *
   * Implemented as a useEffect watching `displayLinkText` and
   * `formState.selectedDocId`, so it fires both on spot navigation (text
   * loads from the store) and on any form change that updates the derived text.
   */
  onSpotDataChange,
  /**
   * onDropSpot(spotId)
   *
   * Called when the user clicks "Drop link" (update mode, form invalid) or
   * Cancel (creation mode, form invalid).  The parent removes the annotation
   * rectangle and its associated state for `spotId`.
   */
  onDropSpot,
  /**
   * onDirtyChange(isDirty)
   *
   * Optional callback fired whenever the current spot's dirty state changes.
   * The parent (PdfLinkEditorPage) uses this to block creating a new
   * annotation rectangle or selecting a different one while there are
   * unsaved changes on the active link — the user must Save/Update/Cancel
   * first.
   */
  onDirtyChange,
}) {
  // ── Link types (fetched once on mount) ───────────────────────────────────
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

  // ── UI panel state ───────────────────────────────────────────────────────
  const [linkPanelOpen,     setLinkPanelOpen]     = useState(false);
  const [spotsNavActive,    setSpotsNavActive]     = useState(false);
  const [linkPropsExpanded, setLinkPropsExpanded]  = useState(false);
  const [viewMode,          setViewMode]           = useState('spots');
  const [showSaveConfirm,   setShowSaveConfirm]    = useState(false);

  // ── Per-spot form state ──────────────────────────────────────────────────
  const [formState,      setFormState]      = useState({ ...DEFAULT_FORM });
  const [isDirty,        setIsDirty]        = useState(false);
  const [saveLinkStatus, setSaveLinkStatus] = useState('idle');

  // External stores keyed by spot ID.
  const linkPropsStoreRef = useRef({}); // { [id]: formState }  — current saved values
  const baselineStoreRef  = useRef({}); // { [id]: formState }  — snapshot for cancel

  // linkDocumentIds must be state (not a ref) because it is read during render
  // to decide "Save link" vs "Update link".
  const [linkDocumentIds, setLinkDocumentIds] = useState({});

  // Seed per-spot stores from pre-loaded document links (runs once on mount /
  // whenever the parent finishes the GET /documentLinks fetch).
  useEffect(() => {
    if (!initialLinkData.length) return;
    const newIds = {};
    initialLinkData.forEach(({ spotId, linkDocumentId, formState: fs }) => {
      const seeded = { ...DEFAULT_FORM, ...fs };
      linkPropsStoreRef.current[spotId] = seeded;
      baselineStoreRef.current[spotId]  = seeded;
      if (linkDocumentId) newIds[spotId] = linkDocumentId;
    });
    if (Object.keys(newIds).length) {
      setLinkDocumentIds(prev => ({ ...prev, ...newIds }));
    }
  }, [initialLinkData]);

  // Ref always holds the latest formState so the navigation effect can read it
  // without stale-closure issues. Updated synchronously before the nav effect below.
  const latestFormRef = useRef(formState);
  useEffect(() => { latestFormRef.current = formState; });

  // ── Spot navigation: sync form state when the selected spot changes ───────
  const prevSpotIdRef = useRef(null);
  const currentSpot   = currentSpotIndex >= 0 && currentSpotIndex < spots.length
    ? spots[currentSpotIndex] : null;
  const currentSpotId = currentSpot?.id ?? null;

  useEffect(() => {
    const prevId = prevSpotIdRef.current;
    if (currentSpotId === prevId) return;

    // Persist form state for the spot we're leaving.
    if (prevId !== null) {
      linkPropsStoreRef.current[prevId] = latestFormRef.current;
    }
    prevSpotIdRef.current = currentSpotId;

    // Load stored state for the newly selected spot, or reset to defaults.
    const saved   = currentSpotId ? (linkPropsStoreRef.current[currentSpotId] ?? null) : null;
    const next    = saved ? { ...DEFAULT_FORM, ...saved } : { ...DEFAULT_FORM };
    setFormState(next);
    setIsDirty(false);
    setSaveLinkStatus('idle');

    // Record this as the baseline so cancel can restore to it.
    if (currentSpotId) baselineStoreRef.current[currentSpotId] = next;
  }, [currentSpotId]);

  // Notify the parent whenever the dirty flag changes so it can gate
  // rectangle creation / selection elsewhere on the page.
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // ── Computed link text ───────────────────────────────────────────────────
  // Auto-built from link type, gender, article, and selected document name.
  // Suppressed when the user has manually edited the textarea.
  const computedLinkText = useMemo(() => {
    const lt = linkTypesList.find(l => String(l.id) === String(formState.linkTypeId));
    const activeVerb    = lt ? (lt.active_verb || lt.name || '') : '';
    const article       = formState.linkGender === 'masculine' ? 'el' : 'la';
    const articlePhrase = (formState.articleToggle && formState.articleText.trim())
      ? ('el ' + formState.articleText.trim() + ' de') : '';
    return [
      activeVerb,
      articlePhrase,
      formState.selectedDocName ? (article + ' {' + formState.selectedDocName + '}') : '',
    ].filter(Boolean).join(' ');
  }, [
    linkTypesList,
    formState.linkTypeId,
    formState.linkGender,
    formState.articleToggle,
    formState.articleText,
    formState.selectedDocName,
  ]);

  // What's actually displayed in the textarea.
  const displayLinkText = formState.linkTextUserEdited ? formState.linkText : computedLinkText;

  // ── Form field change handler ────────────────────────────────────────────
  const handleFormChange = useCallback((patch) => {
    setFormState(prev => {
      const next = { ...prev, ...patch };
      // Immediately persist to the store so navigating away and back restores changes.
      if (currentSpotId) linkPropsStoreRef.current[currentSpotId] = next;
      return next;
    });
    setIsDirty(true);
    // Notify the parent whenever the link type changes so it can update the
    // viewMode badge color immediately — only fires for linkTypeId patches
    // to avoid triggering a parent re-render on every keystroke in other fields.
    if ('linkTypeId' in patch && currentSpotId) {
      onSpotLinkTypeChange?.(currentSpotId, patch.linkTypeId);
    }
  }, [currentSpotId, onSpotLinkTypeChange]);

  // Article text blur: auto-fill anchor from slugified text when anchor is empty.
  const handleArticleTextBlur = useCallback(() => {
    setFormState(prev => {
      if (prev.articleAnchor.trim()) return prev;
      const anchor = prev.articleText.trim().toLowerCase().replace(/\s+/g, '-');
      const next = { ...prev, articleAnchor: anchor };
      if (currentSpotId) linkPropsStoreRef.current[currentSpotId] = next;
      return next;
    });
  }, [currentSpotId]);

  // ── Notify parent of display-text / doc-id changes ──────────────────────
  // Fires whenever the computed or edited link text changes for the active spot,
  // OR when a different spot is selected, so the parent always has the latest
  // text for the viewMode info panel without waiting for a save.
  useEffect(() => {
    if (!currentSpotId) return;
    onSpotDataChange?.(currentSpotId, displayLinkText, formState.selectedDocId);
  }, [currentSpotId, displayLinkText, formState.selectedDocId, onSpotDataChange]);

  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleLinkPropsCancel = useCallback(() => {
    if (!currentSpotId) return;
    const baseline = baselineStoreRef.current[currentSpotId];
    const restored = baseline ? { ...DEFAULT_FORM, ...baseline } : { ...DEFAULT_FORM };
    setFormState(restored);
    linkPropsStoreRef.current[currentSpotId] = restored;
    setIsDirty(false);
    setSaveLinkStatus('idle');
  }, [currentSpotId]);

  // ── Drop spot (delete annotation + backend record) ───────────────────────
  // Called from "Drop link" (update mode) or Cancel (creation mode).
  // Removes the per-spot store entries so nothing leaks if a new spot is later
  // created with the same ID (not expected, but defensive).
  const handleDropSpot = useCallback(async () => {
    if (!currentSpotId) return;
    const linkDocId = linkDocumentIds[currentSpotId];
    if (linkDocId) {
      try { await documentLinksApi.delete(linkDocId); } catch (e) { console.error('Drop link failed:', e); }
      setLinkDocumentIds(prev => { const n = { ...prev }; delete n[currentSpotId]; return n; });
    }
    delete linkPropsStoreRef.current[currentSpotId];
    delete baselineStoreRef.current[currentSpotId];
    onDropSpot?.(currentSpotId);
  }, [currentSpotId, linkDocumentIds, onDropSpot]);

  // ── Save / update link document ──────────────────────────────────────────
  const handleLinkPropsSave = useCallback(async () => {
    if (!currentSpotId) return;
    const existingLinkDocId = linkDocumentIds[currentSpotId] ?? null;
    setSaveLinkStatus('saving');

    // Look up the annotation's current position from the sorted spots array.
    const spotData = spots.find(s => s.id === currentSpotId);

    // Fields shared by both POST and PUT.
    const sharedPayload = {
      source_document_id:     sourceDocumentId,
      target_document_id:     formState.selectedDocId,
      link_type_id:           formState.linkTypeId    || null,
      link_side:              formState.linkSide       === 'active'    ? 'A' : 'P',
      target_document_gender: formState.linkGender     === 'masculine' ? 'M' : 'F',
      specific_article:       formState.articleToggle,
      target_article_text:    formState.articleToggle ? (formState.articleText.trim()   || null) : null,
      target_article_anchor:  formState.articleToggle ? (formState.articleAnchor.trim() || null) : null,
      target_document_type:   formState.targetDocumentType ?? 'pdf',
      link_text:              displayLinkText.trim() || null,
      page:        spotData?.pageIndex ?? null,
      page_xpos:   spotData?.x        ?? null,
      page_ypos:   spotData?.y        ?? null,
      page_width:  spotData?.w        ?? null,
      page_height: spotData?.h        ?? null,
    };

    try {
      const data = existingLinkDocId
        // PUT: id is in the URL, not the body.
        ? await documentLinksApi.update(existingLinkDocId, sharedPayload)
        // POST: id goes in the body so the server stores the annotation UUID.
        : await documentLinksApi.create({ id: currentSpotId, ...sharedPayload });

      if (!existingLinkDocId && data?.id) {
        setLinkDocumentIds(prev => ({ ...prev, [currentSpotId]: data.id }));
      }
      // Advance baseline so a subsequent cancel restores to this saved state.
      baselineStoreRef.current[currentSpotId] = { ...formState };
      setIsDirty(false);
      setSaveLinkStatus('saved');
      setTimeout(() => setSaveLinkStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save link document:', err);
      setSaveLinkStatus('error');
      setTimeout(() => setSaveLinkStatus('idle'), 2000);
    }
  }, [currentSpotId, linkDocumentIds, sourceDocumentId, formState, displayLinkText, spots]);

  // ── Document search ──────────────────────────────────────────────────────
  const [searchType,    setSearchType]    = useState('');
  const [searchNumber,  setSearchNumber]  = useState('');
  const [searchYear,    setSearchYear]    = useState('');
  const [searchEntity,  setSearchEntity]  = useState('');
  const [searchStatus,  setSearchStatus]  = useState('idle');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = useCallback(async () => {
    setSearchStatus('loading');
    setSearchResults([]);
    const searchText = [searchType, searchNumber, searchYear, searchEntity].filter(Boolean).join(' ');
    const params = { page: 1, size: 20 };
    if (searchText)   params.searchText     = searchText;
    if (searchNumber) params.documentNumber = searchNumber;
    try {
      const data = await xdocuments.list(params);
      const docs = data?.data ?? [];
      setSearchResults(docs);
      setSearchStatus(docs.length ? 'done' : 'empty');
    } catch {
      setSearchResults([]);
      setSearchStatus('empty');
    }
  }, [searchType, searchNumber, searchYear, searchEntity]);

  // Selecting a result updates the form (selectedDocId/Name) and marks dirty.
  const handleSelectResult = useCallback((doc, name) => {
    handleFormChange({ selectedDocId: doc.id, selectedDocName: name });
  }, [handleFormChange]);

  // ── Toolbar drag ─────────────────────────────────────────────────────────
  const toolbarRef = useRef(null);
  const [dragPos,  setDragPos]  = useState(null);
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
      document.removeEventListener('mouseup',   onUp);
    };

    setDragPos({ left: rect.left, top: rect.top });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    e.preventDefault();
  }, []);

  // ── Panel toggles ────────────────────────────────────────────────────────
  const handleSpotsNavToggle = useCallback(() => {
    setSpotsNavActive(v => {
      if (!v) setLinkPanelOpen(true);
      return !v;
    });
  }, []);

  const handleViewToggle = useCallback(() => {
    const next = viewMode === 'spots' ? 'paragraphs' : 'spots';
    setViewMode(next);
    onViewToggle?.(next);
  }, [viewMode, onViewToggle]);

  const handleSaveConfirm = useCallback(() => {
    setShowSaveConfirm(false);
    onSave?.();
  }, [onSave]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const toolbarStyle = dragPos
    ? { top: dragPos.top, left: dragPos.left, right: 'auto', bottom: 'auto' }
    : undefined;

  const currentLinkDocumentId = currentSpotId ? (linkDocumentIds[currentSpotId] ?? null) : null;

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
            onClick={() => setLinkPanelOpen(v => !v)}
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
                linkDocumentId={currentLinkDocumentId}
                linkTypes={linkTypesList}
                formState={formState}
                displayLinkText={displayLinkText}
                onChange={handleFormChange}
                onArticleTextBlur={handleArticleTextBlur}
                isDirty={isDirty}
                saveLinkStatus={saveLinkStatus}
                onCancel={handleLinkPropsCancel}
                onSave={handleLinkPropsSave}
                onDrop={handleDropSpot}
              />
            )}

            <DocSearchPanel
              searchType={searchType}     setSearchType={setSearchType}
              searchNumber={searchNumber} setSearchNumber={setSearchNumber}
              searchYear={searchYear}     setSearchYear={setSearchYear}
              searchEntity={searchEntity} setSearchEntity={setSearchEntity}
              onSearch={handleSearch}
              searchStatus={searchStatus}
              searchResults={searchResults}
              selectedDocId={formState.selectedDocId}
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
