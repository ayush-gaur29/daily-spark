---
name: Nocturne Editorial
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#36393f'
  surface-container-lowest: '#0b0e13'
  surface-container-low: '#191c21'
  surface-container: '#1d2025'
  surface-container-high: '#272a30'
  surface-container-highest: '#32353a'
  on-surface: '#e1e2e9'
  on-surface-variant: '#d5c4b3'
  inverse-surface: '#e1e2e9'
  inverse-on-surface: '#2e3036'
  outline: '#9d8e7f'
  outline-variant: '#504538'
  surface-tint: '#f9bb6a'
  primary: '#ffc67d'
  on-primary: '#462a00'
  primary-container: '#e5a95a'
  on-primary-container: '#633e00'
  inverse-primary: '#835409'
  secondary: '#fcba61'
  on-secondary: '#462a00'
  secondary-container: '#8a5800'
  on-secondary-container: '#ffdaaf'
  tertiary: '#cad0de'
  on-tertiary: '#2b313c'
  tertiary-container: '#afb4c2'
  on-tertiary-container: '#404652'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb6'
  primary-fixed-dim: '#f9bb6a'
  on-primary-fixed: '#2a1800'
  on-primary-fixed-variant: '#643f00'
  secondary-fixed: '#ffddb6'
  secondary-fixed-dim: '#fcba61'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#643f00'
  tertiary-fixed: '#dde2f1'
  tertiary-fixed-dim: '#c1c6d5'
  on-tertiary-fixed: '#161c26'
  on-tertiary-fixed-variant: '#414753'
  background: '#111319'
  on-background: '#e1e2e9'
  surface-variant: '#32353a'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 30px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 30px
    letterSpacing: 0em
  quote-editorial:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies mindful luxury, intentional quietude, and refined introspection. Designed for deep daily reflection, habit contemplation, and personal growth, it prioritizes a slow-tech experience reminiscent of modern archival journals and high-end editorial volumes.

The visual direction combines warm modern minimalism with tactile editorial sensibility:
- **Atmospheric & Subdued**: Anchored by midnight charcoals and deep ink hues rather than stark OLED blacks, creating a soft, paper-like night aesthetic.
- **Editorial Literary Elegance**: Evocative serif display typography delivers thoughtful gravitas for prompts, essays, and meditations, while an ultra-clean sans-serif keeps navigation structured and unburdensome.
- **Luminescent Focal Points**: Restrained applications of warm amber gold mimic candlelight, guiding the user's attention deliberately toward single actions without visual clamor.

## Colors

The palette establishes an intimate, serene environment suited for early morning contemplation and late-evening reflection.

- **Primary (`#E5A95A`) & Secondary (`#D49742`)**: Warm amber and burnished gold. Reserved strictly for active reflection states, audio playback toggles, completed streak milestones, and primary action buttons. Never use these tones for large background fills.
- **Neutral Canvas (`#0E1116`) & Surface (`#141820`)**: Deep inky charcoal foundations that prevent eye strain and feel organic rather than synthetic.
- **Tertiary Surface (`#252B36`)**: An elevated slate tone for interactive cards, input containers, and floating navigation bars.
- **Text Hierarchies**:
  - Primary Content: Warm Cream (`#F4EFEA`) provides high legibility with zero glare.
  - Secondary Content: Muted Warm Stone (`#9E9B96`) for timestamps, metadata, and passive descriptions.
  - Subtle Borders: Faint translucent white (`rgba(255, 255, 255, 0.08)`) maintains quiet edge definition without visual noise.

## Typography

The pairing between Newsreader and Plus Jakarta Sans resolves the friction between literary poetry and systematic interface design:

- **Newsreader**: Assigned to introspective moments—daily spark prompts, quote cards, long-form reflection reads, and celebration headings. Employ its natural italic posture sparingly for emphasis or author attributions.
- **Plus Jakarta Sans**: Provides functional, human-centric geometry for UI scaffolding, form inputs, metadata chips, status tags, and bottom bar navigation.
- **Letter Spacing**: Extended slightly on micro-labels (`label-md`, `label-sm`) with uppercase transformations to anchor metadata quietly, while headlines feature subtle negative tracking to preserve an editorial spine.

## Layout & Spacing

A mobile-first, tactile column layout built to encourage relaxed thumb interactions and unhurried reading cadence:

- **Margins & Safe Zones**: Native mobile screens enforce a `1.25rem` (20px) outer screen margin, expanding to `2.5rem` (40px) on tablet viewports. The bottom edge consistently clears `5.5rem` (88px) to provide natural spacing for the floating navigation bar.
- **Vertical Breathing Room**: Spacing between distinct reflective sections defaults to `space-xl` (40px). Text paragraphs maintain `space-md` gaps to simulate open book typesetting.
- **Touch Targets**: All actionable components (audio play circles, bottom navigation anchors, bookmark toggles) honor an absolute minimum dimension of 48x48px with generous internal padding.

## Elevation & Depth

Visual hierarchy relies on quiet tonal layering and soft luminance rather than direct, harsh shadows:

- **Base Layer**: `#0E1116` holds global page backgrounds and safe area offsets.
- **Surface Layer**: Cards and reflection prompts sit on `#141820` with a persistent hairline stroke of `rgba(255, 255, 255, 0.08)`.
- **Floating Containers**: Persistent components like the bottom dock and audio playback sheets use `#1A202A` paired with backdrop-filter blur (`16px`) and a subtle ambient drop shadow: `0 12px 32px rgba(0, 0, 0, 0.45)`.
- **Amber Glow**: Active audio tracks or focused prompt cards introduce a diffuse, warm ambient aura: `0 0 24px rgba(229, 169, 90, 0.12)`.

## Shapes

The shape structure emphasizes organic comfort and friendly ergonomics:

- **Full Pills (`rounded-full`)**: Interactive call-to-actions, category filters, audio scrub handles, and the bottom dock shell utilize full border radiuses to invite physical touch.
- **Contained Modules (`rounded-2xl` / 24px–32px)**: Daily spark cards, quote canvases, and journal entry blocks take broad, soft curved corners that feel like bound pocket notebooks.
- **Interactive Micro-Surfaces (`rounded-xl` / 16px)**: Form fields, multi-choice mood selectors, and quick-tag chips employ softer 16px radiuses to maintain visual unity with parent containers.

## Components

### Primary & Action Buttons
- **Primary Pill**: Height of 52px, filled with warm amber (`#E5A95A`), label set in `body-md` (bold, `#0E1116`). On press, scales to `0.98` with secondary gold transition (`#D49742`).
- **Secondary Ghost Pill**: Translucent background (`rgba(255, 255, 255, 0.04)`), 1px stroke of `rgba(255, 255, 255, 0.12)`, text in warm cream (`#F4EFEA`).

### Editorial Reflection Cards
- Deep surface container (`#141820`) wrapped in a 1px border of `rgba(255, 255, 255, 0.08)`.
- Features an asymmetric internal layout: top-anchored category eyebrow in `label-sm` (amber-tinted), center quote or prompt in Newsreader (`headline-md`), and bottom action row (audio trigger, save action) formatted in stone gray (`#9E9B96`).

### Audio Spark Player
- Circular button (56px) featuring a glowing state indicator.
- Center play/pause glyph finished in charcoal against an amber pill background, paired with a subtle animated progress track using `rgba(229, 169, 90, 0.25)`.

### Form Fields & Reflective Inputs
- Borderless background (`rgba(255, 255, 255, 0.03)`), transitioning to an active inner glow of `rgba(229, 169, 90, 0.3)` when focused.
- Placeholder text in `#9E9B96` (Newsreader italic for introspective prompts, Plus Jakarta Sans for factual inputs).

### Bottom Ergonomic Navigation Bar
- Floating pill structure anchored 20px above the screen's bottom edge.
- Background finished in `#141820` with a 20px blur and `rgba(255, 255, 255, 0.08)` outline.
- Houses three dedicated destinations: **Today**, **Saved**, and **Profile**. Active destination renders in `#E5A95A` with an ambient glow pip beneath; inactive items rest in muted gray (`#9E9B96`).