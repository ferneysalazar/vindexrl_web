# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

### Added
- **PDF Link Editor route** (`/admin/documents/:docId/pdf-link-editor`) — full-screen page with its own `EditorLayout` (no sidebar or admin chrome). Opened from the document admin form via the `linkConfiguration` icon button (edit mode only). Closing the editor returns to `/admin/documents` and automatically reopens the form for the same document using `location.state.restoreItem`.
- **EditorLayout** (`src/layouts/EditorLayout.jsx`) — minimal dark header showing the Logo, document name, and an X close button. Registered as a sibling of `AdminLayout` in `App.jsx` so it gets a completely independent layout tree.
- **PdfLinkEditorPage** (`src/pages/admin/documents/PdfLinkEditorPage.jsx`) — two-panel viewer:
  - **Strip** (130 px): vertically scrollable thumbnail sidebar. Each slot is 110 px wide with 10 px padding (A4 aspect ratio). Clicking any thumbnail — even before its image has loaded — smooth-scrolls the viewer to the matching page card.
  - **Viewer**: full-width scrollable area (`rgb(250, 249, 245)` background) with white A4 page cards. Toolbar with a go-back button (`I.goBack`) and three zoom levels (100 % / 120 % / 150 %).
- **Page-count driven rendering** — on open the editor calls `rasterDocs.get(docId)` to retrieve `total_pages`, then builds exactly that many placeholder slots in both Strip and Viewer before fetching any images.
- **Viewer high-res lazy loading** — same LIFO + debounce algorithm as the strip but scoped to the viewer scroll container and fetching `high` resolution images. First `INITIAL_LOAD` (5) pages are loaded eagerly; remaining pages load after 1 second of viewer idle time with the most-recently-visible page loading first.
- **Strip ↔ Viewer scroll sync** — an IntersectionObserver on the viewer scroll container tracks which page cards are visible. While sync is active, the strip automatically scrolls (`scrollIntoView block:'nearest'`) to keep the topmost visible viewer page's thumbnail in view. Sync is **paused** on `pointerdown` on the strip (user takes manual control) and **resumed** on viewer scroll or viewer click.
- **Progressive thumbnail loading** — only the first 5 pages (`INITIAL_LOAD = 5`) are fetched eagerly on open. Remaining pages load lazily via an `IntersectionObserver` + LIFO debounce strategy:
  - The observer (root = aside strip panel) watches which thumbnail slots enter or leave the visible area.
  - Slots entering view are pushed onto a LIFO stack; slots that scroll away before the timer fires are removed, so only pages the user actually pauses on get fetched.
  - A 1-second idle debounce (`IDLE_DELAY_MS`) resets on every strip scroll and keydown event — loading never starts while the user is actively navigating.
  - When the timer fires, the stack is flushed: pages are popped in LIFO order (most recently visible first) and fetched in parallel.
  - `loadingSet` prevents duplicate in-flight requests; `loadedSet` guards enqueue checks; loaded slots are immediately unobserved.
- **Raster service layer** (`src/services/api.js`):
  - `BASE_RASTER` — base URL for the raster service (currently `http://localhost:3001/api/`).
  - `RASTER_RES` — exported constant array `['low', 'medium', 'high']` for resolution options.
  - `rasterDocs.get(docId)` — fetches document metadata (status, `total_pages`, timestamps).
  - `rasterPages.url(docId, page, res)` — returns the endpoint URL string for direct `<img src>` use.
  - `rasterPages.get(docId, page, res)` — fetches and returns a blob URL; caches the raw `Blob` in a module-level `Map` keyed as `docId:page:res` so repeated requests skip the network. Callers revoke their blob URL on unmount; the cached `Blob` survives and is reused.

- **Link types cache** — `GET /link-types` is fetched on toolbar script load and stored in a `Map` keyed by id for O(1) lookup; available to all toolbar functions as a shared in-scope reference.
- **Link Properties form** inside the spots navigator: spot UUID label (subtle monospace, synced on every navigation step) and a full-width link type `<select>` populated from the cached `linkTypesMap` on expand; previous selection is preserved across open/close cycles.
- **Expand/collapse toggle** on the spots navigator — chevron button (arrowDn/arrowUp) placed beside the next-spot arrow; reveals the Link Properties form below the nav row; `adjustPanelBoundary()` is called on toggle to reposition the panel correctly.
- **Tooltips on navigator buttons** — `data-tooltip` CSS `::after` tooltips added to Previous spot, Next spot, and Link properties toggle buttons using the same dark-pill style as the main toolbar buttons.
- **Horizontal centering** of the spots navigator number list (`justify-content: center` on `.vrl-spots-nav-list`).

---

## 2026-06-21

### Added
- **Comprehensive inline documentation** for `vrl-annotation.js` and `vrl-toolbar.js`: module-level JSDoc headers, per-function explanations covering algorithm details, browser quirks (`display:contents`, `!important` cascade, `cloneRange` timing, `normalize` after removal, `mousedown` vs `click` for selection capture, `caretPositionFromPoint` fallback), and section-grouped CSS comments.

---

## 2026-06-20

### Added
- **Annotation spots UX** (`vrl-annotation.js` + `vrl-toolbar.js`):
  - Each `<note-wrapper>` receives a UUID via `crypto.randomUUID()` stored in `data-vrl-id`; placement fires a `vrl-anchor-added` CustomEvent so the toolbar undo stack stays decoupled from the annotation engine.
  - Spot indicators default to 70% opacity; clicking a spot (plain click, no modifiers) selects it at 100% opacity and double size (40 px). Only one spot can be selected at a time; clicking the same spot again deselects it.
  - **Undo button** — disabled until the first anchor is placed; pops UUID stack in LIFO order; skips stale IDs already removed by the sweep-delete button; re-enables/disables automatically.
  - **Spots navigation toggle** — captures the active text selection at toggle time and scopes the navigator to spots inside that range (`Range.intersectsNode`); falls back to all document spots when no selection exists.
  - **Navigator strip** inside the link panel: `‹ 1 2 3 … n-2 n-1 n ›` layout with ellipsis for > 7 spots; highlights the current position; clicking a number or arrow selects the corresponding spot indicator and scrolls it into view only when outside the viewport (using the inner `<span>` since `<note-wrapper>` has `display:contents`).

### Fixed
- **Chrome / Firefox table cell-selection interference** — injecting `user-select: text !important` on `td/th/tr/table` for the duration Ctrl is held forces text-range creation instead of the browser's native cell-selection mode; the override is atomically removed on `keyup` via a dedicated `<style>` tag rather than inline styles.

---

## 2026-06-19

### Added
- **Raw HTML save** — `htmlFiles.save` sends the document body as `text/html` directly (bypassing JSON serialisation overhead).
- **Document search panel** in `vrl-toolbar` — postMessage bridge to `DocumentForm`; fields: Type, Number, Year, Entity; results rendered as a scrollable list with index, name, and id; panel boundary auto-corrects on drag and resize.
- **HTML document editor** — `GET /api/html-files/:name` serves documents as `text/html` with injected annotation and toolbar scripts; parent opens via `window.open()`; child saves back via `postMessage → PUT`.
- **Search toolbar** — reset button, 3-character minimum, page navigator, `searchText` query param support.

---

## Earlier

### Added
- Subtheme popup, datagrid count column, inline count header.
- Entity / subtheme popup editing, detail field, `POST` on add.
- Entities field: dirty-row tracking, lock other rows on edit, toggle background on expand/collapse.
- Entity field resolution, camelCase API payloads, document toolbar with search/refresh, entity count badge.
- Inline form validation, field-level errors, disabled detail sections on create, diagonal pattern, payload alignment.
- Documents admin redesign with inline form; subtheme pagination fix; document API service.
- Helper endpoint: send entity IDs (not parent IDs), fix `response.data` extraction, `allEntities` mount effect, `PAGE_SIZE=3` for entities.
- CRUD pages with pagination, theme/subtheme split-panel, and helper endpoint pattern.
- Dashboard headline text and layout adjustments.
- `LinksInteres` collapsible accordion with 3-column links layout.
- House icon in breadcrumb (`PublicApp`) as home navigation.
- `FeatureStrip` refactored to tabbed layout; `Compilaciones` colours updated.
- Dashboard feature panels; `StatCard` extended to 3 columns.
