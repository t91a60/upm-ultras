export const registerSW = () => {
  if (!('serviceWorker' in navigator)) { return; }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/upm-ultras/sw.js', { scope: '/upm-ultras/' }).catch(() => {});
  });
};
