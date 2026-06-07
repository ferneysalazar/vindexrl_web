
      (function () {
      if (typeof window === 'undefined' || !document) return;

      const BLOCK_SELECTOR = 'p, div, h1, h2, h3, section, article, li';

      function createNoteWrapper(status = 'empty-anchor') {
        const wrapper = document.createElement('note-wrapper');
      wrapper.style.display = 'contents';
      wrapper.setAttribute('data-status', status);
      wrapper.setAttribute('data-timestamp', Date.now());
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

      function expandSelectionToCompleteTags() {
        const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      if (range.startContainer === range.endContainer) {
          return;
        }

      let commonAncestor = range.commonAncestorContainer;

      if (commonAncestor.nodeType === Node.TEXT_NODE) {
        commonAncestor = commonAncestor.parentElement;
        }

      const expandedRange = document.createRange();
      expandedRange.selectNodeContents(commonAncestor);

      selection.removeAllRanges();
      selection.addRange(expandedRange);

      console.log("⚡ Mode 1: Range safely expanded to complete structural tags:", commonAncestor.tagName);
      }

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
        console.log("⚡ Mode 2: Inserted inline note-wrapper with red spot at precision caret.");
          } catch (error) {
          console.error("Mode 2 insertion failed due to strict native text node locking:", error);
          }
        }
      }

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
      }

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

        document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
          document.body.style.cursor = 'zoom-in';
        }
        else if (event.altKey && !event.shiftKey) {
          document.body.style.cursor = 'text';
        }
        else if (event.shiftKey && !event.altKey) {
          document.body.style.cursor = 'crosshair';
        }
      });

        document.addEventListener('keyup', function () {
          document.body.style.cursor = 'default';
      });

        console.log("🚀 Custom Selection Engine Active. [Default: Highlight] [Alt+Click: In-Caret + Red Spot] [Shift+Click: Out-Block + Red Spot]");
    })();
