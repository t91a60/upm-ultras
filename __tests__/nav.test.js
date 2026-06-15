describe('nav module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav>
        <button class="nav-toggle" aria-expanded="false"></button>
        <ul class="nav-links" id="nav-links">
          <li><a href="#one">One</a></li>
          <li><a href="#two">Two</a></li>
        </ul>
      </nav>`;
  });

  test('toggle open/close on click and Escape key closes', async () => {
    const { initNav } = await import('../nav.js');
    initNav();
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    // simulate click
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(links.classList.contains('open')).toBe(true);

    // simulate Escape key
    const esc = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(esc);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(links.classList.contains('open')).toBe(false);
  });
});
