# Handoff: DocsLite v2 — UI, brand, and design system

## Overview

DocsLite is a lightweight collaborative document editor: create, format, and share
documents. This package covers the **complete v2 UI redesign** — every screen and
state, the design tokens, the brand assets, and the interaction/motion spec.

The direction is quiet, product-grade SaaS: warm-grey app ground, white surfaces
separated by 1px hairlines, one iris accent, 6/8/12px radii, near-invisible
shadows — and one deliberate move: **the writing canvas is set in a serif**
(Source Serif 4), so the document reads as a document rather than as another app
screen. Keep that.

Scope is exactly the features in the brief. There is **no** UI for multi-cursor
presence, comments, version history, notifications, search, folders, or account
settings — do not add any.

## About the design files

The files in this bundle are **design references authored in HTML** — prototypes
that show intended look and behaviour. They are **not production code to copy**.
The task is to **recreate these designs in the target codebase** using its
established patterns and libraries.

Target stack (confirmed):

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4, CSS-first `@theme` tokens (block provided below, copy verbatim)
- Hand-authored components; **shadcn/ui** (Radix + Tailwind) welcome for Dialog,
  Select, Tooltip. No CSS-in-JS / runtime style engines.
- **Lucide** icons (React), 1.6–1.85 stroke
- **Tiptap v3** for the canvas — the `.ProseMirror` surface must carry the
  document typography below
- **sonner** for toasts, `next/font` for the three typefaces, CSS transitions for motion
- Light mode primary. Dark mode is not specified in v2; if added, ship it as a
  complete token set (only `--color-*` values change).

The prototypes drive responsive behaviour with `@container app (max-width: …)` so the
frame can be resized in place. In the real app use ordinary media queries /
Tailwind `sm:` `lg:` variants — the reflow rules are identical.

The prototype's top dark/light strip (viewport switcher, role switcher, "Empty
state / No access / Sign out / Reset") is **prototype scaffolding only**. Do not
build it.

## Fidelity

**High-fidelity (hifi).** Colours, type, spacing, radii, shadows, motion timings,
and every interaction state are final. Recreate the UI faithfully using the
codebase's libraries. Where a value is not stated, take it from the prototype's
inline styles — they are the source of truth.

## Files in this bundle

| File | What it is |
|---|---|
| `DocsLite Prototype 2.dc.html` | **The v2 design.** Working prototype: login → dashboard → editor → share, all states. Open in a browser. |
| `DocsLite Design Spec.dc.html` | Token sheet, component state matrix, motion table, responsive table, a11y notes. Contains the copy-pasteable Tailwind `@theme` block. |
| `DocsLite Brand Kit.dc.html` | Logo/lockup (light + dark), icon-only at 16/32/56, favicon export set, 1200×630 OG card, initials-avatar palette, empty-state motif, iconography. |
| `DocsLite Prototype.dc.html` | v1, a different (Modernist) art direction. **Reference only — superseded.** |

All four are self-contained HTML; `support.js` next to them is the runtime that
renders them. Fonts load from Google Fonts.

---

## Design tokens

Paste into `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* surfaces & ink */
  --color-bg:            #f7f8fa;   /* app background        */
  --color-surface:       #ffffff;   /* cards, sheet, sidebar */
  --color-ink:           #10131a;   /* headings, strong text */
  --color-body:          #2a3038;   /* body copy             */
  --color-muted:         #6e7681;   /* secondary text        */
  --color-faint:         #98a0ab;   /* meta, placeholders    */
  --color-line:          #e4e7eb;   /* 1px borders           */
  --color-line-soft:     #eef0f3;   /* row dividers          */

  /* brand */
  --color-accent:        #5b5bd6;
  --color-accent-hover:  #4a4ac2;
  --color-accent-press:  #4141ad;
  --color-accent-tint:   #f0f0fe;
  --color-accent-line:   #d5d5f7;

  /* status */
  --color-success:       #167c4e;
  --color-danger:        #c0362c;
  --color-danger-tint:   #fdf2f1;

  /* type */
  --font-sans:    "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  --font-serif:   "Source Serif 4", Georgia, serif;    /* document canvas */
  --font-display: "Instrument Serif", Georgia, serif;  /* hero moments    */

  /* radius */
  --radius-sm: 6px;   /* toolbar toggles, inline title input */
  --radius-md: 8px;   /* buttons, fields, sidebar rows       */
  --radius-lg: 12px;  /* cards, sheet, 64px avatar           */
  --radius-xl: 14px;  /* dialog                              */

  /* elevation */
  --shadow-sm: 0 1px 2px rgb(16 19 26 / .05), 0 1px 1px rgb(16 19 26 / .04);
  --shadow-md: 0 4px 14px rgb(16 19 26 / .07), 0 1px 2px rgb(16 19 26 / .05);
  --shadow-lg: 0 24px 60px rgb(16 19 26 / .18), 0 2px 8px rgb(16 19 26 / .08);

  /* motion */
  --ease-out-quint: cubic-bezier(.32,.72,0,1);
}
```

Spacing uses Tailwind's default 4px scale, unmodified. Extra literals used in the
design and not in `@theme`: `#fafbfc` (row hover), `#f4f5f7` (icon-button hover,
neutral tile), `#f1f3f5` / `#4a5260` (Can-edit badge), `#4646b8` (Owner badge
text), `#b6bcc5` (row chevron), `#e3a49e` (error field border), `#14181f` (toast
surface), `#4ade9b` / `#ff8079` (toast state dots), `#23282f` (canvas body ink),
`#7b7bea` (logo tile on dark).

### Typography

| Role | Family / weight | Size / line-height | Notes |
|---|---|---|---|
| Display | Instrument Serif 400 | 46 / 1.05 | Login headline, empty state, 404. Tracking −0.015em. One per screen. |
| Page title | Instrument Sans 600 | 21 / 1.3 | "Documents". Tracking −0.02em. |
| Dialog title | Instrument Sans 600 | 16.5 / 1.35 | Tracking −0.01em. |
| Doc title (chrome) | Instrument Sans 600 | 15 / 1.35 | Editable input; borderless until hover. |
| Body / UI | Instrument Sans 400 | 14 / 1.5 | Base. Rows: 14 title + 12.5 meta. |
| Small | Instrument Sans 400–500 | 12.5 / 1.5 | Meta, hints, validation. |
| Eyebrow | Instrument Sans 600 | 10.5 / 1.4 | Uppercase, tracking 0.07em, colour `faint`. |
| Canvas body | Source Serif 4 400 | 18 / 1.78 | 760px measure, colour `#23282f`. 17px below 640. |
| Canvas H1 | Source Serif 4 600 | 34 / 1.2 | Tracking −0.015em, margin 36/14. 28px below 640. |
| Canvas H2 | Source Serif 4 600 | 25 / 1.3 | Tracking −0.01em, margin 32/10. 22px below 640. |
| Canvas H3 | Instrument Sans 600 | 15, uppercase | Tracking 0.06em, colour `muted`, margin 30/8. A sans eyebrow, not a serif heading. |
| Canvas lists | inherit | — | padding-left 26, li margin-bottom 8, marker colour `faint`. |

Load with `next/font`: `Instrument_Sans` (400–700), `Instrument_Serif` (400),
`Source_Serif_4` (400–600). All SIL OFL.

---

## Screens

### 1. Login / user picker — `/login`

**Purpose:** pick one of four seeded demo accounts. No password; frame it plainly.

**Layout:** single scrolling column, content `max-width: 432px`, `margin: auto`
inside a `height:100%; overflow:auto` wrapper with `padding: 40px 24px`. Background
`--color-bg` plus `radial-gradient(120% 90% at 50% -10%, #f0f0fe 0%, rgba(247,248,250,0) 60%)`.
**Do not centre with flex `align-items:center`** — a tall card then clips at the
top with no way to scroll to it.

**Components, top to bottom:**
- Lockup: 26px iris tile (radius 7px) + "DocsLite", 17px/600, tracking −0.02em, `ink`. Gap 9px. Margin-bottom 26px.
- Headline: display 38px (Instrument Serif 400), `ink`, "Pick an account to continue". Margin-bottom 8px.
- Subtitle: 14.5px `muted`, "A demo sign-in — no password. Choose a teammate to see the workspace from their side." Margin-bottom 24px.
- Card: `surface`, 1px `line`, radius 12, `shadow-md`, `overflow:hidden`. Four rows.
- Row: `min-height 64px`, padding 12/16, flex gap 12, bottom border 1px `line-soft`.
  36px avatar tile (radius 10, 12.5px/600, white text) · name 14/600 `ink` · email 12.5 `muted` ·
  trailing `chevron-right` 17px `faint`. Hover `#fafbfc`, 140ms.
- Selecting: the row's chevron is replaced by a 15px spinner (2px, `accent-line` track, `accent` head, 700ms linear) for ~420ms, then route to `/`.
- Footer: 12px `faint`, "Demo workspace · sessions are not persisted", margin-top 16px.

**Mobile:** the card loses its border, shadow, and white fill and sits directly on
the background; padding 24/20.

### 2. Dashboard — `/`

**Layout:** flex row — sidebar 264px (`surface`, 1px right border `line`) + main
workspace (`bg`, `overflow:auto`, padding 34/36).

**Sidebar:**
- Brand row: 24px tile + wordmark 15.5/600. Padding 18/18/14.
- **New document** — primary, full width, `min-height 38`, radius 8, `plus` icon, label centred, `shadow` `0 1px 2px rgba(91,91,214,.35)`.
- **Upload .txt / .md** — secondary, full width, 38px, `upload` icon. While uploading: spinner + "Uploading…". A hidden `<input type="file" accept=".txt,.md">` does the work.
- Section headers: eyebrow 10.5/600 uppercase `faint` + right-aligned count. "My documents", "Shared with me" (separated by a 1px `line-soft` rule).
- Document row: `min-height 38`, padding 7/9, radius 8, `file-text` 15px at 50% opacity, title 13.5/500 (ellipsis), meta 11.5 `faint` (relative time; for shared docs "Owner · Role"). Hover `#f4f5f7` 120ms. **Selected:** `accent-tint` fill + `accent` text, meta `#8484d8`.
- Empty section: 12.5 `faint` — "No documents yet." / "Nothing shared with you."
- User area (bottom, above a 1px `line-soft`): 30px avatar (radius 9) · name 13/600 · email 11.5 `faint` · **Switch user** = 32px ghost icon button (`log-out`), tooltip "Switch user". Returns to the user picker.

**Workspace (populated):** title block — "Documents" 21/600 `ink` + count 13 `faint`,
margin-bottom 18. Then one card (`surface`, 1px `line`, radius 12, `shadow-sm`,
`overflow:hidden`, `max-width 880`) containing document rows:
`min-height 62`, padding 12/18, bottom border `line-soft`, hover `#fafbfc`;
34px neutral tile (radius 9, `#f4f5f7`, `file-text` 16px `muted`) ·
title 14/600 `ink` · meta 12.5 `muted` "Owner · relative time" ·
role pill · `chevron-right` 16px `#b6bcc5`. Whole row is the click target.

**Workspace (empty):** centred, `max-width 520`, `margin: 6vh auto 0`.
Motif (see Brand kit §05) 120×96, then display 28px "Nothing here yet",
14px `muted` "Create a document, or upload a .txt or .md file and we'll turn it
into one you can edit.", then primary **New document** + secondary **Upload .txt / .md**
(both `white-space: nowrap`).

**Mobile:** sidebar becomes a 288px off-canvas drawer —
`transform: translateX(-102%)` → `none`, 200ms `--ease-out-quint`, `shadow-lg`,
plus a `rgba(16,19,26,.32)` scrim that closes on tap. A 56px top app bar appears:
44px hamburger (bordered), "DocsLite", and a compact **+ New** primary on the right.
Sidebar's own close (X) button shows only in the drawer.

### 3. Editor — `/documents/[id]`

Three stacked regions over `bg`.

**Header** (`surface`, 1px bottom `line`, `min-height 57`, padding 10/16, gap 10):
- Back: 34px ghost icon (`chevron-left`), hover `#f4f5f7`.
- **Title** — owner: borderless input, 15/600, radius 6, padding 6/8; hover shows 1px `line` + `#fafbfc`; focus 1px `accent` + `0 0 0 3px rgba(91,91,214,.14)` on white. Non-owner: plain text, ellipsis.
- **Role pill:** Owner = `#f0f0fe` bg / `#4646b8` text · Can edit = `#f1f3f5` / `#4a5260` · View only = transparent with 1px `line` / `muted`. 4/10 padding, radius 999, 11.5/500, `nowrap`.
- **Share** (owner only): primary, 34px, `upload`-style share icon, label "Share".
- **Delete** (owner only): 34px ghost icon (`trash-2`), hover `--color-danger-tint` + `danger`.

**Formatting toolbar** — only when the user can edit (`surface`, 1px bottom `line`,
`min-height 49`, padding 8/16, `overflow-x:auto`, gap 2):
`H1 H2 H3 P` (text toggles, 32px min, 12.5/600) · 1px×20 divider with 8px margins ·
`Bold Italic Underline` (icon toggles 16px) · divider · `Bulleted list` `Numbered list`.
Rest: `muted` on transparent. Hover: `#f4f5f7` + `ink`. **Active: `accent-tint` fill
+ `accent` text** (never a solid fill). Radius 6. Use `aria-pressed`.
Right side (`margin-left:auto`): save status — `Saving…` (12px spinner + `muted`),
`Saved` (12.5 `muted` + 14px `success` check), `Save failed — keep typing to retry`
(12.5/500 `danger` + alert-circle).

**View-only strip** (replaces the toolbar): `#f4f5f7`, 1px bottom `line`, padding
11/18, `eye` 15px, 12.5 `muted`: "**View only.** Ask {FirstName} for edit access."

**Canvas:** scroll area `padding: 32px 24px 120px`, `display:flex;
align-items:flex-start; justify-content:center` — **`align-items:flex-start` is
required**, otherwise the sheet is stretched to the line height and the document
overflows onto the grey. Sheet: `width:100%; max-width:760px`, `surface`, 1px
`line`, radius 12, `shadow-sm`, `padding: 64px 72px 96px`, `min-height:100%`.
Inside it, the Tiptap `.ProseMirror` surface carries the document typography above;
`outline:none`. Empty document shows "Start writing…" in `faint`.

**Mobile:** sheet goes full-bleed — no radius, no side borders, no shadow, padding
28/22; scroll wrapper padding 0. Toolbar scrolls horizontally with 44×44 targets.

### 4. Share dialog (modal over the editor, owner only)

Backdrop `rgba(16,19,26,.36)` + `backdrop-filter: blur(2px)`, click to dismiss.
Dialog: `min(540px, 100%)`, `max-height 88%`, `surface`, radius 14, `shadow-lg`,
padding 22/22/20, gap 18, enter 140ms `--ease-out-quint` from
`opacity 0 / translateY(8px) / scale(.985)`.

- Header: "Share document" 16.5/600 `ink` + document title 12.5 `muted` (ellipsis); 32px ghost close (X).
- Form row: email input (flex 1, 40px, radius 8) + role `<select>` (40px, min-width 124: "Can edit" / "Can view") + primary **Share** (40px). `Enter` submits, `Esc` closes.
- Validation (inline, below the row, 12.5 `danger` + alert-circle; field border `#e3a49e`):
  - empty → "Enter an email address."
  - malformed → "That doesn't look like an email address."
  - unknown → "No DocsLite account uses that email."
  - owner → "{First} already owns this document."
  - duplicate → "{First} already has access."
  - When there is no error, that line instead shows 12 `faint` "Demo teammates: …".
- **People with access:** eyebrow header with 1px `line-soft` underline. Owner row first — 32px avatar, name (+ " (you)"), email, right-aligned "Owner" 12.5 `faint`, no controls. Collaborator rows: avatar, name/email, role `<select>` (34px, min-width 114), 32px remove (X) ghost → hover `danger-tint` + `danger`. Rows divided by 1px `line-soft`.
- Empty: 12.5 `faint` "Only you have access. Add a teammate above to start collaborating."
- Every mutation raises a toast: "{Name} can now edit/view this document.", "{First} can now edit/view.", "Removed {First}'s access."

**Mobile:** bottom sheet — wrapper `align-items:flex-end`, padding 0; dialog full
width, radius 16 on the top corners only, `max-height 94%`, padding 20/18/24; form
row stacks to full-width fields.

### 5. Upload

Sidebar/empty-state **Upload .txt / .md** opens the file picker.
- Wrong extension → error toast "Only .txt and .md files can be uploaded."
- Over 1 MB → "That file is over 1 MB — try a smaller one."
- Read failure → "Upload failed. Try that file again."
- Success → parse, create the document, open the editor, success toast "Imported "{title}"."
- Title = filename minus extension. Parser: `#`/`##`/`###` → h1/h2/h3, `-`/`*`/`+` → `ul`, `1.`/`1)` → `ol`, blank line ends a list, everything else → `p` (escape HTML).
- Button shows a spinner + "Uploading…" while working.

### 6. Toasts

Bottom-centre stack inside the app frame, `bottom 22`, gap 8, `max-width min(420px, 100%)`,
`pointer-events:none` on the stack / `auto` on each chip. Chip: `#14181f`, `#f4f5f7`
text, radius 10, padding 11/10/11/14, `shadow-lg`, 13px. A 7px dot carries state
(`#4ade9b` success, `#ff8079` error) — colour is never the only signal, the copy
says what happened. Dismiss X at 26px, `#9aa2ad` → white. Auto-dismiss 4.2s.
Enter 180ms `--ease-out-quint`. Implement with **sonner** + a custom chip.

### 7. Not found / no access

Centred column (`margin:auto` inside the scroller), text-centre. 52px `surface` tile
(radius 14, 1px `line`, `shadow-sm`) with a crossed-out `file-text` 22px `muted`;
display 30px "This document isn't available"; 14px `muted` "It may have been
deleted, or you may not have access yet. Ask the owner to share it with you.";
primary **Back to documents**.

---

## Interactions & behaviour

| Moment | Property | Timing | Notes |
|---|---|---|---|
| Button / control hover | background, border-color | 140ms ease | |
| List row hover | background | 120ms ease | Lists feel quicker than controls |
| Focus-visible | box-shadow, border-color | 140ms ease | 2px `accent` outline + 2px offset on buttons; 1px `accent` border + `0 0 0 3px rgba(91,91,214,.14)` on fields |
| Dialog open | opacity, translateY(8px), scale(.985) | 140ms `--ease-out-quint` | Backdrop has no separate animation |
| Toast in | opacity, translateY(12px), scale(.98) | 180ms `--ease-out-quint` | Stack grows upward |
| Mobile drawer | translateX(−102%) → 0 | 200ms `--ease-out-quint` | Scrim fades with it |
| Spinner | rotate 360° | 700ms linear infinite | 2px ring, `accent-line` track + `accent` head |
| Save status | — | debounce 750ms | "Saving…" on first keystroke; "Saved" 750ms after the last. Never animate the swap. |
| Reduced motion | all | 0.01ms | Honour `prefers-reduced-motion`; states change instantly, never disappear |

Navigation: user card → `/`; sidebar row / dashboard row → `/documents/[id]`;
back arrow → `/`; Switch user → `/login`; delete → `/` + toast; missing or
unauthorised document → the not-found screen.

## State

- `currentUser: User | null` — null routes to `/login`
- `documents: Document[]` — `{ id, title, ownerId, updatedAt, contentHtml, collaborators: { userId, role: 'edit' | 'view' }[] }`
- `activeDocumentId: string | null`
- `role` — derived: `owner` if `ownerId === currentUser.id`, else the collaborator role, else no access
- `saveStatus: 'saved' | 'saving' | 'error'` — debounced 750ms on canvas or title input
- `shareDialog: { open, email, role, error }`
- `uploadState: 'idle' | 'uploading'`
- `drawerOpen: boolean` (mobile only)
- `toasts: { id, kind: 'success' | 'error', message }[]` — sonner owns this

Owner may rename, share, and delete. Editors may edit content only. Viewers get no
toolbar and a read-only surface.

## Responsive

| Region | Desktop ≥1024 | Tablet 640–1023 | Mobile <640 |
|---|---|---|---|
| Sidebar | 264px, always visible | 232px | Off-canvas drawer 288px + scrim; 56px top app bar |
| Workspace | padding 34/36, list max 880 | padding 28/24 | padding 20/16 |
| Editor header | 57px, full control set | same | padding 10/12, title truncates |
| Toolbar | 49px, all groups | same | horizontal scroll, 44² targets |
| Sheet | 760px, radius 12, border + shadow, padding 64/72 | padding 48/44 | full-bleed, no chrome, padding 28/22 |
| Share dialog | centred 540px, radius 14 | same | bottom sheet, radius 16 top, max-height 94% |
| Document rows | 62px, role pill + chevron | same | ≥52px, role pill hidden |

No horizontal page scroll at any width. The formatting toolbar is the only element
allowed to scroll horizontally. Touch targets ≥44×44 below 640px.

## Accessibility

- AA contrast throughout: body `#2a3038` on white 12.6:1 · `muted` 4.8:1 · white on `accent` 5.3:1 · `danger` on white 5.1:1 · every avatar fill ≥4.5:1. `faint` (`#98a0ab`) is meta-only at ≥12px, never body copy.
- Visible `:focus-visible` on every interactive element (see the motion table).
- Full keyboard operability: header → toolbar → canvas order; toolbar buttons are `aria-pressed`; dialog traps focus and closes on `Esc`; `Enter` submits the share form; closing the drawer returns focus to the hamburger.
- Every icon-only button has `aria-label` plus a title tooltip.
- Never colour alone: role badges pair tint with text, save status pairs colour with icon and word, toasts pair the dot with copy.

## Assets

Nothing is bitmap — all marks and the OG card are HTML/SVG in
`DocsLite Brand Kit.dc.html`, ready to lift.

- **Logo:** iris tile (radius = 27% of size) with three white rules at 6.8% stroke; the middle rule runs off the right edge. Wordmark Instrument Sans 600, tracking −0.025em. Dark-background variant lifts the tile to `#7b7bea` with `#10131a` rules.
- **Favicon set:** `icon.svg` (32×32 viewBox source), `favicon.ico` (16 + 32 — bottom rule dropped at these sizes), `apple-touch-icon.png` (180), `icon-512-maskable.png` (512, full-bleed, 80% safe area), `icon-mono.svg`.
- **OG image:** 1200×630, `bg` + a radial `#f0f0fe` wash top-right, lockup top-left, 4px×64 iris rule, display headline "Write it. Share it. Nothing in the way.", 26px `muted` tagline, and a rotated white document card bleeding off the right edge. Render once and export as PNG.
- **Avatars:** six fills — `#4f4fc9` `#0f766e` `#b45309` `#9333a8` `#1d4ed8` `#166534`. Assign deterministically: sum the char codes of the user id, mod 6. Squircle radius 27%, Instrument Sans 600, two initials, tracking 0.02em. Sizes 30 / 36 / 44 / 64.
- **Empty-state motif:** three stacked document cards at −7° / +6° / 0°, 76×80 each in a 120×96 box; the front card is `accent-tint` with `accent-line` border and three tinted rules.
- **Icons:** Lucide only — `chevron-left/right`, `plus`, `upload`, `file-text`, `share`, `trash-2`, `bold`, `italic`, `underline`, `list`, `list-ordered`, `check`, `x`, `menu`, `eye`, `alert-circle`, `log-out`. Stroke 1.6–1.85, 15–18px in chrome, never filled. No custom icons.

## Notes for implementation

1. Start with the `@theme` block, the three fonts, and the button/field/row/pill primitives — the whole UI is those four things repeated.
2. Build the Tiptap canvas early and style `.ProseMirror` with the canvas typography; the serif surface is the identity of the product.
3. Watch two layout traps documented above: `align-items:flex-start` on the sheet wrapper, and `margin:auto` (not flex centring) on the login/404 scrollers.
4. One primary action per context. If you find yourself adding a second, it belongs somewhere else.
