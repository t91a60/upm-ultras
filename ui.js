const REVEAL_THRESHOLD = 0.1;

const revealAll = (elements) => {
  elements.forEach((element) => element.classList.add('visible'));
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

export const initLightbox = () => {
  const dialog = document.querySelector('.lightbox');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

  if (!dialog || !galleryItems.length) {
    return;
  }

  const img = dialog.querySelector('.lightbox-img');
  const caption = dialog.querySelector('.lightbox-caption');
  const closeButton = dialog.querySelector('.lightbox-close');

  if (!img || !caption || !closeButton) {
    return;
  }

  const openLightbox = (item) => {
    const source = item.querySelector('img');
    const label = item.querySelector('.gallery-label');

    if (source) {
      img.src = source.currentSrc || source.src;
    }
    caption.textContent = label ? label.textContent.trim() : '';

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  };

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
  });

  closeButton.addEventListener('click', () => {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
};

export { initImageFallbacks, handleImageError };
