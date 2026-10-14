# Ez-PAVE — interactive clinical card-news web app

<sub>🌐 **English** · [한국어](README.ko.md)<br>[← Portfolio home](../../README.md) · [Min Seoul](../minseoul-storefront/README.md) · **Ez-PAVE**</sub>

| 4 | 5:8 | ~450 | 5 |
|:-:|:-:|:-:|:-:|
| **interactive cards** | **fixed card ratio on every device** | **lines of app code** | **device families checked** |

> A mobile web app that turns a static four-card Figma design into a **tap-and-drag story** for a medical audience: the key message is revealed by the reader's own action, and the final card leads to the published journal article. Live demo: **[ez-pave.lovable.app](https://ez-pave.lovable.app)**. Client work; the source and card artwork are **not published** here.

> **TL;DR** — Figma (800×1280 cards) → React 18 + TypeScript + Vite + Tailwind + shadcn/ui, built with an AI app builder (Lovable). The interesting part is small and deliberate: a frame component that keeps the artwork ratio, a render order that guarantees "background first, motion second", and a drag-to-reveal slider built on pointer events.

## Case study at a glance

| | |
|---|---|
| **Problem** | Static card images in a messaging feed are skimmed, not read. The client wanted the core clinical message to land through interaction, and to guide readers to the full article. |
| **Approach** | Keep the client designer's artwork pixel-faithful (cards exported as images), and add interaction as a thin code layer on top: a shine sweep, a pulsing highlight, a drag-to-reveal slider, a link hotspot. |
| **What I produced** | The interactive web app built from the client's four-card Figma design; a process report documenting the Figma-to-code workflow, decisions and device checks. The visual design is the client's, not mine. |
| **Stack** | React 18 · TypeScript · Vite · Tailwind CSS 3 (HSL design tokens) · React Router · shadcn/ui · hosted on Lovable |
| **Evidence** | Live demo; ~450 lines of application code (the rest is generated UI-kit components); my process report (7 sections, device checklist) |
| **Not claimed** | Audience reach or engagement results: I have none to cite |

## How it works

| Page | Interaction | How |
|---|---|---|
| 1 Intro | Tap to enter | Whole-frame tap target |
| 2 Key message | Light sweeps across the highlighted claim | CSS shine animation masked to one region |
| 3 Clinical chart | The accent text "glows" | Accent text exported as a **separate transparent layer** so only the lettering pulses (drop-shadow animation) |
| 4 Article | Drag a handle from the start value to the target; the article card fades in, then a link hotspot and a "replay" button appear | Pointer-event slider; reveal gated on reaching the target value; link opens in a new tab |

## Decisions worth noting

| Decision | Why |
|---|---|
| **Background first, motion second.** Preload and decode the artwork, wait for two animation frames plus a short delay, then mount the animated layers. | Without it, animations start over an unpainted background and the reader sees a flash. The order is guaranteed by code, not by luck of load speed. |
| **One `PageFrame` locks the 5:8 ratio** using dynamic viewport height and centres it on a dark brand-blue field. | Cards never stretch on desktop or tablet and the mobile browser's collapsing address bar does not cause a jump. |
| **Cards stay images; interaction is an overlay.** | Pixel-faithful to the approved design, and a designer can change a card without touching code. The cost is in the review below. |
| **Pointer events, not mouse/touch pairs.** | One code path for mouse, finger and pen; the handle keeps tracking when the finger leaves it (pointer capture). |
| **Brand colours as semantic HSL tokens.** | Re-branding or a dark mode is a token change, not a search-and-replace. |
| **A visible cue before the interaction.** A blinking "drag the button down" hint appears beside the handle. | The reader must know the card is interactive within a second. |

## What I checked (from my process report)

Desktop at two sizes (card centred, not stretched); iPhone Safari (safe areas for notch and home indicator, double-tap zoom blocked); Galaxy Chrome (no 100vh jump with dynamic viewport units); iPad and Galaxy Tab in both orientations; touch, mouse and pen through one pointer path.

## Review: what I would fix

I reviewed the code the way I would review a client's project.

| Priority | Finding | Fix |
|---|---|---|
| **P1 — Accessibility** | The viewport blocks pinch-zoom (`user-scalable=no`, `maximum-scale=1`). Readers who need larger text cannot zoom. | Allow zoom; keep `touch-action: manipulation` for the double-tap behaviour instead |
| **P1 — Accessibility** | The slider is a plain `div` driven by pointer events: no keyboard control, no slider role or value, so keyboard and screen-reader users cannot reach the article card. | Use a native range input or add `role="slider"`, `aria-valuenow/min/max`, arrow-key handling |
| **P2 — Content in images** | All message text lives inside PNGs and background images have empty `alt`. Screen readers, search and translation get nothing. | Add real text alternatives per card; keep text out of images where the layout allows |
| **P2 — Metadata** | Page title and description are template leftovers (the description talks about blood-glucose visualisation, which this app is not). Link previews would be wrong. | Write real title, description and social-share tags |
| **P3 — Tests** | The only test is the generated placeholder. The reveal logic (value reaches target → card → delayed hotspot) is untested. | A small component test for the slider thresholds and the delayed overlay |
| **P3 — Weight** | The project ships the full generated UI kit (dozens of unused components). | Remove unused components; keep the bundle to what four pages need |

## What this demonstrates

- Turning a supplied design into a working interaction without losing fidelity to the approved artwork
- Small, explicit engineering decisions (render order, ratio lock, pointer capture) documented with reasons
- Cross-device testing discipline and a candid accessibility review of my own delivered work

## Honest scope

- Client project in a regulated subject area. The card artwork, article references and clinical content are not reproduced here.
- The card design was supplied by the client in Figma. My contribution is the interaction design, implementation with an AI app builder, device testing and documentation; I do not claim the visual design or hand-typed application code.
- No engagement or audience metrics are claimed.
