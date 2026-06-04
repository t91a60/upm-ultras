---
name: UPM Ultras
colors:
  primary: '#3a8050'
  on-primary: '#000000'
  primary-container: '#1e4028'
  on-primary-container: '#e8f0eb'
  secondary: '#4daa68'
  on-secondary: '#000000'
  background: '#000000'
  on-background: '#e8f0eb'
  surface: '#122418'
  on-surface: '#e8f0eb'
  surface-variant: '#060e09'
  on-surface-variant: '#8aaa92'
  outline: '#1e4028'
  outline-variant: '#445549'
  inverse-surface: '#e8f0eb'
  inverse-on-surface: '#000000'
  error: '#ba1a1a'
  on-error: '#ffffff'
typography:
  display-large:
    fontFamily: Bebas Neue
    fontSize: 6rem
    fontWeight: '400'
    lineHeight: 0.92
    letterSpacing: 0.04em
  title-medium:
    fontFamily: Barlow Condensed
    fontSize: 1.4rem
    fontWeight: '300'
    lineHeight: 1.5
    letterSpacing: 0.5em
  body-base:
    fontFamily: Barlow
    fontSize: 16px
    fontWeight: '300'
    lineHeight: 1.5
    letterSpacing: 0em
  label-caps:
    fontFamily: Barlow Condensed
    fontSize: 0.75rem
    fontWeight: '700'
    lineHeight: 1.5
    letterSpacing: 0.4em
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  pill: 999px
spacing:
  space-1: 0.25rem
  space-2: 0.5rem
  space-3: 0.75rem
  space-4: 1rem
  space-5: 1.5rem
  space-6: 2rem
  space-7: 3rem
  space-8: 4rem
  space-9: 5rem
  space-10: 6rem
---

# Design System: UPM Ultras

## 1. Visual Theme & Atmosphere
The design system of UPM Ultras embodies a dark, gritty, and fiercely loyal aesthetic characteristic of football ultras. The overarching mood is dramatic and intense, driven by a deep black canvas punctuated by forest and vibrant neon greens. It creates a bold, nocturnal atmosphere that feels authentic to stadium terraces and fan culture.

Whitespace is used strategically—sections are generously padded to allow large typographic statements to breathe, but information density inside cards (like news and updates) remains compact. The color temperature leans strongly towards cool, stark contrasts, with the bright greens cutting through the darkness like flares in the night.

## 2. Color Palette & Roles

### Primary Foundation
- **Pitch Black (`#000000`)**: The core background and root element color. Creates the dramatic base.
- **Deep Void (`#060e09`)** and **Dark Forest (`#0a1a10`)**: Used for staggered section backgrounds (e.g., hero vs. news sections) to create subtle depth without breaking the dark mode feel.
- **Surface Forest (`#122418`)**: Used as the primary background color for elevated surfaces like cards and containers.

### Accent & Interactive
- **Ultras Accent Green (`#3a8050`)**: The primary brand color used for primary buttons, prominent borders, and active states.
- **Flare Light Green (`#4daa68`)**: A brighter, neon-like green used for hover states, focus rings, and high-visibility interactive highlights.
- **Subtle Mid Green (`#2a5c38`)**: Used for text strokes and secondary design accents.

### Typography & Text Hierarchy
- **Off-White (`#e8f0eb`)**: Primary text color for high readability against the dark backgrounds.
- **Muted Sage (`#8aaa92`)**: Used for secondary text, descriptions, and less critical information.
- **Dim Green-Gray (`#445549`)**: Used for ultra-subtle text, placeholders, or deeply muted labels.

## 3. Typography Rules

### Hierarchy & Weights
The typographic hierarchy relies on a triad of highly distinct fonts:
- **Bebas Neue** (400 weight, tight line-height `0.92`, slight tracking `0.04em`): Reserved for massive, impactful section titles and hero typography. It screams authority and presence.
- **Barlow Condensed** (300 to 700 weights, massive tracking up to `0.5em`): Used for "eyebrows", labels, dates, and buttons. It provides a structured, militaristic secondary voice. Always uppercase.
- **Barlow** (300 weight, relaxed line-height `1.5`): The workhorse sans-serif for body copy, offering clean, modern readability.

### Spacing Principles
Text spacing contrasts heavily: large display text is packed tightly (line-height < 1) to form solid blocks of typography, while smaller uppercase labels are tracked out immensely (letter-spacing up to 0.5em) to create elegant horizontal lines.

## 4. Component Stylings

### Buttons
Buttons are strictly pill-shaped (`border-radius: 999px`) to contrast with the sharp typography. Primary buttons use the Accent Green (`#3a8050`) background with black text. They feature a smooth hover lift (`translateY(-2px)`) and a soft drop shadow, shifting to the brighter Flare Light Green on hover.

### Cards & Containers
Cards act as isolated modules of content. They use the Surface Forest (`#122418`) background with a thin 1px border of standard Green (`#1e4028`). The corners are rounded (`16px`). On hover, the border illuminates to Accent Green, the background shifts slightly, and the card lifts with a heavier shadow. Images within cards are full-bleed at the top with a subtle 16/10 aspect ratio.

### Navigation
The main navigation is a fixed, blurred glassmorphic bar (`rgba(0,0,0,0.92)` with `backdrop-filter: blur(8px)`). It features an animated bottom border that becomes Accent Green when scrolled. Links use Barlow Condensed, widely tracked, with an animated growing underline effect on hover.

## 5. Layout Principles

### Grid & Structure
The layout uses a fluid container constrained to a maximum width of `1280px`. Sections stack vertically with a zig-zag approach to background colors (alternating between Black and Deep Void). Cards are arranged using CSS Grid (`auto-fit, minmax(320px, 1fr)`).

### Whitespace Strategy
Section padding is highly fluid (`clamp(3.5rem, 6vw, 6rem)`), ensuring massive breathing room on large screens that scales down gracefully on mobile. The spacing scale is entirely REM-based.

### Alignment & Visual Balance
Heroes and manifesto sections are proudly center-aligned, projecting confidence. Content-heavy sections (like News and Contact) fall back to reliable left-alignment.

## 6. Design System Notes for Stitch Generation

### Language to Use
When generating new screens, use language like: "Dark mode ultras aesthetic", "Deep black background with forest green cards", "Vibrant neon green accents", "Massive impact uppercase typography", "Pill-shaped buttons", and "Thin green borders on dark surfaces".

### Component Prompts
- **Button**: "A pill-shaped button with a solid dark green background, black uppercase tracked-out text, that lifts slightly on hover."
- **News Card**: "A dark forest-green card with a 1px darker green border and rounded corners. The top half is an image, the bottom half contains muted secondary text and a brightly colored uppercase date label."

### Incremental Iteration
When refining this UI in Stitch, focus on adding subtle micro-interactions (like the hover arrow in the news cards) and ensure that the "gritty" feel is maintained by not over-using the bright greens—keep them reserved for strictly interactive or highly important elements.
