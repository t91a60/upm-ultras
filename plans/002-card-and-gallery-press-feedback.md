# 002 — Add press feedback to news cards and gallery items

- **Status**: TODO
- **Commit**: 4830ab2
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, ~8 lines

## Problem

`.news-card` and `.gallery-item` are interactive (`.gallery-item` sets `cursor: pointer` at style.css:707; both have hover-lift states) but have **no `:active` press feedback**. The only scalable press feedback in the app is on `.btn`:

```css
/* style.css:177-179 — the existing correct pattern to imitate */
  .btn:active {
    transform: scale(0.97);
  }
```

Cards lift on hover but never compress on press, so clickers get no physical confirmation that the press registered.

## Target

Add a subtle `:active` press to both cards, matching the `.btn` convention but gentler since cards are larger surfaces:

```css
/* target — place inside the existing @media (hover: hover) and (pointer: fine) block at style.css:1455 */
  .news-card:active {
    transform: scale(0.98);
  }

  .gallery-item:active {
    transform: scale(0.98);
  }
```

## Repo conventions to follow

- The existing press feedback target is `.btn:active { transform: scale(0.97); }` at style.css:177 (restated in the 480px media block at style.css:1432). Cards use `0.98` — slightly subtler, per AUDIT.md (keep press subtle 0.95–0.98).
- All pointer-driven feedback is grouped inside the single `@media (hover: hover) and (pointer: fine)` block at style.css:1455 (the block with `.btn:hover`, `.news-card:hover`, `.gallery-item:hover`, etc.). Add there for cohesion.
- Note: `:active` already has a press feel WITHOUT the media query on `.btn` (the rule at 177 is outside any media query). For cards, gate with the hover media query is acceptable and follows the existing hover grouping; primary requirement is `transform: scale(0.98)` on `:active`.

## Steps

1. Open `style.css`.
2. Navigate to the `@media (hover: hover) and (pointer: fine)` block that opens at line 1455.
3. Inside that block, after the `.news-card:hover .news-arrow` rule (ends at line 1496, closing brace `}`), append:
   ```css
     .news-card:active {
       transform: scale(0.98);
     }

     .gallery-item:active {
       transform: scale(0.98);
     }
   ```
4. Save. Line numbers after your insertion shift; do not chase them.

## Boundaries

- Do NOT add `:active` press feedback to any other element.
- Do NOT alter the existing `.news-card:hover` or `.gallery-item:hover` rules.
- Do NOT change markup or HTML — motion/state only.
- If the hover block or its anchors don't match when you open the file (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: run `npm run build` (must succeed) and `npm run lint` (must report 0 errors).
- **Feel check**:
  - In DevTools, open the Rendering panel and set playback percentage to a low value (e.g. 25%) so transitions are easy to observe, or just press-and-hold.
  - Mouse down on a news card in the news grid: it should visibly compress to 98% while held, and pop back on release (the existing `transform 0.4s var(--ease-out)` on `.news-card` at style.css:634 drives the return).
  - Repeat for a gallery item.
- **Done when**: both cards compress on press in a mouse-driven environment and the hover still lifts on hover, and build + lint pass.
