<script id="vindexrlScript1">

    /**
  * Advanced DOM Annotation Engine - Fully Balanced State Controller
  * ---------------------------------------------------------------------
  * Natural Mode (Default): Normal text highlighting. Perfect for deleting/sweeping tags.
  * Mode 1 (Ctrl/Cmd + Drag): Highlight text, auto-expanding boundaries safely for new inline notes.
  * Mode 2 (Alt + Click): Injects <note-wrapper> inside text with a red indicator dot.
    * Mode 3 (Shift + Click): Injects <note-wrapper> outside a block with a red indicator dot.
      */

      (function () {
      // Safety check: ensure script runs in a browser context
      if (typeof window === 'undefined' || !document) return;

      // --- HELPER STRUCTURES & CONFIGURATION ---

      // Configurable block elements for Mode 3 density calculations
      const BLOCK_SELECTOR = 'p, div, h1, h2, h3, section, article, li';

      /**
       * Helper to instantiate  structural anchor element.
       * Injects a visible red spot character configured not to disrupt layout flows.
       */
      function createNoteWrapper(status = 'empty-anchor') {
        const wrapper = document.createElement('note-wrapper');
      wrapper.style.display = 'contents'; // Layout-invisible until transformed
      wrapper.setAttribute('data-status', status);
      wrapper.setAttribute('data-timestamp', Date.now());
      wrapper.classList.add('vrl-spot');

      // Create the visual red spot indicator
      const redSpot = document.createElement('span');
      redSpot.textContent = '•'; // The indicator character

      // Inline styling to make the dot stand out sharply without shifting text
      redSpot.style.color = '#dc3545'; // Vibrant red
      redSpot.style.fontWeight = 'bold';
      redSpot.style.fontSize = '20px';
      redSpot.style.lineHeight = '0';
      redSpot.style.display = 'inline-block';
      redSpot.style.position = 'relative';
      redSpot.style.verticalAlign = 'middle';
      redSpot.style.margin = '0 2px';
      redSpot.style.cursor = 'pointer';
      redSpot.title = `Note Anchor (${status})`;

      // Embed the spot inside the wrapper
      wrapper.appendChild(redSpot);
      return wrapper;
      }

      // =========================================================================
      //  MODE 1 LOGIC: AUTOMATIC TEXT SELECTION EXPANSION
      // =========================================================================

      /**
       * Inspects the active user text range selection. If it spans across structural boundaries 
       * causing broken/unclosed tags, it expands outwards to the nearest clean common ancestor container.
       */
      function expandSelectionToCompleteTags() {
        const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      // If the selection starts and ends inside the exact same text block, no markup is broken
      if (range.startContainer === range.endContainer) {
          return;
        }

      // Find the lowest common structural container holding both the start and end of selection
      let commonAncestor = range.commonAncestorContainer;

      // If the ancestor points directly to a raw text node, step up one level to get the HTML tag
      if (commonAncestor.nodeType === Node.TEXT_NODE) {
        commonAncestor = commonAncestor.parentElement;
        }

      // Create a pristine, expanded range perfectly matching this ancestor container's limits
      const expandedRange = document.createRange();
      expandedRange.selectNodeContents(commonAncestor);

      // Clear the messy selection and re-apply the expanded range to the browser screen visually
      selection.removeAllRanges();
      selection.addRange(expandedRange);

      console.log("⚡ Mode 1: Range safely expanded to complete structural tags:", commonAncestor.tagName);
      }


      // =========================================================================
      //  MODE 2 LOGIC: INTERNAL INLINE CARET ANCHOR
      // =========================================================================

      /**
       * Finds the exact character index and text node beneath viewport coordinates (x,y)
       * and splits/injects a <note-wrapper> element right at that specific cursor location.
        */
        function executeMode2CaretPlacement(x, y) {
          let range = null;

        // Modern standard implementation (Chrome, Firefox, Edge)
        if (document.caretPositionFromPoint) {
          const position = document.caretPositionFromPoint(x, y);
        if (position) {
          range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.setEnd(position.offsetNode, position.offset);
          }
        }
        // Legacy/Safari implementation
        else if (document.caretRangeFromPoint) {
          range = document.caretRangeFromPoint(x, y);
        }

        // Drop the custom element directly into the text layout flow if a range was resolved
        if (range) {
          const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Instantiates wrapper with the visual red spot inside
        const noteWrapper = createNoteWrapper('inline-caret');

        try {
          range.insertNode(noteWrapper);
        console.log("⚡ Mode 2: Inserted inline note-wrapper with red spot at precision caret.");
          } catch (error) {
          console.error("Mode 2 insertion failed due to strict native text node locking:", error);
          }
        }
      }


        // =========================================================================
        //  MODE 3 LOGIC: EXTERNAL BLOCK DENSITY PLACEMENT
        // =========================================================================

        /**
         * Resolves the text node clicked, walks up to find the closest block element, 
         * calculates how far into the overall text the click occurred, and inserts 
         * the note-wrapper cleanly OUTSIDE (before or after) the block.
         */
        function executeMode3DensityPlacement(x, y) {
          let offsetNode = null;
        let offset = 0;

        // Resolve caret position coordinates
        if (document.caretPositionFromPoint) {
          const position = document.caretPositionFromPoint(x, y);
        if (position) {offsetNode = position.offsetNode; offset = position.offset; }
        } else if (document.caretRangeFromPoint) {
          const range = document.caretRangeFromPoint(x, y);
        if (range) {offsetNode = range.startContainer; offset = range.startOffset; }
        }

        // We can only process density accurately if the click landed directly over readable text
        if (!offsetNode || offsetNode.nodeType !== Node.TEXT_NODE) return;

        // Traverse upwards to catch the wrapping structural layout block
        const closestBlock = offsetNode.parentElement.closest(BLOCK_SELECTOR);
        if (!closestBlock) return;

        // Mathematically calculate text density prior to the click coordinate
        const textBeforeRange = document.createRange();
        textBeforeRange.setStart(closestBlock, 0); // Start at index 0 of the entire block
        textBeforeRange.setEnd(offsetNode, offset);  // Terminate exactly at the click caret character

        const characterCountBefore = textBeforeRange.toString().length;
        const totalBlockCharacters = closestBlock.textContent.length;

        // Fallback safety to avoid division by zero on blank paragraphs
        const textPercentage = totalBlockCharacters > 0
        ? (characterCountBefore / totalBlockCharacters) * 100
        : 0;

        // Instantiates wrapper with the visual red spot inside
        const noteWrapper = createNoteWrapper('block-density-anchor');

        // Adjust layout styling slightly for external blocks so the dot sits on its own line smoothly
        const indicatorDot = noteWrapper.querySelector('span');
        if (indicatorDot) {
          indicatorDot.style.display = 'block';
        indicatorDot.style.margin = '5px 0';
        indicatorDot.style.textAlign = 'center'; // Centers the indicator between blocks
        }

        // Apply  50% density placement rule outside the block boundary
        if (textPercentage < 50) {
          // Under 50%: User is interacting with the start of the block -> insert BEFORE
          closestBlock.parentNode.insertBefore(noteWrapper, closestBlock);
        console.log(`⚡ Mode 3: Placed BEFORE block (${textPercentage.toFixed(1)}% density detected)`);
        } else {
          // 50% or over: User is interacting with the latter half of the block -> insert AFTER
          closestBlock.parentNode.insertBefore(noteWrapper, closestBlock.nextSibling);
        console.log(`⚡ Mode 3: Placed AFTER block (${textPercentage.toFixed(1)}% density detected)`);
        }
      }


        // =========================================================================
        //  COORDINATED CENTRAL EVENT CONTROLLERS
        // =========================================================================

        /**
         * Controller 1: MouseUp Event
         * Dedicated to capturing standard, non-modifier drag highlights for Mode 1.
         */
        document.addEventListener('mouseup', function (event) {
        // Look for Ctrl key or Meta key (Command key on Mac systems)
        const isModifierPressed = event.ctrlKey || event.metaKey;

        // If the modifier isn't pressed, do absolutely nothing!
        // This leaves the selection pure and natural for deletion routines.
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

        /**
           * Controller 2: Click Event Interceptor
           * Maps explicit modifier click coordinates directly to specialized injection behaviors.
           * Controller 2: Click Interceptor (Modes 2 & 3)
           */
        document.addEventListener('click', function (event) {
        const x = event.clientX;
        const y = event.clientY;

        // Alt + Click triggers internal inline placement (Mode 2)
        if (event.altKey && !event.shiftKey) {
          event.preventDefault(); // Stop native browser cursor updates
        event.stopPropagation(); // Halt bubbling side effects
        executeMode2CaretPlacement(x, y);
        }

        // Shift + Click triggers structural block density placement (Mode 3)
        else if (event.shiftKey && !event.altKey) {
          event.preventDefault();
        event.stopPropagation();

        // 1. Run  density placement calculation logic
        executeMode3DensityPlacement(x, y);

        // 2. CRITICAL BUG FIX: Forcefully wipe out the browser's 
        // accidental native "Shift-Extend" text selection block.
        const nativeSelection = window.getSelection();
        if (nativeSelection) {
          nativeSelection.removeAllRanges();
          }

        console.log("🧹 Cleared accidental Shift-click selection highlight.");
        }
      });

        /**
         * Controller 3 & 4: Keyboard Feedback Engine
         * Instantly updates the mouse cursor to supply real-time accessibility feedback 
         * telling the user which annotation system state is currently unlocked.
         */
        document.addEventListener('keydown', function (event) {
        //If they hold Ctrl
        if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
          document.body.style.cursor = 'zoom-in'; // Mode 1 preview cursor
        }
        // If they hold Alt, give them an inline text cursor indicator
        else if (event.altKey && !event.shiftKey) {
          document.body.style.cursor = 'text';
        }
        // If they hold Shift, give them a crosshair layout target indicator
        else if (event.shiftKey && !event.altKey) {
          document.body.style.cursor = 'crosshair';
        }
      });

        // Reset the viewport layout back to default cursor states when keys lift
        document.addEventListener('keyup', function () {
          document.body.style.cursor = 'default';
      });

        console.log("🚀 Custom Selection Engine Active. [Default: Highlight] [Alt+Click: In-Caret + Red Spot] [Shift+Click: Out-Block + Red Spot]");
    })();

      </script>

      <script id="vindexrl-toolbar">
    /**
        * Advanced DOM Annotation Engine - Floating Dragable Toolbar
        * -----------------------------------------------------------
        * Automatically initializes immediately after the browser finishes parsing the HTML DOM.
        */

        document.addEventListener('DOMContentLoaded', function () {
          console.log('📦 Core DOM Ready. Initializing Floating Annotation Toolbar...');

        // --- 1. CREATE INLINE STYLES FOR THE TOOLBAR ---
        const style = document.createElement('style');
        style.textContent = `
        /* Main Toolbar Container */
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

        /* Drag Handle Grip Area */
        .vrl-toolbar-drag-handle {
          cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 32px;
        color: rgba(0, 0, 0, 0.3);
        }

        .vrl-toolbar-drag-handle:active {
          cursor: grabbing;
        }

        /* Action Buttons */
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

        .vrl-toolbar-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        color: #1a1a1a;
        }

        .vrl-toolbar-btn:active {
          background: rgba(0, 0, 0, 0.1);
        transform: scale(0.96);
        }

        /* Tooltip System */
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

        .vrl-toolbar-btn:hover::after {
          opacity: 1;
        transform: translateX(-50%) scale(1);
        }
        `;
        document.head.appendChild(style);

        // --- 2. BUILD THE HTML STRUCTURE ---
        const toolbar = document.createElement('div');
        toolbar.className = 'vrl-floating-toolbar';

        // Drag Handle Component (Visual Grip dots)
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

        // Component 1: Delete/Strip vrl-spot tags button
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

        // Inject toolbar into active DOM structure
        document.body.appendChild(toolbar);

        // --- 3. DRAG AND DROP ENGINE LOGIC ---
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        dragHandle.addEventListener('mousedown', function (e) {
          isDragging = true;

        const rect = toolbar.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        startX = e.clientX;
        startY = e.clientY;

        // Remove original right/top layout hooks to ensure absolute dragging tracking
        toolbar.style.right = 'auto';
        toolbar.style.bottom = 'auto';
        toolbar.style.left = `${initialLeft}px`;
        toolbar.style.top = `${initialTop}px`;

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
        e.preventDefault(); // Stop textual highlighting glitches while dragging panel
      });

        function dragMove(e) {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // Keep the panel inside visible viewport bounds
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

      // --- 4. SELECTION CORE LOGIC: REMOVE VRL-SPOT TAGS ---

      // Crucial: Use mousedown + preventDefault so clicking the button doesn't clear the highlighted text selection

      // =========================================================================
      //  SELECTION LOGIC: REMOVE CUSTOM TAG WRAPPERS WITHOUT SPLITTING BLOCKS
      // =========================================================================

      /**
       * Deletes targeted custom wrappers (.vrl-spot and note-wrapper) within the
       * user's active selection. Uses a non-destructive cloning and intersection
       * strategy to prevent the browser from splitting parent <p> and <div> tags.
          */
          deleteButton.addEventListener('mousedown', function (e) {
            // Prevent the button click from stealing focus, which would instantly
            // clear the user's active blue text selection highlight.
            e.preventDefault();

          // Retrieve the current browser selection object
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;

          // Extract the primary range geometry
          const range = selection.getRangeAt(0);

          // If the selection is just a flashing text cursor (collapsed), exit early
          if (range.collapsed) {
            console.log("Selection is empty. Highlight text to sweep tags.");
          return;
        }

          /**
           * BUG FIX STEP 1: Non-Destructive Cloning
           * Instead of using range.extractContents()—which physically tears the DOM 
           * nodes out and forces parent containers to split apart—we generate an 
           * isolated, virtual blueprint copy of what the user highlighted.
           */
          const cloneFragment = range.cloneContents();

          // Scan the virtual blueprint to verify if any target tags exist inside it
          const targetsInClone = cloneFragment.querySelectorAll('.vrl-spot, note-wrapper');

        if (targetsInClone.length > 0) {
            /**
             * BUG FIX STEP 2: Narrow Down the Real DOM Search Space
             * We find the lowest common structural element enclosing the whole selection.
             * If the ancestor is a raw text node, we step up to get its parent HTML element.
             */
            let container = range.commonAncestorContainer;
          if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentElement;
          }

          // Locate all live, actionable custom elements inside this shared container zone
          const allLiveSpots = container.querySelectorAll('.vrl-spot, note-wrapper');
          let deletedCount = 0;

          /**
           * BUG FIX STEP 3: Intersection Checking
           * We loop through the real elements in the document and cross-reference them
           * with the active selection boundary.
           */
          allLiveSpots.forEach(liveSpot => {
            /**
          * selection.containsNode(node, partialContained)
          * Passing 'true' checks if ANY part of the element intersects with the
          * user's selection highlight. This ensures we catch tags even if they
          * were only half-highlighted.
          */
            if (selection.containsNode(liveSpot, true)) {

            // Remove the empty shell tag safely from the live DOM hierarchy
            liveSpot.remove();
          deletedCount++;
            }
          });

          console.log(`🧹 Successfully cleaned ${deletedCount} custom tag wrappers without breaking blocks.`);

          /**
           * BUG FIX STEP 5: DOM Cleansing / Normalization
           * Stripping out inline wrapper tags can leave behind adjacent, fragmented 
           * raw text nodes. Calling .normalize() merges these side-by-side text pieces 
           * back into single unbroken text strings, preventing future layout calculation glitches.
           */
          container.normalize();
        } else {
            console.log("No targets detected inside the selected scope.");
        }
      });
    });

        </script>
