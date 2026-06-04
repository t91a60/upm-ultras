Purpose
These instructions guide GitHub Copilot suggestions for frontend code in this repository. They prioritize semantic HTML, accessible and minimal SaaS-style UI, mobile-first responsive design, Tailwind CSS preferences, and small reusable components. Use these rules to make AI suggestions predictable, readable, and production-ready.

Scope
- Applies to HTML, CSS, JavaScript, and optional React components in this repository.
- Assume a modern frontend stack (mobile-first, Tailwind-first, optional React with small components) unless a file explicitly uses another approach.

1. Project assumptions and compatibility
- If a file uses plain CSS (for example, `index.html` + `style.css`), keep changes backwards-compatible: prefer adding Tailwind layer or utility classes gradually rather than wholesale rewrite.
- For new components or pages prefer Tailwind CSS utilities and semantic HTML. If Tailwind is not yet installed, produce code that can be translated easily to utilities (clear class lists and atomic style suggestions).

2. Semantic HTML
- Use the correct semantic element for content: `main`, `header`, `nav`, `footer`, `section`, `article`, `aside`, `figure`, `figcaption`, `time`, `address`, `form`, `label`.
- Always include `alt` on images, and use `role` only when no semantic element fits.
- Use heading hierarchy (H1 → H2 → H3) and avoid skipping levels.
- Prefer `<button>` for actions, `<a>` for navigation. Avoid clickable non-semantic elements (no clickable `div`/`span` without controlling keyboard focus and role).

3. Accessibility (A11y) first
- Ensure keyboard accessibility: focusable controls, logical tab order, visible focus states (Tailwind: `focus:outline-none focus:ring-2 focus:ring-offset-2`).
- Use `aria-*` attributes only to augment native semantics (e.g., `aria-expanded` on toggles, `aria-controls` for controlled regions). Do not duplicate semantics with ARIA where native HTML suffices.
- Provide skip links for long pages and landmark regions (`<a class="skip-link" href="#main">Skip to content</a>`).
- Always ensure colour contrast meets WCAG AA for normal text (4.5:1) and large text (3:1). When providing color suggestions prefer semantic tokens (e.g., `text-muted`, `bg-accent`) not raw hex.

4. Mobile-first responsive design
- Design mobile-first: write base styles for small screens, then add responsive modifiers (Tailwind: `sm:`, `md:`, `lg:`) for larger viewports.
- Keep interactions touch-friendly: hit targets >= 44px, sufficient spacing between tappable items.
- Use progressive enhancement: critical content first, defer non-essential resources and third-party scripts.

5. Tailwind CSS preference
- Prefer Tailwind utility classes for layout, spacing, typography, and state styles. Example pattern for a card:

  <div class="bg-white/5 rounded-lg p-4 shadow-sm hover:shadow-md transition">…</div>

- When Tailwind is not yet present, recommend the exact utility class alternatives alongside plain CSS declarations to make migration straightforward.
- Avoid creating many one-off custom classes. If a style is reused across >2 places, create a small component class or a Tailwind plugin/utility.

6. Components and reusability
- Keep components small and focused (render one piece of UI, accept props for customization). Aim for <150 lines per component file.
- Favor composition over inheritance: build small building blocks (`Button`, `Icon`, `Card`, `Avatar`, `FormField`) and compose them.
- Provide clear prop contracts and sensible defaults. Avoid over-generalized components that require many boolean flags.
- Name components clearly (PascalCase for React components, kebab-case for web components or CSS classes).

7. Simplicity and avoidance of over-engineering
- Prefer simple, readable solutions over clever optimizations. Avoid micro-optimizations before profiling.
- Reject suggestions that introduce complex state machines, heavy libraries, or premature performance wiring for trivial pages.
- Use native browser features where possible (e.g., `loading="lazy"` on images, `<details>` for simple disclosure content, CSS `position: sticky`).

8. JavaScript and React guidance
- Keep JS modules small and single-purpose. Export pure functions where possible.
- For React:
  - Use functional components and hooks.
  - Keep local state minimal; lift state only when necessary.
  - Prefer clear prop names and controlled components for forms.
  - Avoid deep prop drilling; prefer composition or context for shared concerns.
  - Avoid overuse of memoization—only when re-renders are demonstrated to be problematic.

9. Accessibility-first interactive patterns
- Navigation toggles: update `aria-expanded`, `aria-controls`, and manage focus when opening/closing menus.
- Modal/dialog: trap focus, restore focus on close, support `Escape` to close, and include `aria-modal="true"` and `role="dialog"` with a labelled title.
- Forms: pair `<label>` with inputs via `for`/`id`, expose validation messages with `aria-live` polite region.

10. Styling and theming
- Prefer semantic tokens (e.g., `--color-bg`, `--color-text`, `--space-1`) and Tailwind theme tokens when building UI systems.
- Keep CSS custom properties in a small well-documented set if custom CSS exists; do not scatter color hexes and sizes across the codebase.

11. Performance & progressive enhancement
- Defer non-critical scripts (`defer`/`async`), preload important images/fonts, and prefer responsive image techniques (`srcset`, `sizes`).
- Use `prefetch`/`preload` sparingly and only for resources required for the initial experience.

12. Code style and readability
- Write small functions and components, favor declarative code and explicit variable names.
- Keep line length ≤100 characters where practical. Use consistent indentation (2 spaces preferred).
- Use human-readable CSS class names when writing custom CSS. When using Tailwind prefer grouped utility ordering (layout → spacing → typography → color → state).

13. Testing and validation
- Add basic unit tests for UI logic (e.g., form validation helpers) and interaction tests for critical flows.
- Validate generated HTML with an HTML validator and run accessibility audits (axe-core) on critical pages.

14. Commit & PR guidance for frontend changes
- Small focused PRs. Each PR should include a short description, design rationale, and any accessibility considerations.
- Include before/after screenshots for visual changes and a short test plan for reviewers to follow (keyboard-only, screen reader quick pass).

15. AI / Copilot behaviour rules
- Prefer concise, minimal UI patterns rather than generic bulky templates. Suggest simple, readable markup and utility classes.
- When generating components, include accessibility attributes and keyboard behaviors by default.
- Avoid inventing custom frameworks or introducing heavy dependencies without explicit instruction.
- If asked to migrate existing CSS to Tailwind, produce side-by-side examples (existing CSS → Tailwind class list) to ease review.
- When unsure, prefer conservative suggestions that keep existing behavior intact (non-breaking changes).

Examples (Good vs Bad)
- Good (semantic, accessible):
  <button class="px-4 py-2 rounded bg-accent text-white" aria-expanded="false">Menu</button>

- Bad (non-semantic / inaccessible):
  <div class="menu-btn">Open</div>

Final notes
- This repository currently contains handcrafted CSS (`style.css`) and plain HTML pages. For ongoing work, prefer new files and components follow the Tailwind-first, semantic, and accessible guidelines above. When modifying existing pages, keep changes incremental and compatible.

If you want, I can also generate a small Tailwind config + example component and a migration checklist to convert a page to Tailwind incrementally.
