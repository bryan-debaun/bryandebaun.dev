/**
 * Single source of truth for the dark/light theme precedence.
 *
 * The precedence MUST stay identical between:
 *  - the blocking inline script in `src/app/layout.tsx` (runs before paint to
 *    avoid a flash of the wrong theme / FOUC), and
 *  - the runtime toggle in `src/components/DarkModeToggle.tsx`.
 *
 * Precedence (highest first):
 *  1. localStorage `theme` === 'dark' | 'light' (explicit user choice)
 *  2. `prefers-color-scheme: dark` media query
 */

/**
 * Resolve whether dark mode should be active given the stored preference and
 * the OS-level color-scheme preference. Pure + framework-agnostic so it can be
 * unit-tested and shared by the toggle.
 */
export function resolveIsDark(
    stored: string | null,
    prefersDark: boolean,
): boolean {
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return prefersDark;
}

/**
 * The blocking, pre-paint theme script as a string for `dangerouslySetInnerHTML`.
 *
 * It mirrors {@link resolveIsDark} exactly. Because this runs before React
 * hydrates, it can only read `localStorage` + `matchMedia` directly. If you
 * change the precedence here, update {@link resolveIsDark} (and vice versa).
 */
export const themeInitScript = `(function () {
  try {
    var stored = null;
    try { stored = window.localStorage.getItem('theme'); } catch (e) {}
    var prefersDark = false;
    try {
      prefersDark = window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {}
    var isDark = stored === 'dark' ? true : (stored === 'light' ? false : !!prefersDark);
    var el = document.documentElement;
    if (isDark) { el.classList.add('dark'); el.classList.remove('light'); }
    else { el.classList.add('light'); el.classList.remove('dark'); }
  } catch (e) {}
})();`;
