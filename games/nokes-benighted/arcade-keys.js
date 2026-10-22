/* ============================================================================
   ARCADE BUILD — CONSUME ONLY THE KEYS THIS GAME USES.

   The cabinet quits to its menu on one key, and it listens for it on the
   DOCUMENT of the frame the game runs in. Every one of this game's overlays
   listens on the WINDOW, with capture, and window-capture runs before
   document-capture -- so any handler here that calls stopPropagation() on a
   key it does not care about takes the player's way out with it.

   The title screen was the worst of them: "anything else starts the game"
   meant it swallowed every key there is.

   The rule is the honest version of the fix, and it would be right even
   without a cabinet: a handler consumes the keys it acts on and leaves the
   rest alone. Printable keys, the arrows, Enter, Backspace and Tab are what
   this game reads. Anything longer-named belongs to whatever is hosting it.
   ========================================================================== */
window.V2TakesKey = function (k) {
  return !!k && (
    k.length === 1 ||
    k === 'Enter' || k === 'Backspace' || k === 'Tab' ||
    k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
  );
};
