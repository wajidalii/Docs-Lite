# DocsLite — Design Handoff Kit

This folder contains everything needed to get a rich, production-ready UI/UX
design for **DocsLite** from an AI design tool (Claude Design / claude.ai), then
implement it in the app.

## Files

| File | What it is |
|---|---|
| **`DESIGN_BRIEF.md`** | The source of truth. Product context, brand direction, design principles, our exact UI stack, all screens/states, component inventory, user flows, responsive rules (3 breakpoints), accessibility, and the full asset + handoff checklist. |
| **`CLAUDE_DESIGN_PROMPT.md`** | The paste-ready prompt that sets the designer's role, quality bar, working order, and deliverables. |
| `../screenshots/` | The current bare UI — attach as the *"before"* to elevate. |

## How to run the handoff

1. Open **Claude Design** (or claude.ai with the design skill / a capable AI UI tool).
2. **Attach** `DESIGN_BRIEF.md`. Optionally also attach the 5 images in
   `../screenshots/` as the current state.
3. **Paste** the prompt from `CLAUDE_DESIGN_PROMPT.md`.
4. It returns **2–3 art directions first** — pick one (or tell it which), then it
   produces the full system + brand assets.

## What you should get back

- Art direction (chosen) with palette + type + mood.
- **Design tokens** (color/type/spacing/radius/shadow/motion) mapped to Tailwind/CSS vars.
- **Component library** with all interaction states.
- **All screens in all states**, at **desktop / tablet / mobile**.
- **Brand assets:** logo (wordmark + icon, SVG), favicon/app-icon set
  (16/32/180/512), **1200×630 Open Graph image**, avatar system, empty-state art.
- Developer-handoff notes (spacing/sizes/states, motion, icon set).

## After the handoff → implementation

Send the handoff back to the build assistant. Implementation will:
- Translate tokens into the Tailwind v4 `@theme` + `globals.css`.
- Rebuild components (`src/components/**`) to match, keeping all existing behavior.
- Apply the responsive rules (sidebar→drawer, condensed toolbar, mobile share sheet).
- Add the assets: favicon set + `opengraph-image`, and wire titles/metadata in
  `src/app/layout.tsx`.
- Re-run tests + build to confirm nothing regressed.

## Guardrails (already in the brief)

- Design **only** existing features (no real-time cursors, comments, version
  history, search, folders, settings).
- Must build in **Next.js 16 + React 19 + Tailwind v4** (shadcn/ui ok; no CSS-in-JS).
- **WCAG 2.1 AA**, visible focus, keyboard support.
- **Free/open-license** fonts, icons, and art only.
