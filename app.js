const revealElements = document.querySelectorAll('.reveal');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navElement = document.querySelector('nav');

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

revealElements.forEach((element) => observer.observe(element));

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
