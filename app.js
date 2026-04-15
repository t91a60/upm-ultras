const revealElements = document.querySelectorAll('.reveal');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navElement = document.querySelector('nav');

const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const SAFE_EXTERNAL_LINK_REL = ['noopener', 'noreferrer'];
const SAFE_REFERRER_POLICY = 'no-referrer';

const sanitizeLinkHref = (link) => {
  const rawHref = link.getAttribute('href');

  if (!rawHref) {
    return false;
  }

  try {
    const parsedUrl = new URL(rawHref, window.location.href);

    if (!ALLOWED_LINK_PROTOCOLS.has(parsedUrl.protocol)) {
      link.setAttribute('href', '#');
      return false;
    }

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    link.setAttribute('href', '#');
    return false;
  }
};

const hardenLink = (link) => {
  const isExternalHttpLink = sanitizeLinkHref(link);

  if (link.getAttribute('target') === '_blank') {
    const existingRel = (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
    const relSet = new Set(existingRel);

    SAFE_EXTERNAL_LINK_REL.forEach((value) => relSet.add(value));
    link.setAttribute('rel', Array.from(relSet).join(' '));
  }

  if (isExternalHttpLink) {
    link.setAttribute('referrerpolicy', SAFE_REFERRER_POLICY);
  }
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

const closeMenu = () => {
  if (!navLinks || !navToggle) {
    return;
  }

  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
};

const toggleMenu = () => {
  if (!navLinks || !navToggle) {
    return;
  }

  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('menu-open', isOpen);
};

const hardenExternalLinks = () => {
  document.querySelectorAll('a[href]').forEach((link) => {
    hardenLink(link);
  });
};

revealElements.forEach((element) => observer.observe(element));
hardenExternalLinks();

window.addEventListener('scroll', () => {
  if (navElement) {
    navElement.classList.toggle('scrolled', window.scrollY > 50);
  }
});

if (navToggle && navLinks) {
  navToggle.addEventListener('click', toggleMenu);

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}

console.log('Ultras Polonia Miedzyrzecze 2026');
console.log('© UPM. All rights reserved.');
