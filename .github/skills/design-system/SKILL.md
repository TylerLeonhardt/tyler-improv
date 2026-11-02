---
name: design-system
description: Maintain the clean editorial visual style of Tyler Leonhardt's improv site. Use for layout, typography, color, copy, accessibility, or component design changes.
---

# Visual design

The site should feel warm, quiet, and considered. Let typography, real performance
photography, and generous whitespace do the work. Avoid theatre-themed decoration,
ticket notches, dashed borders, gradients, emoji, novelty copy, and animated transforms.

## Tokens and type

Use the existing tokens in `src/styles/global.css`, not one-off colors:

- `--paper: #f8f7f3`: warm off-white page background.
- `--surface: #eeeee7`: understated empty states and show-art placeholders.
- `--ink: #232c28`: primary text.
- `--muted: #626963`: secondary text, still accessible on paper and surface.
- `--accent: #304e41`: deep green links, actions, and date markers.
- `--line: #d7dad2`: decorative rules, never the only indication of an interactive control.

Fraunces Variable is the display face: regular, non-italic, with `SOFT` and `WONK`
set to zero. Inter Variable is the body face. Both are self-hosted Latin subsets.
Keep headings light and tightly tracked; body text uses comfortable 1.7 line height.
Small uppercase labels are for section context, not long sentences.

## Layout and components

The shared `.frame` is at most 64rem wide with 1.5rem mobile gutters.
Use a 0.5rem-based spacing rhythm; sections have 3.5rem vertical padding on mobile
and 4.5rem on desktop. Thin rules separate sections. Avoid card shadows and rounded pills.

The hero is text and an unobscured performance photograph, stacked below 760px.
Show listings are ruled rows: compact date, title, Seattle-local time and venue,
then ticket/calendar links. Optional show art is a secondary 3:2 thumbnail;
missing art uses a quiet solid-color typographic placeholder. Do not make images
required or change `shows.json` or the add-show contract for styling work.
Past shows remain collapsed and omit actions and artwork.

Use Astro's responsive `Image` for site photography, with accurate `sizes`,
descriptive alt text, eager loading only for the hero, and lazy loading elsewhere.
Do not add client frameworks or font services.

## Accessibility and verification

Preserve semantic landmarks, heading order, the skip link, visible keyboard focus,
44px action targets, readable text contrast, and the native past-shows disclosure.
Only subtle color transitions are appropriate; honor reduced motion for transitions
and scrolling. Copy is direct and personable, never a comedy routine.

Run `npm test`, `npx astro check`, and `npm run build` (there is no separate linter).
Check desktop and narrow mobile layouts, keyboard navigation, reduced motion,
empty/populated/archived show states, and stale-build date filtering in a browser.
Never put preview shows into the real show list.
