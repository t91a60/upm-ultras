const REVEAL_THRESHOLD = 0.1;

const revealAll = (elements) => {
  elements.forEach((element) => element.classList.add('visible'));
};

const revealChildren = (parent) => {
  const children = parent.children;
  for (let i = 0; i < children.length; i++) {
    children[i].classList.add('visible');
  }
};

const handleImageError = (img) => {
  if (!img || img.hasAttribute('data-fallback')) {
    return;
  }
  img.setAttribute('data-fallback', '');
  if (img.dataset.fallbackSrc) {
    img.src = img.dataset.fallbackSrc;
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    const placeholder = img.nextElementSibling;
    if (placeholder && placeholder.classList.contains('news-img-placeholder')) {
      placeholder.style.display = 'flex';
    }
  }
};

const initImageFallbacks = () => {
  document.querySelectorAll('img[src]').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) {
      handleImageError(img);
      return;
    }
    img.addEventListener('error', () => handleImageError(img), { once: true });
  });
};

export const initReveal = () => {
  const elements = Array.from(document.querySelectorAll('.reveal'));
  const parents = Array.from(document.querySelectorAll('.reveal-children'));

  if (!elements.length && !parents.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    revealAll(elements);
    parents.forEach(revealChildren);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains('reveal-children')) {
            revealChildren(entry.target);
          } else {
            entry.target.classList.add('visible');
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: REVEAL_THRESHOLD }
  );

  elements.forEach((element) => observer.observe(element));
  parents.forEach((parent) => observer.observe(parent));
};

export { initImageFallbacks, handleImageError };
