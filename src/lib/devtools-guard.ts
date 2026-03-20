/**
 * Blocks common browser shortcuts that open DevTools / view source.
 * Runs only when import.meta.env.PROD is true (production build).
 *
 * This is a UX deterrent only — it does not secure secrets or prevent inspection.
 */

const CHROMIUM_SHIFT_CODES = new Set([
  "KeyI", // DevTools, Inspect
  "KeyJ", // Console (Chrome, Edge, Opera)
  "KeyC", // Inspect element picker
  "KeyK", // Web console (Firefox)
  "KeyE", // Debugger / network (Firefox toolbox)
  "KeyM", // Device toolbar (Chrome family)
]);

const MAC_ALT_CODES = new Set(["KeyI", "KeyJ", "KeyC", "KeyU"]);

function blockKeyboardEvent(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
} 

function isBlockedKeyboard(e: KeyboardEvent): boolean {
  if (e.key === "F12" || e.code === "F12") return true;

  // Ctrl+Shift+* (Chrome, Edge, Opera, Firefox on Windows/Linux)
  if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
    if (CHROMIUM_SHIFT_CODES.has(e.code)) return true;
  }

  // Cmd+Option+* (macOS — Chrome, Firefox, Safari family)
  if (e.metaKey && e.altKey && !e.ctrlKey) {
    if (MAC_ALT_CODES.has(e.code)) return true;
  }

  // View page source
  if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
    if (e.code === "KeyU" || e.key === "u" || e.key === "U") return true;
  }

  return false;
}

export function initDevtoolsGuard(): void {
  if (!import.meta.env.PROD) return;

  const onKeyDown = (e: KeyboardEvent): void => {
    if (isBlockedKeyboard(e)) {
      blockKeyboardEvent(e);
    }
  };

  window.addEventListener("keydown", onKeyDown, true);
}
