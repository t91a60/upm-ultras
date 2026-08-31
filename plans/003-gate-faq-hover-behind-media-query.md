# 003 — Gate FAQ answer link hover behind hover media query

- **Status**: TODO
- **Commit**: 4830ab2
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, 4 lines

## Problem

`.faq-answer a:hover` is the **only** ungated `:hover` left in the codebase. It sits in the FAQ section's base rules and fires on touch devices on tap, causing a false color flash before the browser processes the navigation:

```css
/* style.css:1042-1050 — current */
.faq-answer a {
  color: var(--color-floodlight);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.faq-answer a:hover {
  color: var(--color-light-green);
}
```

Every other interactive hover (`.btn`, `.nav-links a`, `.news-card`, `.gallery-item`, `.breadcrumb-item a`, `.contact-val a`) is correctly grouped inside `@media (hover: hover) and (pointer: fine)` at style.css:1455.

## Target

Remove the ungated rule and re-declare the same `:hover` inside the existing hover media query block:

```css
/* style.css:1048 — delete this rule: */
.faq-answer a:hover {
  color: var(--color-light-green);
}
```

```css
/* add inside the @media (hover: hover) and (pointer: fine) block at style.css:1455, e.g. after the .contact-val a:hover rule which closes at the block end: */
  .faq-answer a:hover {
    color: var(--color-light-green);
  }
```

## Repo conventions to follow

- The single consolidation point is `@media (hover: hover) and (pointer: fine)` at style.css:1455 — all pointer-driven hover gets grouped there. Imitate how `.breadcrumb-item a:hover` was added (it lives at style.css:1480 inside that same block).
- No comments in rules; keep it clean.

## Steps

1. Open `style.css`.
2. Locate `.faq-answer a:hover` at lines 1048-1050 and delete that rule entirely (the three lines including the closing brace).
3. Navigate to the `@media (hover: hover) and (pointer: fine)` block opening at line 1455.
4. Inside that block, after the `.contact-val a:hover` rule (ends at line 1509, closing brace), append:
   ```css

     .faq-answer a:hover {
       color: var(--color-light-green);
     }
   ```
5. Save. Line numbers after your edits shift; do not chase them.

## Boundaries

- Do NOT modify the base `.faq-answer a` rule (color, text-decoration, text-underline-offset) — those remain active on all devices.
- Do NOT touch `.faq-answer`, `.faq-item`, or any other FAQ rule.
- Do NOT add the rule anywhere outside the hover media query block.
- If the anchors don't match when you open the file (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: run `npm run build` (must succeed) and `npm run lint` (must report 0 errors). Optionally confirm there are no remaining bare `:hover` selectors outside the media query: `rg -n ":hover" style.css` should return no selector outside line ~1455's block except none.
- **Feel check**:
  - In DevTools device emulation (mobile touch), tap an answer link in the FAQ — it should NOT flash green on contact; color change only happens on devices that actually support hover.
  - On a desktop mouse, hover over the same link — it turns `--color-light-green` as before.
- **Done when**: touch tap shows no false hover flash, desktop hover still changes color, and build + lint pass.
