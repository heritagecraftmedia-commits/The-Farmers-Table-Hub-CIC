import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Resets scroll position on internal navigation.
 *
 * React Router does not restore or reset scroll on its own, so following a
 * link from halfway down a long page (the Directory, for example) left the
 * next page opened at the previous page's scroll offset — the top of the new
 * page was above the viewport and the visitor had to scroll up to find it.
 *
 * Mounted once inside the Router so this is fixed site-wide rather than per
 * link. Three cases are handled differently:
 *
 *   PUSH / REPLACE  a new destination — go to the top.
 *   POP             back/forward — leave it alone. The browser's own
 *                   scroll restoration puts the visitor back where they
 *                   were, which is what they expect from the back button.
 *   #hash links     leave it alone, so in-page anchors still work.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash) return;
    if (navigationType === 'POP') return;

    // 'instant' rather than 'smooth': this is a page change, not a nudge
    // within a page, and a long smooth scroll on a slow device just looks
    // like the page is broken. Also respects users who asked for less
    // motion, for whom an animated jump is actively unpleasant.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash, navigationType]);

  return null;
};
