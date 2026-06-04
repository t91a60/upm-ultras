const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const SAFE_EXTERNAL_LINK_REL = ['noopener', 'noreferrer'];
const SAFE_REFERRER_POLICY = 'no-referrer';
const FALLBACK_BASE_URL = typeof document !== 'undefined' ? document.baseURI : 'https://example.com';

const getBaseUrl = () => FALLBACK_BASE_URL;

const getSafeUrl = (rawHref, baseUrl = getBaseUrl()) => {
  if (!rawHref) {
    return { href: '#', isExternal: false, isValid: false };
  }

  try {
    const parsedUrl = new URL(rawHref, baseUrl);

    if (!ALLOWED_LINK_PROTOCOLS.has(parsedUrl.protocol)) {
      return { href: '#', isExternal: false, isValid: false };
    }

    const isHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    const baseOrigin = new URL(baseUrl).origin;
    const isExternal = isHttp && parsedUrl.origin !== baseOrigin;

    return { href: parsedUrl.href, isExternal, isValid: true };
  } catch {
    return { href: '#', isExternal: false, isValid: false };
  }
};

const isAnchorElement = (element) =>
  element && typeof element.getAttribute === 'function' && element.tagName === 'A';

const buildRelValue = (existingRel) => {
  const currentTokens = (existingRel || '').split(/\s+/).filter(Boolean);
  const mergedTokens = new Set([...currentTokens, ...SAFE_EXTERNAL_LINK_REL]);

  return Array.from(mergedTokens).join(' ');
};

export const sanitizeLinkHref = (link) => {
  if (!isAnchorElement(link)) {
    return false;
  }
  const rawHref = link.getAttribute('href');
  const { isExternal, isValid } = getSafeUrl(rawHref, getBaseUrl());

  if (!isValid) {
    link.setAttribute('href', '#');
    return false;
  }

  return isExternal;
};

export const hardenLink = (link) => {
  if (!isAnchorElement(link)) {
    return;
  }

  const isExternalHttpLink = sanitizeLinkHref(link);

  if (link.getAttribute('target') === '_blank') {
    link.setAttribute('rel', buildRelValue(link.getAttribute('rel')));
  }

  if (isExternalHttpLink) {
    link.setAttribute('referrerpolicy', SAFE_REFERRER_POLICY);
  }
};

export const hardenExternalLinks = (root = document) => {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return;
  }

  const links = root.querySelectorAll('a[href]');
  links.forEach((link) => hardenLink(link));
};

// enhance navigation state: mark current/active anchor
export const markActiveLinks = (root = document) => {
  if (!root || typeof root.querySelectorAll !== 'function' || typeof location === 'undefined') {
    return;
  }

  const current = location.href;
  root.querySelectorAll('a[href]').forEach((link) => {
    try {
      const href = new URL(link.getAttribute('href'), document.baseURI).href;
      if (href === current || href === current.split('#')[0] + location.hash) {
        link.setAttribute('aria-current', 'page');
      }
    } catch (e) {
      // ignore invalid
    }
  });
};

export { getSafeUrl };
