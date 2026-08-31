# 001 — Gate smooth scroll under reduced motion

- **Status**: DONE
- **Commit**: 4830ab2
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, 3 lines

## Problem

`html` has `scroll-behavior: smooth` set globally, so every anchor jump and keyboard-driven scroll animates:

```css
/* style.css:88-93 — current */
@layer base {
  html {
    scroll-behavior: smooth;
    scroll-padding-top: 64px;
    -webkit-tap-highlight-color: transparent;
  }
```

The `prefers-reduced-motion` block (style.css:1512) currently only forces `animation-duration`, `transition-duration`, and `animation-iteration-count` to near-zero — none of which affect `scroll-behavior`. Smooth scrolling therefore persists for users who request reduced motion, causing unintended page-jump animation.

## Target

Within the existing `@media (prefers-reduced-motion: reduce)` block at style.css:1512, set `scroll-behavior: auto` on `html`. Result:

```css
/* styled target */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  html {
    scroll-behavior: auto;
  }

  .reveal,
  .reveal-children > * {
    opacity: 1 !important;
    transform: none !important;
  }

  body::after {
    display: none;
  }
}
```

## Repo conventions to follow

- All reduced-motion handling already lives in the single `@media (prefers-reduced-motion: reduce)` block at style.css:1512. Add the new rule inside it — do NOT create a second block.
- No comments are used in this file's rules; keep it consistent (no added comments).

## Steps

1. Open `style.css`.
2. Inside the `@media (prefers-reduced-motion: reduce)` declaration block starting at line 1512, insert the following rule directly after the `*`/`*::before`/`*::after` rule (i.e. after the closing brace at line 1519):
   ```css
   html {
     scroll-behavior: auto;
   }
   ```
3. Save. Line numbers of subsequent rules in the file will shift by 3; do not chase them.

## Boundaries

- Do NOT touch `scroll-padding-top`, `-webkit-tap-highlight-color`, or anything else in the `@layer base` block.
- Do NOT change the base `scroll-behavior: smooth` for non-reduced-motion users — it is intentional.
- Do NOT modify any other rule in the reduced-motion block.
- If the block or its lines don't match when you open the file (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: run `npm run build` (must succeed) and `npm run lint` (must report 0 errors).
- **Feel check**:
  - In DevTools Rendering panel, enable `prefers-reduced-motion: reduce`.
  - Click an in-page anchor link (e.g. a nav link to `#kontakt`). Confirm the page **jumps instantly** with no smooth scroll.
  - Disable reduced-motion (set to `no-preference`) and re-click the same anchor. Confirm smooth scrolling is restored.
- **Done when**: reduced-motion jumps instantly, no-preference still smooth-scrolls, and build + lint pass.
