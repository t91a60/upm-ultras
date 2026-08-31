# Animation Plans

Audit plans for the UPM Ultras site (`C:\Users\sellb\Documents\GitHub\upm-ultras`), produced by the `improve-animations` workflow at commit `4830ab2`.

## Status

| # | Title | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| 001 | Gate smooth scroll under reduced motion | MEDIUM | Accessibility | DONE |
| 002 | Add press feedback to news cards and gallery items | MEDIUM | Physicality & origin | DONE |
| 003 | Gate FAQ answer link hover behind hover media query | MEDIUM | Accessibility | DONE |

## Recommended execution order

Execute in numeric order (**001 → 002 → 003**).

## Dependencies

- None between plans — each touches a distinct part of `style.css` and can be applied independently.
- All three touch the same file (`style.css`), so if applying to a shared worktree, apply sequentially and re-check the later plan's line anchors after each prior plan shifts lines.

## Noted but not planned

- Mobile nav drawer (`style.css:1169-1174`) snaps open/closed with no motion while its own toggle animates — missed opportunity, deferred (finding #5).
- `.news-card` / `.card` hover transform runs at `0.4s` (400ms) vs the 200ms button convention — cohesion/easing finding, deferred (finding #4).
- Dead `.card` class (`style.css:210`) defines hover transitions but is unused in HTML — code-quality, not motion.
