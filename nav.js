const NAV_BREAKPOINT = 768;
const NAV_OPEN_CLASS = 'open';
const SCROLL_THRESHOLD = 50;

const getNavElements = () => ({
  navToggle: document.querySelector('.nav-toggle'),
  navLinks: document.querySelector('.nav-links'),
  navElement: document.querySelector('nav')
});

const setMenuState = (navLinks, navToggle, isOpen) => {
  navLinks.classList.toggle(NAV_OPEN_CLASS, isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navLinks.setAttribute('aria-hidden', String(!isOpen));
  document.body.classList.toggle('menu-open', isOpen);
};

const getFocusableLink = (navLinks) => navLinks.querySelector('a');

export const initNav = () => {
  const { navToggle, navLinks, navElement } = getNavElements();

  if (!navToggle || !navLinks) {
    return;
  }

  let lastFocusedBeforeOpen = null;

  const openMenu = () => {
    const activeElement = document.activeElement;
    lastFocusedBeforeOpen = activeElement instanceof HTMLElement ? activeElement : null;

    setMenuState(navLinks, navToggle, true);

    const firstLink = getFocusableLink(navLinks);
    if (firstLink) {
      firstLink.focus();
    }
  };

  const closeMenu = () => {
    if (!navLinks.classList.contains(NAV_OPEN_CLASS)) {
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      return;
    }

    setMenuState(navLinks, navToggle, false);

    if (lastFocusedBeforeOpen && document.contains(lastFocusedBeforeOpen)) {
      lastFocusedBeforeOpen.focus();
    }

    lastFocusedBeforeOpen = null;
  };

  const toggleMenu = () => {
    if (navLinks.classList.contains(NAV_OPEN_CLASS)) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const onDocumentClick = (event) => {
    if (!navLinks.classList.contains(NAV_OPEN_CLASS)) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (!navLinks.contains(target) && !navToggle.contains(target)) {
      closeMenu();
    }
  };

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
    // allow Enter/Space on toggle to open/close
    if (event.target === navToggle && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      toggleMenu();
    }
  };

  const onResize = () => {
    if (window.innerWidth > NAV_BREAKPOINT) {
      closeMenu();
    }
  };

  const onScroll = () => {
    if (!navElement) {
      return;
    }

    navElement.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
  };

  navToggle.addEventListener('click', toggleMenu);
  navToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });
  navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('click', onDocumentClick);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onScroll, { passive: true });

  onScroll();
};
