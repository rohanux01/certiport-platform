# SEED Infotech — Design Theme (v1.0)

**Source of truth:** Lovable project `SEED Launchpad` (`99ecf060-8084-4c8b-a1d2-cc9db1594c68`), commit `7011666` (last edit 28 Sep 2026).
**Stack the theme lives in:** React 18 + Vite + TypeScript + Tailwind CSS 3.4 + shadcn/ui (Radix) + `tailwindcss-animate` + `lucide-react`.
**Brand line:** *SEED — Beyond the Obvious.* Personality: modern, fresh, student-focused, "premium" but warm. Trustworthy institute (since 1994) with a tech-forward, AI-era feel.

> **How to use this document:** Give it to every developer (and every AI coding tool: VS Code, Antigravity, Copilot, Cursor). It describes what the project **already is**. It is not a redesign. Where the code contains inconsistencies, they are listed in §14 and are **not** to be "fixed" without the owner's written approval.

---

## 0. Governance rules (non-negotiable)

1. **Do not change anything without the owner's explicit permission**: no colour, font, radius, spacing, copy, layout or component changes "to improve it".
2. **Do not touch the database** (Supabase schema, RLS policies, migrations, edge functions, seed data, `.env` values).
3. **Do not touch features or functionality**: routing, forms, OTP, payment (Easebuzz), WhatsApp automation, CRM, admin portals, tracking (GTM / dataLayer events), SEO tags.
4. New UI must be built **only from tokens and components in this document**. If something you need does not exist here, **stop and ask**; do not invent a new colour, shadow or radius.
5. Never hard-code a hex/HSL value in a component when a token exists (see §14 for known legacy exceptions; do not copy them into new code).

---

## 1. Design principles

| Principle | What it means in practice |
|---|---|
| **Warm-neutral + indigo** | Text is warm charcoal (not pure black); the interactive colour is a single indigo. Orange is the *highlight/energy* colour, used sparingly. |
| **Soft & rounded** | Big radii (cards 16px, buttons 12px, pills fully round). No sharp corners on marketing surfaces. |
| **Layered depth, not borders** | Cards float using a 3-layer soft shadow (`shadow-premium`), lifting on hover (`-translate-y`). |
| **Calm motion** | Gentle fades, floats and lifts. Nothing bounces aggressively. `prefers-reduced-motion` must always be honoured. |
| **Outcome-led copy blocks** | Every section = small pill label → bold H2 with one accent-coloured keyword → muted sub-line → content → (often) a call CTA. |
| **Mobile-first tap targets** | Interactive elements are at least 44px (`min-h-11`); menus collapse into accordions. |

---

## 2. Colour system

All colours are **HSL CSS variables** defined in `src/index.css` and exposed to Tailwind in `tailwind.config.ts` as `hsl(var(--token))`. Always use the Tailwind semantic class (`bg-accent`, `text-muted-foreground`), never the raw value.

### 2.1 Core tokens (light mode — default)

| Token | HSL | Hex (approx.) | Role |
|---|---|---|---|
| `--background` | `210 20% 99%` | `#FCFCFD` | Page background |
| `--foreground` | `41 12% 23%` | `#423D34` | Body text, headings (warm charcoal "Armadillo") |
| `--card` / `--card-foreground` | `210 20% 99%` / `41 12% 23%` | `#FCFCFD` / `#423D34` | Card surface |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Menus, popovers |
| `--primary` | `41 12% 23%` | `#423D34` | **Dark** brand colour: default buttons, dark trust cards, dark badges (this is *not* the blue) |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on primary |
| `--secondary` | `210 25% 96%` | `#F2F5F7` | Soft tint: hover fills, pills, ghost hover |
| `--muted` | `210 20% 95%` | `#F0F2F5` | Muted surfaces, table headers |
| `--muted-foreground` | `210 10% 38%` | `#57616B` | Secondary text |
| **`--accent`** | **`239 70% 58%`** | **`#494BDF`** | **Brand Indigo**: links, active nav, highlights, CTAs, focus ring |
| `--accent-foreground` | `0 0% 100%` | `#FFFFFF` | Text on accent |
| `--accent-secondary` | `21 90% 38%` | `#B8470A` | Burnt orange highlight (badges, gradients) |
| `--electric` | `223 99% 48%` | `#0146F4` | Technical / AI landing pages |
| `--electric-soft` | `199 92% 45%` | `#0999DC` | Cyan companion to electric |
| `--success` | `152 85% 26%` | `#0A7B46` | Success, "software" category, Placement Call |
| `--destructive` | `0 74% 45%` | `#C81E1E` | Errors, delete |
| `--border` / `--input` | `210 20% 90%` | `#E0E6EB` | Borders, input outlines |
| `--ring` | `239 70% 58%` | `#494BDF` | Focus ring (= accent) |
| `warning` (hard-coded in Tailwind config) | `45 93% 47%` | `#E7B008` | Warnings |
| `--section-alt` | `210 30% 98%` | `#F8FAFB` | Alternate section background (`.section-alt`) |

### 2.2 Gradient tokens

| Token | Value | Use |
|---|---|---|
| `--hero-gradient-start → end` | `239 70% 58%` → `239 84% 50%` (`#494BDF → #1418EB`) | `.hero-gradient` final-CTA bands |
| `.accent-gradient` | `135deg, accent → hsl(200 94% 35%)` (indigo → deep cyan-blue) | `Button variant="accent"`, event/jobs widgets |
| `.accent-gradient-premium` | `accent → hsl(200 85% 42%) → accent` + glow shadow | `Button variant="hero"` |
| `.bg-gradient-cta` | `135deg, #0145F2 → #F58220` (electric blue → orange) | **Header "Enquiry" button only**; brand "blue→orange" signature |
| `.text-gradient` / `.text-gradient-premium` | accent → accent-secondary (± cyan mid) | Gradient headline words |
| Hero headline gradient | `from-primary to-accent` (charcoal → indigo) | The highlighted words in the hero H1 |
| Call button | `from-blue-700 (via-blue-600) to-indigo-600` | **Career Call** (see §7.6) |
| Placement button | `from-success to-teal-600` | **Placement Call** |

### 2.3 Category colour mapping (semantic)

| Category | Style |
|---|---|
| **AI & Data** | `bg-accent/10 text-accent border-accent/20` |
| **Software** | `bg-success/10 text-success border-success/20` |
| **Flagship / SPIC** | `bg-primary/10 text-primary border-primary/20` |

### 2.4 Event-type badge colours (`EventCard`)

| Type | Class |
|---|---|
| Job Fest | `bg-accent text-accent-foreground` |
| Webinar | `bg-primary text-primary-foreground` |
| Boot Camp / Master Class | `bg-success text-success-foreground` |
| Placement Drive | `bg-accent-secondary text-primary` |
| Workshop | `bg-accent-secondary text-primary-foreground` |

### 2.5 Illustration hue set (`--hue-*`)

For AI-systems graphics and icon tiles only (each has a `-soft` partner): blue `223 95% 55%`, purple `265 78% 60%`, cyan `190 88% 45%`, green `152 66% 40%`, orange `24 92% 52%`, pink `330 80% 58%`. Not for general UI.

### 2.6 Scoped sub-themes (do not mix into the main UI)

- **Newsletter** (`--news-*`, classes `.news-theme-indigo`, `.news-theme-orange`): navy `239 60% 30%`, deep navy `239 70% 22%`, gold(orange) `21 90% 55%`, tint `239 60% 96%`.
- **Special Offer landing pages** (`.offer-theme`): accent orange `24 94% 52%`, blue `238 74% 52%`, bg `225 45% 98%`, gradient `hsl(240 72% 46%) → hsl(252 66% 54%) → hsl(24 94% 52%)`.
- **Campaign Theme Overlay** (admin-driven, `ThemeOverlay`): fallback colours `#4F46E5` / `#F97316`; sets `--theme-primary` / `--theme-secondary`, optional top banner, confetti, popup. Runtime-driven; do not hard-code.
- **AI immersive / dark test pages**: `.ai-grid-bg`, `.glass-card`, `.shadow-ai-glow` (`rgba(96,130,255,0.4)`).

### 2.7 Footer palette

Vertical gradient `hsl(239 50% 20%) → hsl(239 50% 12%)` (`#191A4D → #0F102E`), white text at 70% (links) / 80% (legal), hover colour `hsl(21 90% 48%)` (`#E9590C`), decorative blur orbs white/10 and orange/10.

### 2.8 Dark mode

Tokens exist for a `.dark` class (background `220 20% 8%`, card `220 20% 12%`, accent lifts to `239 84% 70%`, etc.). **Status: defined in CSS; whether dark mode is switched on for users is unconfirmed (see §15, Q1).** Do not build dark-mode-only UI until confirmed.

### 2.9 Contrast (computed against actual values)

| Pair | Ratio | Verdict |
|---|---|---|
| Foreground on background | 10.5 : 1 | AAA |
| Muted text on background | 6.2 : 1 | AA |
| Accent on background (links) | 6.1 : 1 | AA |
| White on accent | 6.3 : 1 | AA |
| White on success | 5.3 : 1 | AA |
| White on accent-secondary (`#B8470A`) | 5.3 : 1 | AA |
| White on `#F58220` (orange end of `.bg-gradient-cta`) | **2.6 : 1** | **Fails AA** (see §14) |

---

## 3. Typography

- **Font family:** **Poppins** only (Google Fonts, weights 300–800; loaded in `index.html`). Tailwind `font-sans` = `Poppins, system-ui, -apple-system, sans-serif`. No secondary display or mono font is defined.
- **Body:** `antialiased`, `font-feature-settings: "rlig" 1, "calt" 1`. Paragraphs: `leading-relaxed`.
- **Default weights:** headings bold/semibold; nav and labels medium; buttons semibold.

### 3.1 Global heading scale (applied to bare `h1–h4`)

| Element | Classes |
|---|---|
| `h1` | `text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]` |
| `h2` | `text-3xl md:text-4xl font-bold tracking-tight leading-tight` |
| `h3` | `text-xl md:text-2xl font-semibold tracking-tight` |
| `h4` | `text-lg font-semibold` |

### 3.2 Text roles

| Role | Class recipe |
|---|---|
| Hero sub-copy | `text-lg md:text-xl text-muted-foreground leading-relaxed` |
| Section sub-line | `text-muted-foreground max-w-2xl mx-auto` |
| Card title | `text-xl md:text-2xl font-bold` (category) / `text-lg font-semibold` (event) |
| Card body | `text-sm text-muted-foreground` (+ `line-clamp-2`) |
| Pill/badge label | `text-xs font-semibold` (badge) / `text-sm font-medium` (section pill) |
| Stat number | `text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight` |
| Nav link | `text-sm font-medium` (desktop) / `text-base font-medium` (mobile) |

### 3.3 The signature headline pattern

**One accent-coloured keyword per H2**, wrapped in a span:
`Career-Focused <span class="text-accent">Programs</span>` · `Wall of <span class="text-accent">Fame</span>` · `What You Can <span class="text-accent">Become</span> with SEED`.
The hero H1 uses the gradient version (`bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`). Use exactly one highlighted phrase per heading.

---

## 4. Layout, spacing and shape

| Item | Value |
|---|---|
| Content wrapper | `.container-wide` = `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Tailwind `container` | centred, `2rem` padding, `2xl` = 1400px (shadcn default; marketing pages use `container-wide`) |
| Section rhythm | `.section-padding` = `py-10 md:py-16`; homepage overrides commonly to `py-[32px]`; final CTA band `py-[48px]`; trust band `md:py-[48px]` |
| Section header block | centred, `mb-12`, optional pill → H2 → sub-line (`mb-6` if a ghost button follows) |
| Card grid | `grid sm:grid-cols-2 lg:grid-cols-3 gap-6` (4-up: `lg:grid-cols-4`; stats: `grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6`) |
| Alternate section bg | `.section-alt` or `bg-muted/30` |
| Header height | `h-20 md:h-24` (sticky, `z-50`) |
| Base radius `--radius` | `0.875rem` (14px): `rounded-lg` = 14px, `rounded-md` = 12px, `rounded-sm` = 10px |
| Extra radii | `rounded-2xl` = 16px (cards), `rounded-3xl` = 24px, `rounded-full` (pills, hero CTAs) |
| Breakpoints | Tailwind defaults; desktop nav switches at `lg` (1024px) |

**Radius by component:** buttons `rounded-xl` (12px) · marketing CTA/hero buttons `rounded-full` · cards `rounded-2xl` · badges/pills `rounded-full` · inputs `rounded-md` · dropdown menu panel `rounded-xl` with items `rounded-lg` · icon tiles `rounded-xl` (large) / `rounded-lg` (small 32px).

---

## 5. Elevation, glass and effects

### 5.1 Shadows (all use `--card-shadow: 210 30% 80%`)

| Class | Use |
|---|---|
| `shadow-premium` | Resting cards, default button, dropdowns |
| `shadow-premium-hover` | Hover state of cards/buttons |
| `shadow-premium-xl` | Floating widgets, dark trust card, glass panels |
| `shadow-glow` / `shadow-glow-lg` | Accent glow on accent/hero button hover, floating buttons |
| `glow-accent`, `glow-accent-hover` | Static/hover glow utilities |

### 5.2 Glass

`.glass` (white 70% + 12px blur + white 50% border) · `.glass-strong` (85% + 20px blur; used for the scrolled header) · `.glass-dark` (dark 80%) · `.card-glass` (glass + `rounded-2xl` + lift) · `.glass-card` (dark immersive pages only).

### 5.3 Card utilities

`.card-premium` (card + `rounded-2xl` + border + shadow, hover lifts `-translate-y-1`) · `.gradient-border` and `.card-gradient-border` (indigo→orange border fades in on hover) · `.card-accent-bar` (3px accent→orange bar scales in at top on hover) · `.icon-gradient` (accent/15 → orange/10 tile behind icons) · `.trust-card-dark|light|accent`.

### 5.4 Hero backgrounds

`HeroBgPattern`: warm-to-cool diagonal wash (orange-200/20 → violet-300/15), soft blurred orange blobs (bottom-left), violet/indigo blobs (top-right), centre accent glow, two blurred light streaks, a horizon glow, and 16 sparkle particles (white / accent / primary at low opacity, `animate-pulse-glow`). Also `.hero-grid-pattern` (40px white 3% grid) for dark heroes. The hero on the live site: soft peach bottom-left → lavender top-right on near-white.

---

## 6. Motion

| Token | Definition |
|---|---|
| `animate-fade-in` | 0.5s ease-out, up 10px |
| `animate-fade-in-up` | 0.6s ease-out, up 20px |
| `animate-scale-in` | 0.4s, scale .95→1 |
| `animate-slide-in-right` | 0.5s |
| `animate-float` / `-slow` | 6s / 8s, ±10px |
| `animate-float-subtle` | 4s, ±6px with 1° tilt (hero tool icons) |
| `animate-float-delayed` | 7s |
| `animate-glow-pulse` | 3s accent glow breathing (hero trust badge) |
| `animate-pulse-glow` | 2s opacity pulse (sparkles) |
| `animate-pulse-badge` | 2s opacity 1→.7 (Jobs count badge) |
| `animate-shimmer`, `animate-shine` | sweeping highlight |
| `animate-scroll` / `-reverse` | 30s infinite marquee (partner logos), pause on hover |
| `.stagger-1…8` | 0.05s → 0.4s animation-delay |
| Hover lift | cards `-translate-y-1` to `-translate-y-2`; buttons `-translate-y-0.5` (hero: `-translate-y-1`) |
| Durations | 300ms default (`transition-smooth`), 500ms for cards/header, `transition-premium` = 500ms `cubic-bezier(0.16,1,0.3,1)` |
| Sliding label (call buttons) | 3s interval, 500ms ease-out vertical slide |

**Rule:** all looping animations must be disabled under `prefers-reduced-motion` (already implemented for float/glow/shimmer/shine; sliding label uses `motion-reduce:transition-none`). Any new loop must do the same.

---

## 7. Component specifications

### 7.1 Buttons (`ui/button.tsx`; base: `rounded-xl text-sm font-semibold`, focus ring 2px `ring` + offset 2, `duration-300`)

| Variant | Look | Use |
|---|---|---|
| `default` | Charcoal (`primary`) fill, white text, `shadow-premium`, lifts on hover | Neutral primary action |
| `accent` | Indigo→blue gradient, white text, `shadow-md` → glow on hover, lifts | **Main marketing CTA** |
| `hero` | `accent-gradient-premium`, `text-base`, lifts `-1` | Hero / final-CTA (use with `size="xl"` and often `rounded-full`) |
| `outline` | 2px charcoal border, transparent; fills charcoal on hover | Secondary (e.g., "LMS") |
| `outline-accent` | 2px indigo border; fills indigo on hover | Secondary on light |
| `outline-light` | 2px white/30 border | On dark/gradient bands |
| `subtle` | `accent/10` fill, accent text | Soft CTA ("Explore all open job positions") |
| `secondary` | `secondary` fill | Tertiary |
| `ghost` | transparent, `secondary` hover | "Browse all…" links with arrow |
| `link` | accent text, underline on hover | Inline |
| `glass` | glass surface | Over imagery |
| `destructive` | red | Delete / irreversible |

**Sizes:** `default h-11 px-5` · `sm h-9 px-4` · `lg h-12 px-8 text-base` · `xl h-14 px-10 text-lg` · `icon h-10 w-10`. Icons inside buttons: 16px, `gap-2`. Trailing arrows: `ml-2 h-4 w-4` (+ `group-hover:translate-x-1`).

### 7.2 Badges & pills

- **Badge** (`ui/badge.tsx`): `rounded-full px-2.5 py-0.5 text-xs font-semibold`; variants default (charcoal), secondary, destructive, outline.
- **Section pill:** `px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium` (e.g. "Career Outcomes").
- **Category chip:** `px-3 py-1 text-xs font-medium rounded-full border` with §2.3 colours + 12px icon.
- **Hero trust badge (filled):** `px-5 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg animate-glow-pulse` with trophy icons both sides.
- **Hero trust badge (outline):** `border border-primary/30 bg-background/60 backdrop-blur-sm text-primary`.
- **Filter pill:** `px-4 py-1.5 rounded-full text-sm font-medium bg-secondary/60 border border-border/50 backdrop-blur-sm`.

### 7.3 Cards

- **Base `Card`:** `rounded-2xl border border-border bg-card shadow-premium`; header/content padding `p-6`; title `text-2xl font-semibold leading-none tracking-tight`; description `text-sm text-muted-foreground`.
- **Category card:** padding `p-6 md:p-8`, 56px rounded-xl icon tile (coloured per §2.3, rotates 3° and scales on hover), title turns accent on hover, chips row, footer with top border + "Explore →" in accent; hover `-translate-y-2`, gradient wash and soft blur glow.
- **Career-outcome card:** `p-6 rounded-2xl bg-card border shadow-sm`, hover: border `accent/30`, `shadow-premium`, `-translate-y-1`; title bold turns accent; link "View Related Courses →".
- **Event card:** type badge top-left, title `text-lg font-semibold`, 2-line description, three meta rows each with a 32px `icon-gradient` tile + accent icon, full-width `accent` `sm` button "Learn More →"; whole card is a stretched link.
- **Trust/stat card:** four variants: `dark` (charcoal, `shadow-premium-xl`), `accent` (indigo, `shadow-glow`), `light` ×2 (glass + border); 48px icon tile; big number; label `text-sm font-medium`; hover `-translate-y-2`.

### 7.4 Inputs & forms

`Input`: `h-10 rounded-md border border-input bg-background px-3 py-2`, `text-base` on mobile / `md:text-sm`, placeholder `muted-foreground`, focus = 2px `ring` (indigo) + offset 2, disabled 50%. Built on shadcn/Radix + react-hook-form + zod. OTP uses `input-otp`. Consent (DND/NDNC) wording is functional; do not alter.

### 7.5 Header, navigation and search

- Sticky, `z-50`. **Top of page:** `bg-background/95 backdrop-blur-sm`, transparent bottom border. **Scrolled (>10px):** `glass-strong` + `shadow-premium` + `border-border/50`. Transition 500ms.
- Logo: `h-12 md:h-14`, scales 105% on hover. Logo file: `seed-logo.png` (dark wordmark "seed", tagline "beyond the obvious"). Inverted white version in footer via `brightness-0 invert opacity-90`.
- **Desktop nav (≥lg):** Home · Courses (mega menu) · Batch Schedules · SAP · More ▾. Links `px-4 py-2 text-sm font-medium rounded-xl`. **Active:** `text-accent bg-accent/10` + 4px accent dot under the label. **Inactive:** `text-muted-foreground`, hover `text-foreground bg-secondary`.
- **More dropdown:** panel `min-w-[220px] rounded-xl border bg-background shadow-premium p-2`; items `px-3 py-2.5 text-sm font-medium rounded-lg`, active = accent tint; chevron rotates 180°.
- **Right cluster:** search field → **Enquiry** (`accent` + `bg-gradient-cta`, white text) → **Hire from Us** (`accent`) → **LMS** (`outline sm` + download icon, opens new tab).
- **Mobile (<lg):** 44px hamburger; full-height panel `max-h-[calc(100vh-5rem)]`; search first; accordions for Courses and More with a left border guide (`ml-3 pl-3 border-l`); CTAs stacked full-width `size="lg"`; body scroll locked while open.

### 7.6 Call buttons (signature element)

- **Career Call** (`BookCallButton`): pill (`rounded-full`), `h-14` (hero) / `h-12` (section, sticky) / `h-11` (floating), gradient `from-blue-700 via-blue-600 to-indigo-600`, white text, `border-white/10`, trailing **white circular icon badge** (`bg-white text-slate-900`, phone icon) that rotates 12° on hover. Label **slides vertically** every 3s between "Career Call" and "Call <number>", width reserved so the button never resizes.
- **Placement Call:** same geometry, gradient `from-success to-teal-600` (green/teal) so the two are distinguishable.
- **Floating (right-edge) widget:** vertical stack, vertically centred, `right-4` (`right-2` mobile), items `px-5 py-3.5 rounded-2xl shadow-premium-xl`, scale 105% + lift on hover; **mobile shows icon only**. Order: Events (accent-gradient, count badge) → Jobs (charcoal, pulsing accent count badge) → Career Call → Placement Call (on non-home pages).
- **Homepage top strip:** the two call buttons sit centred under the header (`fixed top-20 md:top-24`, `z-30`), side by side on ≥sm, stacked on mobile.
- Expanded widget panel: `w-72 md:w-80 rounded-xl md:rounded-2xl glass-strong shadow-premium-xl`, gradient header (charcoal for Jobs, accent-gradient for Events) with pulsing status dot, tab strip, `divide-y` list, footer CTA `accent sm`.

### 7.7 Hero

Centered, `max-w-3xl`, padding `py-24 md:py-32 lg:py-40`, sits on `HeroBgPattern`. Order: two trust badges → H1 (gradient keyword) → sub-copy → three filter pills → CTA row (`hero xl rounded-full` "▶ Explore Courses" + Career Call) → "🎓 Trusted by 1,00,000+ Students". Six floating AI-tool icon tiles (desktop only) in glass squares (`p-3 rounded-2xl bg-background/80 backdrop-blur-xl shadow-xl border-border/40`, 40px image, staggered `animate-float-subtle`). Elements fade in with 0.1s staggers. Carousel with pill-shaped progress dots beneath (active dot is a longer indigo pill).

### 7.8 Footer

Dark indigo gradient (§2.7), `py-16 md:py-20`, 5-column grid on `lg` (Brand · Programs · Explore · Resources · Contact). Column headings `font-semibold text-white mb-6`; links `text-sm text-white/70`, hover orange `hsl(21 90% 48%)`; social buttons 40px `rounded-xl bg-white/10` → orange on hover with `-translate-y-1`; contact rows use 32px `rounded-lg bg-white/10` icon tiles; gradient hairline divider; legal row `text-white/80`.

### 7.9 Dialogs / popups

`Dialog` is stock shadcn (overlay `bg-black/80`, panel `max-w-lg`, `sm:rounded-lg`, `p-6`, `shadow-lg`). Feature popups (registration, OTP, syllabus, offers) inherit it; content must remain scroll-safe on mobile (several past bugs were "popup cuts off on mobile/zoom"). Never fix content height with `h-screen`; use max-height + internal scroll.

### 7.10 Admin / data tables

`.admin-scroll-table`: container `overflow:auto; max-height: calc(100vh - 240px)`, **sticky header** (`th`/`tr` `top:0; z-index:2; background: muted`), horizontal scrollbar stays at the bottom of the container. Admin sidebar uses `--sidebar-*` tokens (indigo primary, orange accent). Collapsible menu groups. Keep tab bars from overlapping (past fix); keep editors uncramped.

### 7.11 Icons and imagery

- **Icons:** `lucide-react` only. Default 16px in buttons, 20px in widgets, 24–28px in feature tiles; stroke 2 (2.5 for the call-button phone).
- **Icon tiles:** rounded-xl/lg squares with tinted background (`accent/10`, `success/10`, `icon-gradient`, or `primary-foreground/10` on dark).
- **Images:** logos/tool icons are `.webp`; hero tool icons 40×40 `object-contain`; partner logos scroll in an infinite marquee. Always provide `alt`, `width`/`height`, and `loading="lazy"` (except hero).

---

## 8. Page-section blueprint (reuse this order and rhythm)

1. Hero carousel → 2. Career Outcomes (pill + H2 + 3-col cards) → 3. Partner logos marquee → 4. Trust stats (4 cards) → 5. SEO intro (`bg-muted/30`, centred `max-w-4xl`, `text-2xl md:text-3xl font-semibold`, bold keywords in `text-foreground`) → 6. Programs (3 category cards + Career Call CTA) → 7. Wall of Fame (4-col) + CTA → 8. Live Job Opportunities (`section-alt`, DB-driven, only if data) → 9. Upcoming Events (3 cards) → 10. Final CTA band (`hero-gradient`, white text, `hero xl` + Career Call).

**Section CTA convention:** a muted `text-sm` invitation line above a `BookCallButton variant="section"`, centred, `mt-12`, `gap-3`.

---

## 9. Voice and content style (as observed)

Confident, outcome-focused, student-directed. Short verbs ("Launch Your Tech Career", "Explore Courses", "Hire from Us"). Numbers as proof (1994, 32+ years, 10L+ / 1,00,000+ students, 500+ hiring partners, 62%+ placement). Indian numbering and `en-IN`. Phone: `+91 92255 20000` (main), `+91 91722 01773` (Placement Call). Title format: *"SEED Infotech | …"*.

---

## 10. Accessibility baseline (already present, must be preserved)

- Focus: 2px indigo ring with 2px offset on every interactive element (`focus-visible`).
- Tap targets ≥ 44px on mobile nav.
- `aria-label`, `aria-expanded`, `aria-haspopup` on menus; descriptive `aria-label` on call buttons; `sr-only` close labels.
- Reduced-motion handling (§6). Decorative images `aria-hidden` / empty `alt`.
- Text ≥ AA contrast except the noted gradient (§2.9, §14).

---

## 11. Do / Don't for developers

**Do** use `bg-accent`, `text-muted-foreground`, `border-border`, `rounded-2xl`, `shadow-premium`, `container-wide`, `section-padding`, `Button variant=…`, `lucide-react`, Poppins. **Do** wrap new lists in the standard grid. **Do** add hover lift + 300ms transition to any new card. **Do** run `bun run ci` (lint → typecheck → test → build) before merging.

**Don't** introduce new fonts, new brand colours, new radii, hard-coded hex/HSL/`blue-600`-style palette classes, inline `style` colours, additional shadow recipes, or new animation timings. **Don't** use pure `#000` for text. **Don't** use orange for large text blocks or body copy. **Don't** put white text on the `#F58220` end of the CTA gradient at small sizes. **Don't** restyle the newsletter/offer/campaign sub-themes to match the main theme (or vice versa).

---

## 12. Token quick-reference for a new developer

```css
/* src/index.css (:root) — the ones you will use daily */
--background: 210 20% 99%;   --foreground: 41 12% 23%;
--primary:    41 12% 23%;    --accent: 239 70% 58%;   --accent-secondary: 21 90% 38%;
--secondary:  210 25% 96%;   --muted: 210 20% 95%;    --muted-foreground: 210 10% 38%;
--success:    152 85% 26%;   --destructive: 0 74% 45%;
--border:     210 20% 90%;   --ring: 239 70% 58%;
--radius: 0.875rem;          --card-shadow: 210 30% 80%;
```

```ts
// tailwind.config.ts essentials
fontFamily: { sans: ['Poppins','system-ui','-apple-system','sans-serif'] }
borderRadius: { lg:'var(--radius)', md:'calc(var(--radius) - 2px)', sm:'calc(var(--radius) - 4px)', '2xl':'1rem', '3xl':'1.5rem' }
boxShadow: { premium, 'premium-hover', 'premium-xl', glow, 'glow-lg' }  // see §5.1
plugins: [require('tailwindcss-animate')]
```

**Files that define the theme (copy these 1:1 when migrating; do not "clean up"):**
`tailwind.config.ts` · `src/index.css` · `index.html` (Poppins link + critical CSS) · `components.json` · `src/components/ui/*` · `src/components/layout/{Header,Footer,Layout}.tsx` · `src/components/cta/BookCallButton.tsx` · `src/components/widgets/OpportunitiesWidget.tsx` · `src/components/home/*` · `src/assets/seed-logo.png` · `src/assets/hero-icons/*`.

---

## 13. Migration checklist (Lovable → VS Code / CI/CD)

1. Clone the GitHub repo Lovable syncs to (repo contains `.github/workflows/ci.yml`, `deploy-staging.yml`, `deploy-production.yml` already).
2. Copy `.env.example` → `.env` locally; **never commit secrets; do not change Supabase values**.
3. `bun install` → `bun run dev` (note `predev` regenerates the sitemap).
4. Keep `lovable-tagger` / Lovable Vite plugins **as they are** until the owner approves their removal (they are dev-only, but removal is a build change).
5. After migrating, do a **visual regression pass**: compare Home, Courses, Batch Schedules, Events, Enquiry, Admin against the live site at 375px, 768px, 1280px.
6. Add a lint/PR rule (see §16) that flags hard-coded colours.

---

## 14. Inconsistencies found in the current code (documented, **NOT changed**)

| # | Finding | Where | Impact |
|---|---|---|---|
| 1 | **Two different accent values on load.** `index.html` critical CSS sets `--accent: 239 84% 67%` (lighter `#6E70F4`) while `index.css` sets `239 70% 58%` (`#494BDF`). | `index.html` vs `src/index.css` | Possible brief colour shift during first paint. |
| 2 | **Hard-coded colours despite "semantic tokens" intent.** Career Call uses `blue-700/600 → indigo-600`; Placement Call uses `success → teal-600`; footer uses literal `hsl(239,50%,20%)` and `hsl(21,90%,48%)`; `warning` is hard-coded in Tailwind config. Plan note for Placement Call said "no hardcoded colours". | `BookCallButton`, `OpportunitiesWidget`, `Footer`, `tailwind.config.ts` | Theme changes will not propagate to these. |
| 3 | **Five different oranges** in use: `#B8470A` (accent-secondary), `#F58220` (CTA gradient), `hsl(21 90% 55%)` (newsletter), `hsl(24 94% 52%)` (offers), `hsl(21 90% 48%)` (footer hover). | multiple | Orange can look inconsistent across pages. |
| 4 | **Two blues:** indigo `#494BDF` (accent) and electric `#0146F4` / `#0145F2` (CTA gradient, electric). Both appear on the same header. | Header | Intentional "blue→orange" signature, but two blue identities coexist. |
| 5 | **Contrast failure:** white text on `#F58220` (2.6:1). | Enquiry button (`.bg-gradient-cta`) right end | Below WCAG AA for small text. |
| 6 | **Event badge contrast:** "Placement Drive" uses `text-primary` (dark charcoal) on `accent-secondary` (dark burnt orange). | `EventCard` | Low contrast; also inconsistent with Workshop badge which uses `text-primary-foreground` on the same colour. |
| 7 | **Dialog is unstyled shadcn default** (`bg-black/80`, `rounded-lg`, `shadow-lg`) whereas the rest of the site uses `rounded-2xl` + `shadow-premium`. | `ui/dialog.tsx` | Popups feel less "premium" than cards. |
| 8 | **Input radius (`rounded-md`, 12px) differs from buttons (`rounded-xl`) and cards (`rounded-2xl`).** | `ui/input.tsx` | Minor shape mismatch in forms next to buttons. |
| 9 | **Duplicate/legacy utilities**: `.card-shadow` vs `.shadow-premium` (aliases), `.animate-float` defined in both `tailwind.config.ts` and `index.css`; `.trust-card-*` and `.card-premium` largely superseded by inline classes. | `index.css` | Harmless but confusing. |
| 10 | **Content figures differ:** the stat card says `400+ Companies`, while the SEO copy and meta description say `500+ hiring partners`. | `TrustSignals.tsx`, `Index.tsx`, `index.html` | Content consistency, not a design defect. Flagged only. |
| 11 | **Hero-gradient section text** uses `text-primary-foreground/80` on indigo; fine, but the H1 gradient (charcoal → indigo) starts dark, so on the `hero-gradient` band the gradient headline style must **not** be used. | design rule | Prevents unreadable headings. |

---

## 15. Open questions for the owner (needed to finalise v1.1)

1. **Dark mode:** Is dark mode meant to be live (a user toggle), or should `.dark` tokens be treated as unused?
2. **Orange:** Which single orange should be canonical for the main site (`#F58220` from the CTA gradient, or `#B8470A` accent-secondary)? Should the footer/newsletter/offer oranges be unified to it?
3. **Blue identity:** Is the primary interactive blue the **indigo `#494BDF`** or the **electric `#0145F2`**? Today the header uses both.
4. **Enquiry button:** Keep the blue→orange gradient as the official brand CTA (and accept the contrast trade-off), or shall white text be replaced/size-restricted?
5. **Logo usage:** Do you have a brand guidelines PDF (clear-space, minimum size, colour variants)? The code only shows the dark PNG and a white inverted copy.
6. **Pages not yet reviewed in detail:** I inspected the homepage, layout, UI primitives, header/footer, floating widgets and hero. I have **not** yet read course detail pages, Batch Schedules (a "marketing redesign" plan exists), Enquiry/lead forms, Events detail, Placements, Newsletter, Investor Relations, Special Offers, or the Admin/Advisor/Call-centre portals. Shall I extend the theme to these (read-only)?
7. **Exports:** Would you like a machine-readable companion (`design-tokens.json`, and a `DESIGN_RULES` block for AI coding tools such as `CLAUDE.md` / Antigravity rules) so tools enforce this automatically?
8. **Authority:** When a developer's need isn't covered here, who approves additions (you, or a named design owner)?

---

## 16. Suggested enforcement (proposal only: needs your approval before anyone implements)

- Add `DESIGN_THEME.md` to the repo root and reference it from the PR template (`.github/pull_request_template.md` already exists).
- ESLint / CI rule (or a simple grep step in `ci.yml`) that fails on `#[0-9a-fA-F]{3,8}` and on raw palette classes (`bg-blue-*`, `text-indigo-*`, etc.) outside an allow-list (`BookCallButton`, `Footer`, sub-themes).
- Visual regression via Playwright screenshots on Home/Courses/Enquiry at three breakpoints.
- A short "Design QA" checklist in every PR: tokens only · Poppins only · radii from §4 · reduced-motion respected · no functional/DB diff.

---

*Document status: v1.0, generated read-only from the live Lovable project. Nothing in the project was modified.*
