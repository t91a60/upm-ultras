const NAV_BREAKPOINT = 768;
const NAV_OPEN_CLASS = 'open';
const SCROLL_THRESHOLD = 50;

const getNavElements = () => ({
  navToggle: document.querySelector('.nav-toggle'),
  navLinks: document.querySelector('.nav-links'),
  navElement: document.querySelector('nav'),
});

const setMenuState = (navLinks, navToggle, isOpen) => {
  navLinks.classList.toggle(NAV_OPEN_CLASS, isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navLinks.setAttribute('aria-hidden', String(!isOpen));
};

const getFocusableLink = (navLinks) => navLinks.querySelector('a');

const initScrollSpy = (navElement) => {
  if (!navElement || !('IntersectionObserver' in window)) {
    return;
  }

  const linkBySection = new Map();
  navElement.querySelectorAll('.nav-links a[href^="#"]').forEach((link) => {
    const anchor = link.getAttribute('href');
    const section = document.querySelector(anchor);
    if (section instanceof Element) {
      linkBySection.set(section, link);
    }
  });

  if (linkBySection.size === 0) {
    return;
  }

  const setActive = (link) => {
    linkBySection.forEach((candidate) => {
      if (candidate === link) {
        candidate.setAttribute('aria-current', 'location');
      } else if (candidate.hasAttribute('aria-current')) {
        candidate.removeAttribute('aria-current');
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(linkBySection.get(entry.target));
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  linkBySection.forEach((_link, section) => observer.observe(section));
};

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
  initScrollSpy(navElement);
};
