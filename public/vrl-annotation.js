
      /**
       * vrl-annotation.js
       *
       * Annotation anchor engine injected into HTML documents rendered by the VRL viewer.
       * Provides three keyboard+mouse placement modes for inserting <note-wrapper> anchors
       * (red dot markers) into the document without disturbing surrounding content:
       *
       *  Mode 1 — Ctrl+drag:  expand selection to complete structural block(s), then wrap
       *  Mode 2 — Alt+click:  inline caret placement at exact click position
       *  Mode 3 — Shift+click: block-density placement before/after the nearest block
       *
       * Cursor feedback (zoom-in / text / crosshair) signals which mode is active.
       * A CSS override fixes Chrome/Firefox table cell-selection that otherwise blocks
       * text-range creation while Ctrl is held.
       */
      (function () {
      if (typeof window === 'undefined' || !document) return;

      // Semantic block elements used as expansion targets and density anchors.
      const BLOCK_SELECTOR = 'p, div, h1, h2, h3, section, article, li';

      // Default 70% opacity for all spot indicators; selected state is full opacity + double size.
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

      let selectedSpotEl = null;

      // Single-selection: plain click on a spot indicator selects it and deselects any previous one.
      document.addEventListener('click', function (event) {
        if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) return;
        const target = event.target;
        if (!target.parentElement || !target.parentElement.classList.contains('vrl-spot')) return;
        event.stopPropagation();
        if (selectedSpotEl && selectedSpotEl !== target) {
          selectedSpotEl.classList.remove('vrl-spot-selected');
        }
        if (selectedSpotEl === target) {
          target.classList.remove('vrl-spot-selected');
          selectedSpotEl = null;
        } else {
          target.classList.add('vrl-spot-selected');
          selectedSpotEl = target;
        }
      });

      // Creates a <note-wrapper> element containing a red dot (•) anchor indicator.
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
      redSpot.style.fontSize = '20px';
      redSpot.style.lineHeight = '0';
      redSpot.style.display = 'inline-block';
      redSpot.style.position = 'relative';
      redSpot.style.verticalAlign = 'middle';
      redSpot.style.margin = '0 2px';
      redSpot.style.cursor = 'pointer';
      redSpot.title = `Note Anchor (${status})`;

      wrapper.appendChild(redSpot);
      return wrapper;
      }

      // Mode 1: Expands the current selection to the common ancestor of the
      // outermost semantic blocks it touches. No-ops when within a single block.
      function expandSelectionToCompleteTags() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return;

        // Resolve element nodes from the raw start/end containers (which may be text nodes).
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

        // Mode 2: Inserts a <note-wrapper> inline at the exact text caret position
        // under (x, y), using caretPositionFromPoint with caretRangeFromPoint fallback.
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
          range = document.caretRangeFromPoint(x, y);
        }

        if (range) {
          const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const noteWrapper = createNoteWrapper('inline-caret');

        try {
          range.insertNode(noteWrapper);
          document.dispatchEvent(new CustomEvent('vrl-anchor-added', { detail: { id: noteWrapper.dataset.vrlId } }));
        console.log("⚡ Mode 2: Inserted inline note-wrapper with red spot at precision caret.");
          } catch (error) {
          console.error("Mode 2 insertion failed due to strict native text node locking:", error);
          }
        }
      }

        // Mode 3: Places a block-level <note-wrapper> before or after the nearest
        // semantic block based on where within the block the click landed (<50% → before,
        // ≥50% → after), measured by character count relative to total block length.
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

        if (!offsetNode || offsetNode.nodeType !== Node.TEXT_NODE) return;

        const closestBlock = offsetNode.parentElement.closest(BLOCK_SELECTOR);
        if (!closestBlock) return;

        const textBeforeRange = document.createRange();
        textBeforeRange.setStart(closestBlock, 0);
        textBeforeRange.setEnd(offsetNode, offset);

        const characterCountBefore = textBeforeRange.toString().length;
        const totalBlockCharacters = closestBlock.textContent.length;

        const textPercentage = totalBlockCharacters > 0
        ? (characterCountBefore / totalBlockCharacters) * 100
        : 0;

        const noteWrapper = createNoteWrapper('block-density-anchor');

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
          closestBlock.parentNode.insertBefore(noteWrapper, closestBlock.nextSibling);
        console.log(`⚡ Mode 3: Placed AFTER block (${textPercentage.toFixed(1)}% density detected)`);
        }
        document.dispatchEvent(new CustomEvent('vrl-anchor-added', { detail: { id: noteWrapper.dataset.vrlId } }));
      }

        // Mode 1 trigger: on Ctrl+mouseup, expand the selection if text was selected.
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

        // Mode 2/3 trigger: Alt+click → inline caret; Shift+click → block density.
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
