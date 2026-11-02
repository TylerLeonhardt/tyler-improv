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
- `--surface: #eeeee7`: understated empty states.
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

The hero is text and an unobscured performance-photo carousel, stacked below 760px.
Show listings are ruled rows: compact date, title, Seattle-local time and venue,
then ticket/calendar links. Optional show art is a secondary 3:2 thumbnail;
omit the thumbnail entirely when there is no real art. Do not make images
required or change `shows.json` or the add-show contract for styling work.
Past shows remain collapsed and omit actions and artwork.

Use Astro's responsive `Image` for site photography, with accurate `sizes`,
descriptive alt text, eager loading only for the hero, and lazy loading elsewhere.
Do not add client frameworks or font services.

## Accessibility and verification

Preserve semantic landmarks, heading order, the skip link, visible keyboard focus,
44px action targets, readable text contrast, and the native past-shows disclosure.
Only subtle color transitions and the carousel crossfade are appropriate; honor reduced
motion for transitions and scrolling.

## Hero carousel

Use `HeroCarousel.astro`, not a carousel library or a duplicate bottom gallery.
Keep all images in the same 4:5 grid cell, with per-photo `object-position` to
preserve faces. Use optimized Astro images and responsive sizes; only the first
photo is eager/high priority, the others are lazy.

Use an eight-second interval and a 1.2-second photo-only opacity crossfade, never
sliding, zooming, or animated transforms. Switch captions immediately so text
stays readable during transitions. Pause on hover, keyboard focus, and hidden tabs.
Manual navigation pauses rotation until Play is selected; an explicit Pause must
persist across hover/focus changes. Reduced motion disables autoplay, including
the Play control, and removes the crossfade. Keep a static first photo without JS.

Keep controls below the photo, with 44px targets, visible focus, Previous/Next,
a photo count, and a Pause/Play control first in tab order. Label the carousel and
numbered slides with ARIA roledescriptions; hide inactive slides from assistive
technology. Announce manual changes politely, never every automatic advance.
Support native button keyboard activation and Left/Right within the controls.

## Copy voice

Start with "What does this really provide?" This site identifies Tyler and gives
visitors show dates, venues, tickets, and calendar links. Write for those tasks:
plain, specific, confident, and brief. Preserve verified facts; invent nothing.

- Do: "Find my next show." / "Dates, venues, and tickets below."
- Do: "Upcoming shows" / "All times are Seattle local time."
- Do: "Tyler Leonhardt has performed improv in Seattle since 2023."
- Don't: "On stage, in the moment." / "Improv made together in Seattle."
- Don't: "See you at a show." / "In good company." / "he'd love to see you there."

Avoid marketing promises, wordplay, comedy routines, and "yes, and" jokes.
Remove filler instead of replacing it with another slogan. Captions identify the
photo or venue; show rows need no decorative text when artwork is absent.

Run `npm test`, `npx astro check`, and `npm run build` (there is no separate linter).
Check desktop and narrow mobile layouts, keyboard navigation, reduced motion,
empty/populated/archived show states, and stale-build date filtering in a browser.
Never put preview shows into the real show list.
