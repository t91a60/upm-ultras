describe('links module', () => {
  test('getSafeUrl recognizes mailto and http and external', async () => {
    const { getSafeUrl } = await import('../links.js');
    const r1 = getSafeUrl('mailto:foo@bar.com', 'https://example.com/');
    expect(r1.isValid).toBe(true);
    expect(r1.isExternal).toBe(false);

    const r2 = getSafeUrl('https://example.com/page', 'https://example.com/');
    expect(r2.isValid).toBe(true);
    expect(r2.isExternal).toBe(false);

    const r3 = getSafeUrl('https://google.com', 'https://example.com/');
    expect(r3.isValid).toBe(true);
    expect(r3.isExternal).toBe(true);
  });

  test('hardenLink adds rel and referrerpolicy for external target _blank', async () => {
    const { hardenLink } = await import('../links.js');
    document.body.innerHTML = '<a id="lnk" href="https://google.com" target="_blank">x</a>';
    const a = document.getElementById('lnk');
    hardenLink(a);
    const rel = a.getAttribute('rel') || '';
    expect(rel.includes('noopener')).toBe(true);
    expect(a.getAttribute('referrerpolicy')).toBe('no-referrer');
  });
});
