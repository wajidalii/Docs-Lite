# DocsLite — UI/UX Design Brief & Handoff Request

A complete brief for designing the full interface of **DocsLite**, a lightweight
collaborative document editor. This document describes *what the product does,
every screen, every control, and every flow* — and asks the designer to produce a
best-in-class, cohesive, production-ready UI and the brand assets around it.

> **Creative latitude is explicit and encouraged.** The functionality below is
> fixed; the *design* is not. Improve layout, hierarchy, spacing, motion, and
> visual language freely. Propose a distinctive, memorable aesthetic — just keep
> it professional, fast-feeling, and true to the flows described here. The
> current colors/type are a *starting point to beat*, not a constraint.

---

## 1. Product snapshot (context block)

| | |
|---|---|
| **Product** | DocsLite |
| **One-liner** | A fast, focused, Google-Docs-lite editor for creating, formatting, and sharing documents. |
| **Audience** | Knowledge workers / small teams collaborating on shared docs. Comfortable with tools like Google Docs, Notion, Linear. |
| **Primary goal of the UI** | Make creating, editing, and sharing a document feel effortless, trustworthy, and quick. Clarity and speed over decoration. |
| **Platform** | Responsive web app (desktop-first; must work well on tablet; graceful on mobile). |
| **Tech it must build in** | Next.js (React) + Tailwind CSS. Deliver design tokens + components that map cleanly to this stack. |
| **Tone** | Calm, precise, modern, confident. Not playful/cartoonish, not enterprise-stuffy. |
| **Mode** | Light mode is primary. Dark mode is a welcome bonus if provided as a full token set. |

---

## 2. Design principles (what "good" means here)

1. **Content first.** The document is the hero. Chrome recedes; the writing
   surface feels like paper you want to write on.
2. **Calm clarity.** Strong visual hierarchy, generous spacing, one clear action
   per context. Nothing competes for attention.
3. **Fast feel.** Snappy micro-interactions, instant feedback (save status,
   toasts), no heavy or bouncy animation.
4. **Trustworthy.** Sharing and permissions must feel legible and safe — the user
   always knows who can see/edit a doc.
5. **Consistent system.** One spacing scale, one type scale, one radius, a small
   coherent icon set, purposeful color.
6. **Accessible by default.** WCAG 2.1 AA contrast, visible focus, full keyboard
   support.

**Never do this (anti-patterns):** neon/gamer gradients, drop-shadow overload,
cluttered toolbars, tiny low-contrast gray text, generic Bootstrap look,
stock-photo hero vibes, more than one primary action per screen, decorative
elements that don't aid the task.

**Reference vibes (for mood, not to copy):** Linear (precision, restraint),
Craft/Notion (calm writing surface), Vercel dashboard (clean neutrals + one
confident accent), Google Docs (familiar editing affordances).

---

## 3. Visual foundation (starting point — improve freely)

- **Palette (current):** background `#F7F8FA`, surface `#FFFFFF`, muted surface
  `#F1F3F5`, border `#E4E7EC`, text `#1A2027`, muted text `#667085`, primary/accent
  `#2563EB`, primary hover `#1D4ED8`, primary tint `#EFF4FF`, success `#16A34A`,
  danger `#DC2626`. → *You may refine or replace this palette; if you do, deliver a
  complete token set and keep AA contrast.*
- **Type (current):** Inter. UI 14px base; document body 16px/1.7; H1 30/700,
  H2 24/600, H3 20/600. → *Propose a better type system if you have one (pairing a
  distinctive display face with a clean UI/body face is welcome).*
- **Radius:** 8px. **Shadow:** soft, subtle (1–3px). **Icons:** currently
  Lucide (1.5px stroke). **Motion:** 120–200ms ease; subtle.

---

## 3b. Technical stack the design must build into

Design so the handoff drops cleanly into our actual codebase. This is the exact
UI stack:

- **Framework:** Next.js 16 (App Router) + **React 19** + **TypeScript**.
- **Styling:** **Tailwind CSS v4** (CSS-first `@theme` tokens). Deliver design
  tokens as CSS variables / Tailwind theme values with real names + hex/px.
- **Components:** currently **hand-authored** components + CSS (no MUI/Chakra/AntD).
  A **Tailwind-native** component approach is ideal; **shadcn/ui** (Radix + Tailwind)
  is acceptable and welcome for primitives (dialog, select, tooltip) — but nothing
  that requires a heavy runtime style engine (no CSS-in-JS libraries).
- **Icons:** **Lucide** (React) today, 1.5px stroke. Keep to Lucide or an
  equivalent open, stroke-based set; call out any custom icons.
- **Editor:** **Tiptap v3** (ProseMirror). The writing canvas renders a
  `.ProseMirror` surface — style headings, paragraphs, bulleted/numbered lists,
  bold/italic/underline as document typography (this is real editable content,
  not a mockup of text).
- **Toasts:** **sonner**. **Fonts:** loaded via `next/font` (self-hosted; free/OSS
  only). **Motion:** CSS transitions / small keyframes (no heavy animation libs).
- **Modes:** light mode primary; dark mode optional but must be a complete token set.

Anything you deliver should be expressible in Tailwind utilities + CSS variables
and standard React components.

## 4. Information architecture (screens/routes)

| Route | Screen | Auth |
|---|---|---|
| `/login` | User picker (demo sign-in) | public |
| `/` | Dashboard — sidebar + workspace | signed-in |
| `/documents/[id]` | Document editor | signed-in + has access |
| — | Share dialog (modal over editor) | owner |
| — | Toasts, empty/loading/error states, 404 | — |

---

## 5. Screen-by-screen specification

### 5.1 Login / user picker (`/login`)
- **Purpose:** Let a user pick one of 4 seeded demo accounts to sign in (no
  password — this is an intentional demo login; label it clearly and elegantly).
- **Elements:** product logo/wordmark; short subtitle; a list of 4 selectable
  user cards (avatar with initials, name, email). Selecting a card signs in.
- **States:** default, hover/focus on a card, selecting (brief loading).
- **Notes:** This is the first impression — make it feel premium and intentional.
  Consider a subtle brand backdrop. Keep it a single calm centered moment.

### 5.2 Dashboard (`/`)
Two zones: a **left sidebar** (navigation + actions) and a **main workspace**.

**Sidebar contains:**
- Product logo/wordmark (top).
- **New document** — primary action button.
- **Upload .txt / .md** — secondary action button (opens file picker).
- **"My Documents"** section — list of documents the user owns (row = file icon,
  title, relative time; hover + active/selected states).
- **"Shared with me"** section — list of documents shared with the user (row also
  shows a role badge: "Can edit" / "View only").
- **User area** (bottom) — current user name + email, and a **Switch user** action
  (returns to the user picker; this is how sign-out / account switching works).

**Main workspace:**
- When no doc is open: an inviting empty state ("Select a document or create a new
  one…"). Consider a light illustration or a large primary CTA.

**States to design:** empty (no owned docs, nothing shared), populated (many docs
— show scrolling, truncation, active selection), loading, error.

### 5.3 Document editor (`/documents/[id]`)
The core screen. Three stacked regions: **document header bar**, **formatting
toolbar**, **writing canvas**.

**Document header bar:**
- Back arrow (to dashboard).
- **Document title** — inline-editable text (owner can rename; others see it
  read-only).
- **Role badge** — "Owner" / "Can edit" / "View only".
- **Share** button (owner only) — opens the share dialog.
- **Delete** button (owner only) — icon button, destructive.

**Formatting toolbar** (only shown when the user can edit):
- Text style: **H1**, **H2**, **H3**, **Paragraph**.
- Marks: **Bold**, **Italic**, **Underline**.
- Lists: **Bulleted list**, **Numbered list**.
- Buttons show an **active state** when the current selection has that format.
- **Autosave status indicator** (right side): "Saving…", "Saved" (success),
  "Save failed" (danger). Subtle, non-intrusive.

**Writing canvas:**
- A centered "sheet" (paper) on the app background. Comfortable measure (~760px),
  generous padding, beautiful document typography (headings, paragraphs, bulleted
  & numbered lists, bold/italic/underline).
- **Viewer variant:** no toolbar, read-only surface, clear "View only" cue.

**States:** editing (owner/editor), read-only (viewer), empty document, long
document (scroll), saving/saved/failed.

### 5.4 Share dialog (modal)
- **Purpose:** owner shares a document with another user and manages access.
- **Elements:** title "Share document"; close button; a form row = **email input**
  + **role select** ("Can edit" / "Can view") + **Share** button; a
  **collaborators list** (each row: avatar/name/email, a role select to change
  access, and a **Remove** action); a small hint listing the demo teammate emails.
- **States:** empty (no collaborators), populated, inline validation error
  (invalid email / unknown user / already-owner), success (collaborator added).
- **Notes:** Make permissions feel clear and safe. This is a trust surface.

### 5.5 System states & feedback
- **Toasts** (bottom): success and error (e.g., upload failed). Design the toast
  style (color-coded, dismissible).
- **Empty states:** dashboard (owned/shared), collaborators list.
- **Loading:** button busy/spinner states, page/skeleton loading.
- **Error / 404:** friendly "document not found / no access" page.

---

## 6. Component inventory (design each with all states)

Design a small, coherent component library. For each, cover: default, hover,
focus-visible, active/pressed, disabled, and (where relevant) loading/error.

- **Buttons:** primary, secondary, ghost, destructive, and icon-only.
- **Inputs:** text input, email input, inline-editable title.
- **Select / dropdown:** role selector (Can edit / Can view).
- **Badges:** role badges (Owner / Can edit / View only) — distinct but calm.
- **Avatar:** circular, initials-based, with a color system for 4+ users.
- **List rows:** document row (icon, title, time, optional badge), collaborator row.
- **Toolbar button:** icon button with active/toggled state + grouping/dividers.
- **Save-status indicator:** idle / saving / saved / error.
- **Modal / dialog:** overlay, container, header, body, actions.
- **Toast:** success / error variants.
- **Tooltip** (optional, for icon buttons).
- **Sidebar section header, dividers, empty-state block.**

---

## 7. Key user flows (design the happy path + edge states)

1. **Sign in:** open app → user picker → select Alice → dashboard.
2. **Create & edit:** New document → editor → type a title → format text (H1,
   bold, list) → autosave shows "Saved" → back to dashboard (doc now listed).
3. **Upload:** Upload .txt/.md → file picker → new document opens with parsed
   content. Error path: wrong type/too large → toast.
4. **Share & collaborate:** open a doc → Share → enter teammate email + role →
   collaborator appears → Switch user → the doc shows under "Shared with me" for
   that user, editable per role.
5. **Manage access:** change a collaborator's role; remove a collaborator.

---

## 8. Content & microcopy (tone examples)

- Empty dashboard: *"No documents yet — create one or upload a .txt/.md."*
- Login subtitle: *"Pick a user to continue"* (frame the demo login gracefully).
- Save states: *Saving… / Saved / Save failed — keep typing to retry.*
- Share hint: *"Share with a teammate by email."*
- Voice: concise, human, reassuring. No jargon, no exclamation spam.

---

## 9. Accessibility requirements

- WCAG 2.1 **AA** contrast for all text and meaningful UI.
- Visible **focus-visible** rings on every interactive element.
- Full **keyboard** operability (tab order, Enter/Escape in dialogs, toolbar).
- Don't rely on color alone (badges/status pair color with text/icon).
- Respect reduced-motion.

---

## 10. Responsive behavior — **required, not optional**

Fully responsive design is a **required deliverable**. Design and hand off every
key screen at **three breakpoints**, and specify the exact reflow rules.

**Breakpoints to design:**
- **Desktop** ≥ 1024px (primary): sidebar + workspace as described.
- **Tablet** 640–1023px: sidebar narrows or becomes a collapsible/off-canvas
  panel; editor stays centered with comfortable margins.
- **Mobile** < 640px: sidebar collapses into a **drawer / top app bar** with a
  hamburger or bottom nav; the writing canvas goes **full-width** with comfortable
  padding; the formatting toolbar **condenses** (wrap, horizontal-scroll, or an
  "overflow / more" menu) while keeping the most-used controls one tap away.

**Mobile rules to honor:**
- **Touch targets ≥ 44×44px**; adequate spacing between tappable rows/buttons.
- The **share dialog** becomes a full-screen sheet or bottom sheet on mobile.
- Document rows, the user switcher, and toasts must all be usable one-handed.
- No horizontal page scroll; content reflows, never clips.
- Test the three states that matter most on mobile: **dashboard list**, **editor
  + toolbar**, and **share sheet**.

Deliverables must include mobile (and at least tablet) frames for: login,
dashboard, editor, and the share dialog.

---

## 11. Brand & marketing assets required (must-have deliverables)

Please design and deliver all of the following, consistent with the UI:

1. **Logo / wordmark** — "DocsLite." A primary lockup + an icon-only mark. Give
   light and dark variants. Vector (SVG) preferred.
2. **App icon / favicon** — the icon-only mark, exported at favicon sizes
   (16, 32, 180 apple-touch, 512 maskable) plus source SVG.
3. **Open Graph / social share image** — 1200×630, on-brand, with the product
   name + tagline, for link previews.
4. **Avatar system** — the initials-avatar style + a color assignment approach for
   users (accessible contrast).
5. **Empty-state illustration(s)** — a light, on-brand illustration or motif for
   the empty dashboard / empty states (SVG, optional but desired).
6. (Optional) a simple **loading/spinner** and **document/file iconography** style.

Guidance: the mark should read at 16px, feel modern and trustworthy, and relate to
"documents + speed/collaboration" without being a literal clip-art page. Free/
open-license assets and fonts only.

---

## 12. Expected handoff deliverables (checklist)

- [ ] **All screens**, in **all states** listed above (login, dashboard empty +
      populated, editor owner/editor/viewer, share dialog states, upload states,
      toasts, empty/loading/error/404), desktop + a mobile treatment of the key ones.
- [ ] A **component library** (section 6) with every interaction state.
- [ ] **Design tokens** — color, typography, spacing, radius, shadow, motion —
      structured so they map to Tailwind/CSS variables (name them).
- [ ] **Icon set** decision (which library/style) and any custom icons.
- [ ] **Brand assets** (section 11): logo, favicon set, OG image, avatars,
      empty-state art.
- [ ] **Interaction/motion notes** (hover, focus, dialog open/close, toast, save
      status, list selection).
- [ ] **Redlines / specs** or clear annotations for developer handoff (spacing,
      sizes, states), plus responsive rules.
- [ ] (Optional) **Dark mode** token set.

---

## 13. Constraints & out-of-scope

- **Design only what exists.** The app's features are exactly those in sections
  4–7. **Do not** design UI for features we don't have: real-time multi-cursor
  presence, comments/suggestions, version history, notifications, search, folders,
  or account settings. (You may leave tasteful room in the layout for future
  growth, but don't add controls that do nothing.)
- Must be buildable in **Next.js + React + Tailwind**; prefer standard components
  and CSS-friendly effects over anything requiring heavy custom rendering.
- **Light mode primary**; dark mode optional but must be complete if included.
- **Free/open-license** fonts, icons, and illustration assets only.

---

## 14. What success looks like

A reviewer opens DocsLite and immediately thinks *"this is clean, fast, and
professionally designed"* — the writing experience feels premium, sharing feels
clear and safe, and every screen and state is covered with a coherent visual
system and a memorable but understated brand.
