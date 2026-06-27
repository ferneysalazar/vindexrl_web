
      /**
       * vrl-annotation.js
       *
       * Annotation anchor engine injected into HTML documents rendered by the VRL viewer.
       * Provides three keyboard+mouse placement modes for inserting <note-wrapper> anchors
       * (red dot markers) into the document without disturbing surrounding content:
       *
       *  Mode 1 — Ctrl+drag:  expand selection to the common ancestor of the outermost
       *                        semantic blocks touched, then leave the expanded selection
       *                        for the user to act on.
       *  Mode 2 — Alt+click:  insert a <note-wrapper> inline at the exact text caret
       *                        position under the pointer.
       *  Mode 3 — Shift+click: insert a <note-wrapper> as a block-level sibling,
       *                        before or after the nearest semantic block depending on
       *                        where in the block the click landed (density heuristic).
       *
       * Cursor feedback (zoom-in / text / crosshair) signals which mode is active.
       *
       * A CSS override injected at Ctrl keydown and removed at keyup fixes a Chrome /
       * Firefox built-in "table cell selection" behaviour that blocks normal text-range
       * creation while Ctrl is held, which would prevent Mode 1 from ever firing.
       *
       * Each <note-wrapper> carries:
       *   data-vrl-id        — UUID unique to the anchor (used by the undo stack)
       *   data-status        — placement mode ('inline-caret' | 'block-density-anchor')
       *   data-timestamp     — Unix ms at creation time
       *
       * After a successful insertion, a 'vrl-anchor-added' CustomEvent is dispatched on
       * document so vrl-toolbar.js can maintain its undo stack without needing shared
       * state or a direct reference to this IIFE.
       */
      (function () {
      // Guard against environments where the DOM is unavailable (e.g. SSR / Node).
      if (typeof window === 'undefined' || !document) return;

      // Semantic block elements used as expansion targets (Mode 1) and density anchors
      // (Mode 3). Table elements are intentionally excluded: a selection inside a single
      // <td> would otherwise expand to the whole table, which is almost never desired.
      const BLOCK_SELECTOR = 'p, div, h1, h2, h3, section, article, li';

      // ---------------------------------------------------------------------------
      // Spot indicator styles
      // ---------------------------------------------------------------------------
      // Injected as a <style> tag rather than inline so it applies to spots that
      // already exist in the document (e.g. loaded from a previously saved HTML),
      // not only to spots created in this session.
      //
      // Default: 70% opacity so indicators are present but unobtrusive.
      // Selected: 100% opacity + double font-size (40px vs the 20px inline style set
      //   in createNoteWrapper). The !important is necessary because the inline style
      //   on the span would otherwise win the cascade — author !important declarations
      //   beat non-!important inline styles.
      // Transition: animates both changes smoothly (0.2s ease).
      const spotStyle = document.createElement('style');
      spotStyle.textContent = `
        .vrl-spot > span {
          opacity: 0.7;
          transition: opacity 0.2s ease, font-size 0.2s ease;
        }
        .vrl-spot > span.vrl-spot-selected {
          opacity: 1 !important;
          font-size: 40px !important;
        }
      `;
      document.head.appendChild(spotStyle);

      // ---------------------------------------------------------------------------
      // Spot single-selection
      // ---------------------------------------------------------------------------
      // Tracks the currently selected span so we can deselect it when another spot
      // is clicked. Null means nothing is currently selected.
      let selectedSpotEl = null;

      /**
       * Plain-click handler for spot selection.
       *
       * Only fires for unmodified clicks (no Alt / Shift / Ctrl / Meta) so it does
       * not interfere with the annotation placement modes that use those modifiers.
       *
       * Targets the direct child <span> of a .vrl-spot element (the red dot).
       * stopPropagation prevents the click from bubbling to the document's other
       * click listeners (the Mode 2 / Mode 3 handler below), which would otherwise
       * try to insert a new anchor at the clicked position.
       *
       * Toggle behaviour:
       *  - Clicking a different spot: deselects previous, selects new.
       *  - Clicking the same spot again: deselects it (selectedSpotEl → null).
       */
      document.addEventListener('click', function (event) {
        if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) return;
        const target = event.target;
        // Check direct parent so we don't accidentally select spans nested deeper.
        if (!target.parentElement || !target.parentElement.classList.contains('vrl-spot')) return;
        event.stopPropagation();
        if (selectedSpotEl && selectedSpotEl !== target) {
          selectedSpotEl.classList.remove('vrl-spot-selected');
        }
        if (selectedSpotEl === target) {
          // Second click on the same spot → toggle off.
          target.classList.remove('vrl-spot-selected');
          selectedSpotEl = null;
          document.dispatchEvent(new CustomEvent('vrl-spot-selected', { detail: { id: null } }));
        } else {
          target.classList.add('vrl-spot-selected');
          selectedSpotEl = target;
          document.dispatchEvent(new CustomEvent('vrl-spot-selected', {
            detail: { id: target.parentElement.dataset.vrlId || null },
          }));
        }
      });

      // ---------------------------------------------------------------------------
      // <note-wrapper> factory
      // ---------------------------------------------------------------------------
      /**
       * Creates a <note-wrapper> custom element containing a styled red dot (•).
       *
       * display:contents makes the wrapper invisible to layout — it acts as a
       * transparent container so the inline red dot flows with surrounding text
       * without introducing an extra box.
       *
       * data-vrl-id holds a UUID generated with crypto.randomUUID() (available in
       * all modern browsers). The toolbar's undo stack stores this UUID so it can
       * locate and remove the exact element without iterating the whole DOM.
       *
       * @param {string} status - Placement mode label stored in data-status.
       */
      function createNoteWrapper(status = 'empty-anchor') {
        const wrapper = document.createElement('note-wrapper');
      wrapper.style.display = 'contents';
      wrapper.setAttribute('data-status', status);
      wrapper.setAttribute('data-timestamp', Date.now());
      wrapper.setAttribute('data-vrl-id', crypto.randomUUID());
      wrapper.classList.add('vrl-spot');

      const redSpot = document.createElement('span');
      redSpot.textContent = '•';
      redSpot.style.color = '#dc3545';
      redSpot.style.fontWeight = 'bold';
      redSpot.style.fontSize = '20px';   // overridden to 40px by .vrl-spot-selected
      redSpot.style.lineHeight = '0';    // prevents the bullet from expanding line-height
      redSpot.style.display = 'inline-block';
      redSpot.style.position = 'relative';
      redSpot.style.verticalAlign = 'middle';
      redSpot.style.margin = '0 2px';
      redSpot.style.cursor = 'pointer';
      redSpot.title = `Note Anchor (${status})`;

      wrapper.appendChild(redSpot);
      return wrapper;
      }

      // ---------------------------------------------------------------------------
      // Mode 1 — Expand selection to complete structural tags
      // ---------------------------------------------------------------------------
      /**
       * Expands the current selection to the common ancestor of the outermost
       * semantic blocks at each boundary.
       *
       * Two cases:
       *  a) Both boundaries resolve to the same block (or no block ancestor exists):
       *     the selection is already within a single structural unit — leave it as-is
       *     so the user's exact character-level selection is preserved.
       *  b) Boundaries are in different blocks: the selection spans a structural
       *     boundary. Expand to the common ancestor so the resulting selection covers
       *     complete tags rather than a partial slice.
       *
       * BLOCK_SELECTOR intentionally excludes TD / TR / TABLE, which means a
       * selection confined within a single table cell returns null from .closest()
       * and falls into case (a), preventing the <table> from being used as the
       * expansion target.
       */
      function expandSelectionToCompleteTags() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return;

        // startContainer / endContainer may be text nodes; walk up to the element.
        const startEl = range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : range.startContainer;
        const endEl = range.endContainer.nodeType === Node.TEXT_NODE
          ? range.endContainer.parentElement
          : range.endContainer;

        // Walk up to the nearest semantic block for each boundary.
        // BLOCK_SELECTOR deliberately excludes table elements (TD, TR, TABLE),
        // so a selection confined within one cell will return null or the same block,
        // preventing the TD from being mistakenly used as the expansion target.
        const startBlock = startEl.closest(BLOCK_SELECTOR);
        const endBlock   = endEl.closest(BLOCK_SELECTOR);

        // If both boundaries share the same block (or no block ancestor exists),
        // the selection is already within a single structural unit — keep it as-is.
        if (!startBlock || !endBlock || startBlock === endBlock) {
          console.log("⚡ Mode 1: Selection within single block — keeping exact user selection.");
          return;
        }

        // The selection genuinely spans multiple blocks — expand to their common ancestor.
        let commonAncestor = range.commonAncestorContainer;
        if (commonAncestor.nodeType === Node.TEXT_NODE) {
          commonAncestor = commonAncestor.parentElement;
        }

        const expandedRange = document.createRange();
        expandedRange.selectNodeContents(commonAncestor);
        selection.removeAllRanges();
        selection.addRange(expandedRange);

        console.log("⚡ Mode 1: Range expanded to complete structural tags:", commonAncestor.tagName);
      }

      // ---------------------------------------------------------------------------
      // Mode 2 — Inline caret placement
      // ---------------------------------------------------------------------------
      /**
       * Inserts a <note-wrapper> inline at the exact text caret position under (x, y).
       *
       * Browser API differences:
       *  - caretPositionFromPoint  (Firefox, Chrome 128+): returns a CaretPosition
       *    with offsetNode + offset; we build a collapsed Range from it.
       *  - caretRangeFromPoint (Chrome < 128, Safari): returns a Range directly.
       *
       * The insertion is wrapped in try/catch because some browsers lock native
       * text nodes in certain contexts (e.g. inside <input> shadow DOM) and throw
       * a HierarchyRequestError when insertNode is called.
       *
       * After a successful insertion the 'vrl-anchor-added' CustomEvent carries the
       * UUID so the toolbar's undo stack can track this element by ID.
       */
        function executeMode2CaretPlacement(x, y) {
          let range = null;

        if (document.caretPositionFromPoint) {
          const position = document.caretPositionFromPoint(x, y);
        if (position) {
          range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.setEnd(position.offsetNode, position.offset);
          }
        }
        else if (document.caretRangeFromPoint) {
          // Safari / older Chrome fallback.
          range = document.caretRangeFromPoint(x, y);
        }

        if (range) {
          const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const noteWrapper = createNoteWrapper('inline-caret');

        try {
          range.insertNode(noteWrapper);
          // Notify the toolbar's undo stack via a custom event rather than a direct
          // function call to keep the two scripts fully decoupled.
          document.dispatchEvent(new CustomEvent('vrl-anchor-added', { detail: { id: noteWrapper.dataset.vrlId } }));
        console.log("⚡ Mode 2: Inserted inline note-wrapper with red spot at precision caret.");
          } catch (error) {
          console.error("Mode 2 insertion failed due to strict native text node locking:", error);
          }
        }
      }

      // ---------------------------------------------------------------------------
      // Mode 3 — Block-density placement
      // ---------------------------------------------------------------------------
      /**
       * Places a block-level <note-wrapper> before or after the nearest semantic
       * block, using a character-density heuristic to decide which side.
       *
       * Algorithm:
       *  1. Resolve the text node and offset under (x, y) using the same
       *     caretPositionFromPoint / caretRangeFromPoint APIs as Mode 2.
       *  2. Walk up to the nearest BLOCK_SELECTOR ancestor.
       *  3. Count the characters between the block's start and the caret offset.
       *  4. Express that count as a percentage of the block's total character count.
       *  5. < 50% → the click was in the first half → place the anchor BEFORE.
       *     ≥ 50% → the click was in the second half → place the anchor AFTER.
       *
       * The indicator dot for Mode 3 is styled as a centred block element (display:block,
       * text-align:center) so it visually sits between paragraphs rather than
       * appearing inline like a Mode 2 anchor.
       *
       * After insertion, 'vrl-anchor-added' is dispatched on document (same pattern
       * as Mode 2) so the toolbar undo stack captures the new UUID.
       */
        function executeMode3DensityPlacement(x, y) {
          let offsetNode = null;
        let offset = 0;

        if (document.caretPositionFromPoint) {
          const position = document.caretPositionFromPoint(x, y);
        if (position) {offsetNode = position.offsetNode; offset = position.offset; }
        } else if (document.caretRangeFromPoint) {
          const range = document.caretRangeFromPoint(x, y);
        if (range) {offsetNode = range.startContainer; offset = range.startOffset; }
        }

        // Only text nodes carry meaningful character offsets; bail on element nodes.
        if (!offsetNode || offsetNode.nodeType !== Node.TEXT_NODE) return;

        const closestBlock = offsetNode.parentElement.closest(BLOCK_SELECTOR);
        if (!closestBlock) return;

        // Build a range from the block's start to the caret to count characters before it.
        const textBeforeRange = document.createRange();
        textBeforeRange.setStart(closestBlock, 0);
        textBeforeRange.setEnd(offsetNode, offset);

        const characterCountBefore = textBeforeRange.toString().length;
        const totalBlockCharacters = closestBlock.textContent.length;

        // Guard against empty blocks (division by zero → 0% → always placed before).
        const textPercentage = totalBlockCharacters > 0
        ? (characterCountBefore / totalBlockCharacters) * 100
        : 0;

        const noteWrapper = createNoteWrapper('block-density-anchor');

        // Override the inline display to centre the dot between block elements.
        const indicatorDot = noteWrapper.querySelector('span');
        if (indicatorDot) {
          indicatorDot.style.display = 'block';
        indicatorDot.style.margin = '5px 0';
        indicatorDot.style.textAlign = 'center';
        }

        if (textPercentage < 50) {
          closestBlock.parentNode.insertBefore(noteWrapper, closestBlock);
        console.log(`⚡ Mode 3: Placed BEFORE block (${textPercentage.toFixed(1)}% density detected)`);
        } else {
          // insertBefore with nextSibling is equivalent to insertAfter.
          closestBlock.parentNode.insertBefore(noteWrapper, closestBlock.nextSibling);
        console.log(`⚡ Mode 3: Placed AFTER block (${textPercentage.toFixed(1)}% density detected)`);
        }
        document.dispatchEvent(new CustomEvent('vrl-anchor-added', { detail: { id: noteWrapper.dataset.vrlId } }));
      }

      // ---------------------------------------------------------------------------
      // Mode 1 trigger — mouseup
      // ---------------------------------------------------------------------------
      /**
       * On Ctrl / Meta + mouseup, attempt to expand the selection if the user dragged
       * out a non-empty range.
       *
       * The 15 ms setTimeout is intentional: the browser finalises the selection
       * object slightly after the mouseup event fires. Calling getSelection()
       * synchronously inside mouseup can return an empty or partial range on some
       * browsers. The delay lets the selection settle before we inspect it.
       */
        document.addEventListener('mouseup', function (event) {
        const isModifierPressed = event.ctrlKey || event.metaKey;

        if (!isModifierPressed) {
          console.log("Normal selection mode: Engine is resting.");
        return;
        }

        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.toString().trim().length > 0) {
          expandSelectionToCompleteTags();
          }
        }, 15);
      });

      // ---------------------------------------------------------------------------
      // Mode 2 / 3 trigger — click
      // ---------------------------------------------------------------------------
      /**
       * Dispatches Alt+click to Mode 2 and Shift+click to Mode 3.
       *
       * preventDefault stops the browser from following links or activating form
       * elements at the clicked position. stopPropagation prevents the spot-selection
       * click listener (registered above) from also firing and trying to select a spot.
       *
       * After a Shift+click the native selection is cleared because the Shift key
       * causes the browser to extend any existing text selection to the click point,
       * producing an unwanted highlight that has no semantic value here.
       */
        document.addEventListener('click', function (event) {
        const x = event.clientX;
        const y = event.clientY;

        if (event.altKey && !event.shiftKey) {
          event.preventDefault();
        event.stopPropagation();
        executeMode2CaretPlacement(x, y);
        }

        else if (event.shiftKey && !event.altKey) {
          event.preventDefault();
        event.stopPropagation();

        executeMode3DensityPlacement(x, y);

        // Shift+click extends the browser's text selection to the clicked point.
        // Clear it so no visual highlight is left behind after placing the anchor.
        const nativeSelection = window.getSelection();
        if (nativeSelection) {
          nativeSelection.removeAllRanges();
          }

        console.log("🧹 Cleared accidental Shift-click selection highlight.");
        }
      });

        /**
         * Browser table cell-selection override.
         *
         * Root problem:
         *   Chrome and Firefox have a built-in "table cell selection" mode that
         *   activates when the user holds Ctrl and drags the mouse inside a <table>.
         *   In this mode the browser highlights the entire <TD> with a border and
         *   selects cells as atomic units instead of allowing text drag-selection.
         *   Because no text range is created, window.getSelection().toString() is
         *   empty on mouseup and the annotation engine's Mode 1 (expandSelection-
         *   ToCompleteTags) never fires.
         *
         * Fix strategy — CSS injection / removal tied to Ctrl key lifecycle:
         *   Injecting  `user-select: text !important` on table elements forces the
         *   browser out of cell-selection mode and back into normal text-selection
         *   mode for the duration the Ctrl key is held. The rule is added as a
         *   dedicated <style> tag (not inlined) so it can be cleanly removed the
         *   moment the key is released, restoring default browser behaviour without
         *   leaving any residual style on the document.
         *
         * Why a style tag rather than inline styles:
         *   Inline styles on individual <td> elements would require iterating every
         *   cell at keydown time (expensive on large tables) and restoring each one
         *   at keyup. A single injected rule covers the whole document in O(1) and
         *   disappears atomically on removal.
         *
         * The null guard (`if (!ctrlSelectionStyle)`) prevents duplicate <style>
         * tags if keydown fires repeatedly while the key is held (key-repeat).
         */
        let ctrlSelectionStyle = null;

        /**
         * Firefox multi-selection guard (mousedown).
         *
         * Unlike Chrome (which blocks text selection entirely and shows the TD
         * border), Firefox allows text selection with Ctrl held but accumulates
         * each drag as an additional disjoint range on top of any previous
         * selection. This causes expandSelectionToCompleteTags() to operate on
         * a stale multi-range Selection object, producing unexpected results.
         *
         * Clearing all existing ranges on Ctrl+mousedown resets the Selection to
         * a clean state before the new drag begins, so the engine always receives
         * exactly one fresh range on mouseup — consistent with Chrome behaviour.
         *
         * This handler is intentionally silent (no preventDefault / stopPropagation)
         * so it does not interfere with the browser's ability to start a new text
         * selection during the subsequent drag.
         */
        document.addEventListener('mousedown', function (event) {
          if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) sel.removeAllRanges();
          }
        });

        /**
         * keydown — cursor feedback + table cell-selection override.
         *
         * Three mutually exclusive modifier branches:
         *
         *  Ctrl / Meta (no Alt, no Shift) → Mode 1 (text expand on mouseup)
         *    - cursor: zoom-in  signals "selection will be expanded"
         *    - injects the user-select override style described above
         *
         *  Alt (no Shift) → Mode 2 (precision inline caret placement on click)
         *    - cursor: text  signals "click to place an inline anchor"
         *
         *  Shift (no Alt) → Mode 3 (block density placement on click)
         *    - cursor: crosshair  signals "click to place a block-level anchor"
         */
        document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
          document.body.style.cursor = 'zoom-in';

          // Inject the override only once; keydown repeats while the key is held.
          if (!ctrlSelectionStyle) {
            ctrlSelectionStyle = document.createElement('style');
            ctrlSelectionStyle.id = 'vrl-ctrl-sel';
            // `text !important` beats any specificity already in the document and
            // overrides the browser's own cell-selection UA stylesheet rule.
            // -webkit- covers Chrome/Safari; -moz- is required for Firefox because
            // Firefox's UA table stylesheet uses -moz-user-select internally and
            // the unprefixed property alone does not override it in all versions.
            // The td:focus / th:focus rule suppresses the dotted cell outline that
            // Firefox draws when a cell receives focus during Ctrl+drag.
            ctrlSelectionStyle.textContent = `
              td, th, tr, table {
                user-select: text !important;
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
              }
              td:focus, th:focus { outline: none !important; }
            `;
            document.head.appendChild(ctrlSelectionStyle);
          }
        }
        else if (event.altKey && !event.shiftKey) {
          document.body.style.cursor = 'text';
        }
        else if (event.shiftKey && !event.altKey) {
          document.body.style.cursor = 'crosshair';
        }
      });

        /**
         * keyup — restore cursor and remove the cell-selection override.
         *
         * Fires on ANY key release (not just Ctrl) which is intentional: if the
         * user releases a modifier key while another is still held the cursor
         * returns to default, preventing a stale zoom-in/text/crosshair cursor.
         *
         * The style tag is removed here rather than in the mouseup handler because
         * the user may press Ctrl without ever clicking, and we must guarantee the
         * override is always cleaned up regardless of whether a selection was made.
         * Leaving `user-select: text !important` on table elements permanently
         * would break the browser's normal table interaction (e.g. copy-cell).
         */
        document.addEventListener('keyup', function () {
          document.body.style.cursor = 'default';
          if (ctrlSelectionStyle) {
            ctrlSelectionStyle.remove();
            ctrlSelectionStyle = null;  // allow re-injection on next keydown
          }
      });

        console.log("🚀 Custom Selection Engine Active. [Default: Highlight] [Alt+Click: In-Caret + Red Spot] [Shift+Click: Out-Block + Red Spot]");
    })();
