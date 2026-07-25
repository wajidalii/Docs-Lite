# Prompt to feed into Claude Design (paste alongside DESIGN_BRIEF.md)

> **How to use:** Attach / paste `DESIGN_BRIEF.md` together with the prompt below.
> The brief is the source of truth for functionality; the prompt sets the role,
> the quality bar, and the deliverables. If your tool has a "reference image"
> field, also attach the screenshots in `../screenshots/` as the *current* state
> to elevate.

---

## The prompt

You are a **senior product & brand designer** known for calm, precise,
best-in-class SaaS interfaces (think the craft level of Linear, Notion, Craft,
and the Vercel dashboard). I'm attaching a complete design brief for **DocsLite**,
a lightweight collaborative document editor. Read it fully — it defines every
screen, control, state, and flow. The **functionality is fixed; the design is
yours to elevate.**

**Your objective:** produce a complete, cohesive, production-ready UI design
system and brand identity for DocsLite that feels premium, fast, and
trustworthy — a clear level above the current bare implementation (screenshots
attached as the "before").

**Work in this order:**

1. **Art direction (start here).** Propose **2–3 distinct visual directions** for
   DocsLite — each with a name, a one-line concept, a mood, a color palette (hex),
   a type system (specific free/open fonts), and how the writing surface feels.
   Recommend one and say why. Keep all directions professional and content-first;
   avoid the anti-patterns in the brief's "never do this" list.

2. **Design the full system in the chosen direction:**
   - **Design tokens** — color, typography, spacing, radius, shadow, motion —
     named so they map cleanly to Tailwind / CSS variables.
   - **Component library** — every component in the brief (buttons incl. icon &
     destructive, inputs, inline-editable title, select, role badges, avatars,
     document/collaborator rows, toolbar buttons with active state, save-status
     indicator, modal, toast, tooltip, dividers, empty states) — each with
     default / hover / focus-visible / active / disabled (and loading/error where
     relevant).
   - **All screens, in all states:** login/user-picker; dashboard (empty +
     populated, with active selection); document editor (owner, editor, and
     read-only viewer variants; the header bar; the formatting toolbar with
     active states; the writing canvas with real document typography — headings,
     lists, bold/italic/underline); the share dialog (empty, populated, validation
     error, success); upload (idle/uploading/error); toasts; and a friendly
     not-found/no-access page.
   - **Fully responsive is required (not optional).** Design each key screen
     (login, dashboard, editor, share dialog) at **three breakpoints** — desktop
     (≥1024px), tablet (640–1023px), and **mobile (<640px)** — and specify the
     reflow: sidebar → drawer/top-app-bar, condensed/overflow toolbar, full-width
     canvas, share dialog → bottom/full-screen sheet, **touch targets ≥44px**, no
     horizontal scroll.

3. **Brand & marketing assets** (deliver all): a **DocsLite logo** (primary
   wordmark + icon-only mark, light/dark, SVG) that reads at 16px; a **favicon /
   app-icon set** (16/32/180/512 maskable + source SVG); a **1200×630 Open Graph**
   social-share image with product name + tagline; an **initials-avatar system**
   with an accessible color assignment; and a light **empty-state illustration/motif**.

4. **Developer handoff:** annotate spacing/sizes/states, document interaction &
   motion (hover, focus, dialog open/close, toast, save status, list selection),
   list the icon library/style you chose, and provide the token values in a
   copy-pasteable form.

**Our exact UI stack — design to build cleanly into this:** Next.js 16 (App
Router) + React 19 + TypeScript; **Tailwind CSS v4** (CSS-first `@theme` tokens —
deliver tokens as CSS variables/Tailwind theme values); components are
hand-authored + CSS today (**shadcn/ui** = Radix + Tailwind is welcome for
primitives; **no CSS-in-JS / heavy runtime style engines**); **Lucide** icons
(stroke-based); **Tiptap v3** editor (the canvas is a real `.ProseMirror` surface —
style headings/lists/bold/italic/underline as document typography); **sonner**
toasts; fonts via `next/font`; motion via CSS transitions. **Light mode primary**
(dark mode optional but complete if included). **Free/open-license** fonts, icons,
and art only.

**Hard constraints:**
- Design **only** the features in the brief. Do **not** invent UI for real-time
  cursors, comments, version history, notifications, search, folders, or settings.
- Maintain **WCAG 2.1 AA** contrast, visible focus states, and full keyboard
  operability.
- One clear primary action per context; content-first; calm, purposeful, fast.

**Quality bar:** treat this as a portfolio-grade handoff. Be specific (real hex,
real font names, real pixel/spacing values, real component states) — no vague
"modern and clean" placeholders. Make DocsLite feel like a product people would
be delighted to write in.

Deliver the art-direction options first for a quick check, then the full system
and assets.
