import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { documents, xdocuments, linkTypes as linkTypesApi, documentLinks as documentLinksApi } from '../../services/api';
import { useDataCache } from '../../contexts/DataCache';
import './LinkPanelForm.css';

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

// Simple right-arrow used on the "Go to the related document" button.
function GoToIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Per-spot form defaults ────────────────────────────────────────────────────

// Shape of the editable state for one annotation's link record — the value
// type of linkPropsStoreRef/baselineStoreRef (keyed by spotId) and of the
// `formState` used by LinkPropsForm. Also mirrors the fields LinkPanelForm sends
// to the backend in handleLinkPropsSave and forwards to the target document
// in handleGoToRelated's `originalSideLinkInfo`.
const DEFAULT_FORM = {
  linkTypeId:           '',
  linkSide:             'active',
  // Grammatical gender ('masculine'/'feminine') of the selected target
  // document's name, for Spanish article agreement in computedLinkText.
  // No longer user-editable — set from the target document's norm_type
  // (see handleSelectResult/normTypeInfo) whenever a document is picked.
  linkGender:           'feminine',
  articleToggle:        false,
  articleText:          '',
  articleAnchor:        '',
  underline:            false,
  targetDocumentType:   'pdf',
  linkText:             '',       // only used when linkTextUserEdited === true
  linkTextUserEdited:   false,
  selectedDocId:        null,
  selectedDocName:      null,
};

// ── Spots navigator ───────────────────────────────────────────────────────────

/**
 * SpotsNavigator — prev/next arrows + a numbered strip for jumping directly
 * to any annotation spot, plus the chevron that expands/collapses LinkPropsForm.
 *
 * Props:
 *   spots              — full spot list (only its length matters here; items
 *                         themselves are addressed by index via onNavigate).
 *   currentSpotIndex    — index of the active spot in `spots` (-1 = none).
 *   isDirty             — when true, every nav control except the current spot
 *                         is disabled — the user must resolve the dirty link
 *                         (Save/Update/Cancel) before jumping elsewhere.
 *   onNavigate(index)   — requests selecting the spot at `index`.
 *   onToggleLinkProps() — expands/collapses LinkPropsForm below this bar.
 *   linkPropsExpanded   — current expand state, used only to orient the chevron.
 *
 * When there are more than 7 spots, the strip collapses to first-3 / … / last-3
 * (navItems) instead of listing every index, keeping the toolbar a fixed width.
 */
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

/**
 * LinkPropsForm — the editable record for a single annotation spot: link
 * type, active/passive side, an optional specific-article reference, target
 * document type (pdf/html), the computed-or-edited link text, and
 * Save/Cancel/Drop/Go-to actions. The target document's grammatical gender
 * (for Spanish article agreement) is no longer edited here — it's derived
 * in the parent from the selected document's norm_type (see LinkPanelForm's
 * handleSelectResult/normTypeInfo).
 *
 * This component is purely presentational + local derivations (canSave,
 * saveLabel, isCreation) — all persistence and dirty-tracking live in the
 * parent LinkPanelForm; every field change is reported upward via `onChange`.
 *
 * Props:
 *   spotId              — id of the annotation this form edits, or null.
 *   linkDocumentId       — backend record id if this link was already saved
 *                          (creation mode when null/undefined).
 *   linkTypes            — full link-type list for the dropdown.
 *   formState             — current field values (see DEFAULT_FORM shape).
 *   displayLinkText      — computed-or-user-edited text shown in the textarea.
 *   onChange(patch)      — merge `patch` into formState (marks dirty).
 *   onArticleTextBlur()  — auto-fills the article anchor from the article text.
 *   isDirty              — whether formState OR the rectangle's position/size
 *                          differs from the saved baseline.
 *   geometryDirty        — specifically whether the rectangle's position/size
 *                          changed; shows a "Dimensions or position changed"
 *                          note. onCancel also reverts the rectangle itself.
 *   saveLinkStatus       — 'idle' | 'saving' | 'saved' | 'error', drives the
 *                          Save button's label/style.
 *   onCancel()           — update mode: restore the baseline (only when dirty).
 *   onSave()             — POST (create) or PUT (update) the link document.
 *   onDrop()             — delete the backend record (if any) and the spot.
 *   onGoToRelated()      — navigate to the target document's own editor,
 *                          carrying this link's full context with it.
 *   originalSideLinkInfo — the link record this document was reached from,
 *                          or null. When non-null AND this is a brand-new
 *                          (unsaved) link, shows "Use Source Info" next to
 *                          the title to pre-fill the reciprocal link.
 *   normTypeInfo(id)     — looks up a norm_type record (incl. gender) by id;
 *                          used by "Use Source Info" to derive the reciprocal
 *                          link's gender from the source document's own
 *                          norm_type rather than the (unrelated) gender that
 *                          was set for the original link's own target.
 */
function LinkPropsForm({
  spotId,
  linkDocumentId,
  linkTypes,
  formState,
  displayLinkText,
  onChange,
  onArticleTextBlur,
  isDirty,
  // geometryDirty: true when this spot's rectangle position/size has changed
  // since it was selected (or last saved) — see the geometryBaselines
  // tracking in the parent. Folded into `isDirty` for gating purposes there;
  // kept separate here only to show the "Dimensions or position changed" note.
  geometryDirty,
  saveLinkStatus,
  originalSideLinkInfo,
  normTypeInfo,
  onCancel,
  onSave,
  onDrop,
  onGoToRelated,
}) {
  // No annotation is currently selected (spotsNavActive/linkPropsExpanded can
  // both be true with nothing selected — e.g. right after opening the panel,
  // or after Cancel/Drop clears the selection) — collapse to a placeholder
  // instead of rendering a form with nothing meaningful to edit.
  if (!spotId) {
    return (
      <div className="vrl-link-props vrl-link-props-collapsed">
        <div className="vrl-link-props-title">Link Properties</div>
        <div className="vrl-link-props-empty">No Link selected</div>
      </div>
    );
  }

  const { linkTypeId, linkSide, articleToggle, articleText, articleAnchor, underline, targetDocumentType, selectedDocId } = formState;

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

  // "Use Source Info" only makes sense for a brand-new link (there's nothing
  // to reciprocate on an already-saved one) and only when we actually arrived
  // via a link from another document.
  const showUseSourceInfo = isCreation && !!originalSideLinkInfo;

  // Builds the reciprocal link back to the document this one was reached
  // from: same link type, the OPPOSITE side (the source was e.g. 'active', so
  // this link — described from here — is 'passive'), target document = the
  // source document, and linkTextUserEdited reset to false so displayLinkText
  // falls back to the normal computedLinkText logic (LinkPanelForm) instead of
  // copying the source's literal text.
  //
  // Gender is looked up fresh from the source document's own norm_type
  // (originalSideLinkInfo.sourceDocumentNormTypeId) rather than reusing
  // originalSideLinkInfo.linkGender, which is the gender of THAT link's own
  // target (i.e. this document, not the source document being selected here).
  const handleUseSourceInfo = () => {
    if (!originalSideLinkInfo) return;
    const sourceGender = normTypeInfo?.(originalSideLinkInfo.sourceDocumentNormTypeId)?.gender === 'M'
      ? 'masculine' : 'feminine';
    onChange({
      linkTypeId:         originalSideLinkInfo.linkTypeId,
      linkSide:           originalSideLinkInfo.linkSide === 'active' ? 'passive' : 'active',
      linkGender:         sourceGender,
      targetDocumentType: originalSideLinkInfo.targetDocumentType,
      selectedDocId:      originalSideLinkInfo.sourceDocumentId,
      selectedDocName:    originalSideLinkInfo.sourceDocumentName ?? null,
      linkTextUserEdited: false,
      linkText:           '',
    });
  };

  return (
    <div className="vrl-link-props">
      <div className="vrl-link-props-title-row">
        <div className="vrl-link-props-title">Link Properties</div>
        {showUseSourceInfo && (
          <button
            type="button"
            className="vrl-link-use-source-btn"
            onClick={handleUseSourceInfo}
          >
            Use Source Info
          </button>
        )}
      </div>
      <div className="vrl-link-props-id">{spotId ?? '—'}</div>

      {/* Shown when the rectangle has been moved/resized since it was
          selected (or last saved) — see geometryDirty in the parent. */}
      {geometryDirty && (
        <div className="vrl-link-geometry-dirty-msg">Dimensions or position changed</div>
      )}

      {/* Link type drives computedLinkText's verb (lt.active_verb / lt.name)
          and the viewMode badge color/letter for this spot. */}
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

      {/* Active side: this document is the one performing the action (e.g.
          "Deroga {other doc}"). Passive side: this document is the target of
          the action described on the other document. Persisted as link_side
          'A'/'P' in handleLinkPropsSave. */}
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

      {/* Optional: narrows the link to a specific article within the target
          document rather than the document as a whole. */}
      <label className="vrl-link-article-toggle">
        <input type="checkbox"
          checked={articleToggle}
          onChange={e => onChange({ articleToggle: e.target.checked })}
        /> Link to an specific article
      </label>

      {articleToggle && (
        <div className="vrl-link-article-fields vrl-visible">
          {/* Free-text article reference (e.g. "Artículo 5") plus a slug
              anchor auto-derived on blur (handleArticleTextBlur) unless the
              user has already typed one. */}
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

      {/* Whether the rendered link text should be underlined in the target
          document's HTML output. */}
      <label className="vrl-link-article-toggle">
        <input type="checkbox"
          checked={underline}
          onChange={e => onChange({ underline: e.target.checked })}
        /> Underline link text
      </label>

      {/* Whether the target document is served from the PDF viewer or the
          HTML document viewer — used to build the correct link href elsewhere. */}
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

      {/* Editable rendering of computedLinkText (LinkPanelForm). Typing here sets
          linkTextUserEdited=true, which freezes the text against further
          auto-computation until reset via the button below. */}
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

      {/* Read-only display of the target document's id, set by picking a
          search result in DocSearchPanel (handleSelectResult). */}
      <div className="vrl-link-doc-id-row">
        <span className="vrl-link-doc-id-label">Target ID:</span>
        <span className="vrl-link-doc-id-value">{selectedDocId ?? '—'}</span>
      </div>

      {/* Jumps to the target document's own PDF Link Editor (handleGoToRelated
          in the parent), carrying this link's context via router state.
          Disabled unless a target is selected AND the form is clean — leaving
          with unsaved edits would silently lose them. */}
      {(() => {
        const gotoDisabled = !selectedDocId || isDirty;
        return (
          <button
            type="button"
            className="vrl-link-goto-btn"
            disabled={gotoDisabled}
            onClick={onGoToRelated}
          >
            Go to the related document
            <GoToIcon />
          </button>
        );
      })()}

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

/**
 * DocSearchPanel — lets the user find and pick the link's target document.
 * Always rendered inside the link panel (independent of spotsNavActive /
 * linkPropsExpanded) since search results feed LinkPropsForm's selectedDocId
 * regardless of whether that form is currently expanded.
 *
 * All search-field state and the `onSearch`/`onSelectResult` handlers live in
 * the parent LinkPanelForm; this component is purely the inputs + results list.
 * Selecting a result calls onSelectResult(doc, name), which LinkPanelForm wires
 * to handleSelectResult → handleFormChange({ selectedDocId, selectedDocName }).
 */
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

/**
 * SaveConfirmModal — a plain yes/no overlay shown before the toolbar's
 * "Save HTML" action (distinct from a single link's Save/Update, which needs
 * no confirmation). Overwriting the saved HTML is a bigger, harder-to-undo
 * action, hence the extra confirmation step.
 */
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
 *   spots               [{ id, ... }]  — annotation spots for the navigator
 *   currentSpotIndex    number         — index into spots[] (-1 = none selected)
 *   undoEnabled         boolean
 *   sourceDocumentId    string|null    — ID of the document being edited (for link save payload)
 *   sourceDocumentName  string|null    — display name of the document being edited, if known
 *                                        (only set when this editor was opened from DocumentForm).
 *                                        Forwarded into originalSideLinkInfo so the target
 *                                        document's arrival banner can show a name instead
 *                                        of a raw id when one is available.
 *   sourceDocumentNormTypeId string|null — norm_type id of the document being edited, if
 *                                        known (same source as sourceDocumentName). Used
 *                                        directly by computedLinkText to pick the gender-
 *                                        agreeing passive verb form (this document is the
 *                                        passive subject on the passive side), and also
 *                                        forwarded into originalSideLinkInfo so the target
 *                                        document's "Use Source Info" can look up this
 *                                        document's gender when building the reciprocal link.
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
export default function LinkPanelForm({
  spots = [],
  currentSpotIndex = -1,
  undoEnabled = false,
  sourceDocumentId = null,
  sourceDocumentName = null,
  sourceDocumentNormTypeId = null,
  /**
   * originalSideLinkInfo
   *
   * The link record this document was reached from (via "Go to the related
   * document" on the OTHER document's editor) — see PdfLinkEditorPage's
   * `originalSideLinkInfo` state, which is what's passed in here. Null when
   * this editor was opened any other way.
   *
   * Used to power the "Use Source Info" button in LinkPropsForm: for a
   * brand-new (unsaved) link, it lets the user build the reciprocal link
   * back to that source document in one click instead of re-entering the
   * same link type/gender/document type by hand.
   */
  originalSideLinkInfo = null,
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
   * onSpotDataChange(spotId, displayLinkText, selectedDocId, underline)
   *
   * Optional callback fired whenever the display text, target document, or
   * underline toggle changes for the currently active spot.
   *
   * The parent (PdfLinkEditorPage) stores this in `spotDisplayData` so the
   * viewMode info panel shows the current link text and correct <a> href,
   * and the annotation rectangle's bottom border renders solid instead of
   * dashed when underline is set — all in real time, without needing a save.
   *
   * Implemented as a useEffect watching `displayLinkText`,
   * `formState.selectedDocId`, and `formState.underline`, so it fires both on
   * spot navigation (values load from the store) and on any form change that
   * updates them.
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
   * first. Reflects formState edits AND rectangle position/size changes.
   */
  onDirtyChange,
  /**
   * onRevertGeometry(pageIndex, spotId, { x, y, w, h })
   *
   * Called from Cancel when the rectangle's position/size was changed since
   * the spot was selected (or last saved). The parent (PdfLinkEditorPage)
   * applies this the same way it applies a drag/resize from AnnotationCanvas
   * itself (handleAnnotationChange), snapping the rectangle back to its
   * baseline geometry.
   */
  onRevertGeometry,
}) {
  const navigate = useNavigate();

  // normTypeInfo(normTypeId) -> full norm_type record ({ id, name, gender, ... })
  // from the app-wide DataCache (loaded via GET /norm-types?size=1000).
  const { normTypeInfo } = useDataCache();

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
  const [linkPanelOpen,     setLinkPanelOpen]     = useState(false); // collapsible panel below the main button row
  const [spotsNavActive,    setSpotsNavActive]     = useState(false); // shows SpotsNavigator inside the link panel
  const [linkPropsExpanded, setLinkPropsExpanded]  = useState(false); // shows LinkPropsForm below SpotsNavigator
  const [viewMode,          setViewMode]           = useState('spots'); // 'spots' | 'paragraphs' — reported to the parent via onViewToggle
  const [showSaveConfirm,   setShowSaveConfirm]    = useState(false); // gates the "Save HTML" action behind a confirmation modal

  // ── Per-spot form state ──────────────────────────────────────────────────
  const [formState,      setFormState]      = useState({ ...DEFAULT_FORM });
  const [isDirty,        setIsDirty]        = useState(false);
  const [saveLinkStatus, setSaveLinkStatus] = useState('idle');

  // External stores keyed by spot ID.
  const linkPropsStoreRef = useRef({}); // { [id]: formState }  — current saved values
  const baselineStoreRef  = useRef({}); // { [id]: formState }  — snapshot for cancel

  // linkDocumentIds and geometryBaselines must be state (not refs) because
  // they're read during render — the former to decide "Save link" vs "Update
  // link", the latter to compute geometryDirty below.
  const [linkDocumentIds,  setLinkDocumentIds]  = useState({});
  const [geometryBaselines, setGeometryBaselines] = useState({}); // { [id]: {x,y,w,h} }

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

  // Ref always holds the latest spots prop, so the spot-switch effect below
  // can read a spot's CURRENT position/size to capture as its geometry
  // baseline without needing `spots` in its dependency array — adding it
  // there would re-run the effect (and reset the baseline) on every
  // drag/resize tick, not just on an actual spot switch.
  const spotsRef = useRef(spots);
  useEffect(() => { spotsRef.current = spots; });

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
    if (currentSpotId) {
      baselineStoreRef.current[currentSpotId] = next;
      // Also snapshot the rectangle's current position/size as its geometry
      // baseline, so later drags/resizes of THIS spot can be detected as
      // dirty (see geometryDirty below) and reverted on Cancel.
      const spot = spotsRef.current.find(s => s.id === currentSpotId);
      if (spot) {
        const id = currentSpotId;
        setGeometryBaselines(prev => ({ ...prev, [id]: { x: spot.x, y: spot.y, w: spot.w, h: spot.h } }));
      }
    }
  }, [currentSpotId]);

  // ── Geometry dirty-check ─────────────────────────────────────────────────
  // Compares the active spot's LIVE position/size (from the `spots` prop,
  // which updates immediately as AnnotationCanvas reports drag/resize) against
  // the baseline captured above. Recomputed every render — cheap, and must
  // stay live so the "Dimensions or position changed" note and Save/Cancel
  // enablement react instantly while dragging.
  const geometryBaseline = currentSpotId ? geometryBaselines[currentSpotId] : null;
  const geometryDirty = !!(currentSpot && geometryBaseline && (
    currentSpot.x !== geometryBaseline.x ||
    currentSpot.y !== geometryBaseline.y ||
    currentSpot.w !== geometryBaseline.w ||
    currentSpot.h !== geometryBaseline.h
  ));
  // Combined dirty flag used everywhere isDirty previously gated Save/Cancel/
  // navigation — a pure position/size change must behave the same as a
  // form-field edit (block navigation, enable Update, enable Cancel).
  const effectiveDirty = isDirty || geometryDirty;

  // Whenever a spot becomes selected — from any source: clicking a
  // rectangle's move handle (editMode) or its click-to-select overlay
  // (viewMode), drawing a new annotation, the notes panel, or the spots
  // navigator — auto-expand the link panel, spots nav, and the link
  // properties form so its details are immediately visible without the user
  // having to also click the toolbar's panel/nav toggles by hand.
  //
  // Done during render (React's documented "adjusting state when a prop
  // changes" pattern) rather than in an effect, guarded by lastExpandedSpotId
  // so it only fires once per newly-selected spot — an effect here would
  // cause a one-frame flash of the still-collapsed panel before it opens.
  const [lastExpandedSpotId, setLastExpandedSpotId] = useState(null);
  if (currentSpotId && currentSpotId !== lastExpandedSpotId) {
    setLastExpandedSpotId(currentSpotId);
    setLinkPanelOpen(true);
    setSpotsNavActive(true);
    setLinkPropsExpanded(true);
  }

  // Notify the parent whenever the dirty flag changes so it can gate
  // rectangle creation / selection elsewhere on the page.
  useEffect(() => {
    onDirtyChange?.(effectiveDirty);
  }, [effectiveDirty, onDirtyChange]);

  // ── Computed link text ───────────────────────────────────────────────────
  // Auto-built from link type, side, gender, article, and selected document
  // name. Suppressed when the user has manually edited the textarea.
  const computedLinkText = useMemo(() => {
    const lt = linkTypesList.find(l => String(l.id) === String(formState.linkTypeId));
    // Active side uses the type's plain verb (e.g. "Deroga"). Passive side
    // uses the gender-agreeing passive form (e.g. "Derogado por" / "Derogada
    // por") so the sentence agrees with the gender of the document BEING
    // EDITED (the passive subject of the sentence — e.g. "Ley 123 ... es
    // derogada por ..."), not the target document referenced by the article
    // below. Falls back to active_verb/name if the passive field isn't set.
    const sourceGender = normTypeInfo(sourceDocumentNormTypeId)?.gender === 'M' ? 'masculine' : 'feminine';
    const verb = lt
      ? (formState.linkSide === 'passive'
          ? (sourceGender === 'masculine' ? lt.passive_verb_masculine : lt.passive_verb_feminine)
            || lt.active_verb || lt.name || ''
          : lt.active_verb || lt.name || '')
      : '';
    const article       = formState.linkGender === 'masculine' ? 'el' : 'la';
    const articlePhrase = (formState.articleToggle && formState.articleText.trim())
      ? ('el ' + formState.articleText.trim() + ' de') : '';
    return [
      verb,
      articlePhrase,
      formState.selectedDocName ? (article + ' {' + formState.selectedDocName + '}') : '',
    ].filter(Boolean).join(' ');
  }, [
    linkTypesList,
    formState.linkTypeId,
    formState.linkSide,
    formState.linkGender,
    formState.articleToggle,
    formState.articleText,
    formState.selectedDocName,
    sourceDocumentNormTypeId,
    normTypeInfo,
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

  // ── Notify parent of display-text / doc-id / underline changes ──────────
  // Fires whenever the computed or edited link text, target document, or
  // underline toggle changes for the active spot, OR when a different spot
  // is selected, so the parent always has the latest values for the viewMode
  // info panel and annotation rendering without waiting for a save.
  useEffect(() => {
    if (!currentSpotId) return;
    onSpotDataChange?.(currentSpotId, displayLinkText, formState.selectedDocId, formState.underline);
  }, [currentSpotId, displayLinkText, formState.selectedDocId, formState.underline, onSpotDataChange]);

  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleLinkPropsCancel = useCallback(() => {
    if (!currentSpotId) return;
    const baseline = baselineStoreRef.current[currentSpotId];
    const restored = baseline ? { ...DEFAULT_FORM, ...baseline } : { ...DEFAULT_FORM };
    setFormState(restored);
    linkPropsStoreRef.current[currentSpotId] = restored;
    setIsDirty(false);
    setSaveLinkStatus('idle');

    // Snap the rectangle back to its geometry baseline too, in case the user
    // moved/resized it without changing any other field.
    const geoBaseline = geometryBaselines[currentSpotId];
    const spot = spotsRef.current.find(s => s.id === currentSpotId);
    if (geoBaseline && spot) {
      onRevertGeometry?.(spot.pageIndex, currentSpotId, geoBaseline);
    }
  }, [currentSpotId, geometryBaselines, onRevertGeometry]);

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
    setGeometryBaselines(prev => { const n = { ...prev }; delete n[currentSpotId]; return n; });
    onDropSpot?.(currentSpotId);
  }, [currentSpotId, linkDocumentIds, onDropSpot]);

  // ── Navigate to the link's target document ────────────────────────────────
  // Opens the same PDF Link Editor route for the target document, carrying the
  // current link's full record via router state (`originalSideLinkInfo`) so
  // the destination page can read it back on landing (see PdfLinkEditorPage).
  // Only reachable when the form is clean and a target document is selected —
  // enforced by the disabled state of the "Go to the related document" button.
  //
  // formState.selectedDocName/selectedDocId alone aren't enough to label the
  // destination's header or resolve its own gender correctly: selectedDocName
  // is null for links loaded from the backend (GET /documentLinks doesn't
  // return a name, only target_document_id — see PdfLinkEditorPage's initial
  // load mapping), and we never captured the target's own norm_type_id at
  // all. So this fetches the target document's own record via GET
  // /documents/:id first, then navigates with a real name and a docItem
  // shaped the same way DocumentForm's navigation does (docItem.normTypeId),
  // so the destination page's `sourceDocumentNormTypeId` prop — and therefore
  // its own passive-verb/article gender agreement — resolves correctly too.
  const handleGoToRelated = useCallback(async () => {
    if (!currentSpotId || !formState.selectedDocId) return;

    let targetDocName = formState.selectedDocName;
    let targetDocItem = null;
    try {
      targetDocItem = await documents.get(formState.selectedDocId);
      if (!targetDocName) {
        // GET /documents/:id returns raw stored columns (normTypeId), not the
        // joined normTypeName that /xdocuments's read-optimized rows have —
        // resolve the type's display name from the norm type cache instead.
        const normTypeName = normTypeInfo(targetDocItem?.normTypeId)?.name;
        targetDocName = [normTypeName, targetDocItem?.number, targetDocItem?.year ? `/${targetDocItem.year}` : '']
          .filter(Boolean).join(' ') || null;
      }
    } catch (e) {
      console.error('Failed to fetch target document details:', e);
    }

    const originalSideLinkInfo = {
      spotId:             currentSpotId,
      linkDocumentId:     linkDocumentIds[currentSpotId] ?? null,
      sourceDocumentId,
      sourceDocumentName,
      sourceDocumentNormTypeId,
      targetDocumentId:   formState.selectedDocId,
      linkTypeId:         formState.linkTypeId,
      linkSide:           formState.linkSide,
      linkGender:         formState.linkGender,
      specificArticle:    formState.articleToggle,
      articleText:        formState.articleText,
      articleAnchor:      formState.articleAnchor,
      targetDocumentType: formState.targetDocumentType,
      linkText:           displayLinkText,
    };
    navigate(`/admin/documents/${formState.selectedDocId}/pdf-link-editor`, {
      // docId/docName/docItem are read by EditorLayout's header and by this
      // same component's sourceDocumentName/sourceDocumentNormTypeId props on
      // the destination page (see PdfLinkEditorPage's own navigate() from
      // DocumentForm for the same shape).
      state: {
        docId:   formState.selectedDocId,
        docName: targetDocName,
        docItem: targetDocItem,
        originalSideLinkInfo,
      },
    });
  }, [navigate, currentSpotId, linkDocumentIds, sourceDocumentId, sourceDocumentName, sourceDocumentNormTypeId, formState, displayLinkText, normTypeInfo]);

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
      specific_article:       formState.articleToggle,
      target_article_text:    formState.articleToggle ? (formState.articleText.trim()   || null) : null,
      target_article_anchor:  formState.articleToggle ? (formState.articleAnchor.trim() || null) : null,
      target_document_type:   formState.targetDocumentType ?? 'pdf',
      underline:              formState.underline,
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
      // Position/size was just persisted (page_xpos/ypos/width/height above)
      // too — advance its baseline the same way, or geometryDirty would keep
      // reporting "changed" against the now-stale pre-save geometry.
      if (spotData) {
        const id = currentSpotId;
        setGeometryBaselines(prev => ({ ...prev, [id]: { x: spotData.x, y: spotData.y, w: spotData.w, h: spotData.h } }));
      }
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
  // Also derives linkGender from the target document's norm_type (gender
  // moved off link_document onto norm_type) via normTypeInfo, keyed by the
  // normTypeId field on the GET /xdocuments search result.
  const handleSelectResult = useCallback((doc, name) => {
    const gender = normTypeInfo(doc.normTypeId)?.gender === 'M' ? 'masculine' : 'feminine';
    handleFormChange({ selectedDocId: doc.id, selectedDocName: name, linkGender: gender });
  }, [handleFormChange, normTypeInfo]);

  // ── Toolbar drag ─────────────────────────────────────────────────────────
  // Lets the user reposition the floating toolbar by dragging its handle.
  // Starts undocked (CSS default position); once dragged, `dragPos` overrides
  // the CSS with absolute top/left and the toolbar stays there for the rest
  // of the session (no persistence across remounts).
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
      // Clamp to the viewport (10px margin) so the toolbar can't be dragged off-screen.
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
  // Opening the spots navigator also force-opens the link panel (so the user
  // doesn't have to click twice); closing it only collapses the nav itself.
  const handleSpotsNavToggle = useCallback(() => {
    setSpotsNavActive(v => {
      if (!v) setLinkPanelOpen(true);
      return !v;
    });
  }, []);

  // Toggles between the 'spots' badge view and the 'paragraphs'/link view in
  // the parent's AnnotationCanvas rendering; reported via onViewToggle.
  const handleViewToggle = useCallback(() => {
    const next = viewMode === 'spots' ? 'paragraphs' : 'spots';
    setViewMode(next);
    onViewToggle?.(next);
  }, [viewMode, onViewToggle]);

  // Confirmed via SaveConfirmModal — only then does the parent's onSave fire.
  const handleSaveConfirm = useCallback(() => {
    setShowSaveConfirm(false);
    onSave?.();
  }, [onSave]);

  // ── Derived ──────────────────────────────────────────────────────────────
  // Once the toolbar has been dragged, pin it with absolute coordinates
  // instead of the CSS-default corner anchoring.
  const toolbarStyle = dragPos
    ? { top: dragPos.top, left: dragPos.left, right: 'auto', bottom: 'auto' }
    : undefined;

  // Backend record id for the active spot, if it was already saved — null
  // means LinkPropsForm is in creation mode (no PUT target yet).
  const currentLinkDocumentId = currentSpotId ? (linkDocumentIds[currentSpotId] ?? null) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div ref={toolbarRef} className="vrl-floating-toolbar" style={toolbarStyle}>

        {/* Main button row — always visible; toggles below expand the
            collapsible link panel underneath this row. */}
        <div className="vrl-toolbar-main-row">

          {/* Drag handle for repositioning the whole floating toolbar. */}
          <div className="vrl-toolbar-drag-handle" onMouseDown={handleDragStart}>
            <DragIcon />
          </div>

          {/* Delegated entirely to the parent — deletes whatever spot
              selection the parent currently tracks. */}
          <button
            className="vrl-toolbar-btn"
            data-tooltip="Delete spots in selection"
            onMouseDown={onDeleteSpots}
          >
            <DeleteIcon />
          </button>

          {/* Delegated to the parent's undo stack; disabled when nothing to undo. */}
          <button
            className="vrl-toolbar-btn"
            data-tooltip="Undo last anchor"
            disabled={!undoEnabled}
            onClick={onUndo}
          >
            <UndoIcon />
          </button>

          {/* Shows/hides SpotsNavigator (prev/next + numbered jump strip). */}
          <button
            className={`vrl-toolbar-btn${spotsNavActive ? ' vrl-active' : ''}`}
            data-tooltip="Spots navigation"
            onClick={handleSpotsNavToggle}
          >
            <SpotsNavIcon />
          </button>

          {/* Shows/hides the whole collapsible panel (nav + form + search). */}
          <button
            className={`vrl-toolbar-btn${linkPanelOpen ? ' vrl-active' : ''}`}
            data-tooltip="Toggle link panel"
            onClick={() => setLinkPanelOpen(v => !v)}
          >
            <LinkPanelIcon />
          </button>

          {/* Toggles the parent's annotation display between numbered "spots"
              badges and colored "link" dots (see handleViewToggle). */}
          <button
            className={`vrl-toolbar-btn${viewMode === 'paragraphs' ? ' vrl-active' : ''}`}
            data-tooltip={viewMode === 'spots' ? 'Switch to link view' : 'Switch to spots view'}
            onClick={handleViewToggle}
          >
            {viewMode === 'spots' ? <ViewSpotsIcon /> : <ViewLinksIcon />}
          </button>

          <div className="vrl-toolbar-sep" />

          {/* Opens SaveConfirmModal before calling the parent's onSave — this
              overwrites the document's saved HTML, so it's gated behind a
              confirmation rather than firing immediately. */}
          <button
            className="vrl-toolbar-btn"
            data-tooltip="Save HTML"
            onClick={() => setShowSaveConfirm(true)}
          >
            <SaveIcon />
          </button>

        </div>

        {/* Collapsible link panel — SpotsNavigator and LinkPropsForm only
            render while their own toggles are on; DocSearchPanel is always
            present here since it's needed to populate a target document
            regardless of whether the form itself is expanded. */}
        {linkPanelOpen && (
          <div className="vrl-link-panel">

            {spotsNavActive && (
              <SpotsNavigator
                spots={spots}
                currentSpotIndex={currentSpotIndex}
                isDirty={effectiveDirty}
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
                isDirty={effectiveDirty}
                geometryDirty={geometryDirty}
                saveLinkStatus={saveLinkStatus}
                onCancel={handleLinkPropsCancel}
                onSave={handleLinkPropsSave}
                onDrop={handleDropSpot}
                onGoToRelated={handleGoToRelated}
                originalSideLinkInfo={originalSideLinkInfo}
                normTypeInfo={normTypeInfo}
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
