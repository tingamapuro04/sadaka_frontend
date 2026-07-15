import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Move focus to main content on client-side navigations (a11y). */
export const useRouteFocus = (targetId = 'main-content') => {
  const location = useLocation();

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
    }
    el.focus({ preventScroll: true });
  }, [location.pathname, location.search, targetId]);
};
