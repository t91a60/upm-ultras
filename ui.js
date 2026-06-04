const REVEAL_THRESHOLD = 0.1;

const revealAll = (elements) => {
  elements.forEach((element) => element.classList.add('visible'));
};

export const initReveal = () => {
  const elements = Array.from(document.querySelectorAll('.reveal'));

  if (!elements.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    revealAll(elements);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: REVEAL_THRESHOLD }
  );

  elements.forEach((element) => observer.observe(element));
};
