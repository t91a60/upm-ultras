const r = document.querySelectorAll('.reveal'),
  o = new IntersectionObserver(
    (e) => {
      e.forEach((e) => {
        e.isIntersecting && (e.target.classList.add('visible'), o.unobserve(e.target));
      });
    },
    { threshold: 0.1 }
  ),
  t = document.querySelector('.nav-toggle'),
  n = document.querySelector('.nav-links'),
  a = (e) => {
    (e.ctrlKey || e.metaKey) &&
      (e.key === 's' ||
        e.key === 'u' ||
        e.key === 'p' ||
        e.key === 'c' ||
        e.key === 'x' ||
        e.key === 'i' ||
        e.key === 'j') &&
      e.preventDefault(),
      e.key === 'F12' && e.preventDefault(),
      e.shiftKey && e.key === 'F10' && e.preventDefault();
  },
  s = () => {
    try {
      window.top !== window.self && window.top.location.replace(window.self.location.href);
    } catch (e) {
      window.location.replace(window.location.href);
    }
  };

r.forEach((e) => o.observe(e)),
  window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 50);
  }),
  t && t.addEventListener('click', () => n.classList.toggle('open')),
  console.log('Ultras Polonia Miedzyrzecze 2026'),
  console.log('© UPM. All rights reserved.'),
  document.addEventListener('contextmenu', (e) => e.preventDefault()),
  document.addEventListener('selectstart', (e) => e.preventDefault()),
  document.addEventListener('keydown', a),
  window.addEventListener('dragstart', (e) => e.preventDefault()),
  document.addEventListener('copy', (e) => e.preventDefault()),
  window.addEventListener('load', s),
  setInterval(s, 1500);
