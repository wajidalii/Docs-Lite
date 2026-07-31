'use client';

import dynamic from 'next/dynamic';

// Tiptap + its extensions (tables, images, lowlight, slash-command, etc.) are
// the single heaviest dependency in this app (~700KB of the ~840KB
// /documents/[id] ships before this split, see #45). `ssr: false` defers
// fetching/parsing/executing that chunk until after the initial page shell
// hydrates, instead of just moving it to a separate file that's still
// downloaded eagerly (a plain `ssr: true` dynamic import doesn't actually
// defer the fetch — verified empirically while building this: the chunk
// still showed up as part of the route's initial hydration set). `ssr:
// false` isn't allowed directly inside a Server Component, hence this
// dedicated 'use client' wrapper — src/app/documents/[id]/page.tsx (a Server
// Component) imports this normally instead. Editor.tsx already uses Tiptap's
// `immediatelyRender: false`, so skipping SSR for it entirely is safe (no
// content flash/hydration mismatch — there's simply no server-rendered
// editor markup to reconcile against). The loading shell mirrors Editor's
// own .dl-canvas/.dl-sheet layout so there's no visual jump when the real
// content swaps in.
export const EditorLoader = dynamic(() => import('./Editor').then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="dl-canvas">
      <div className="dl-sheet dl-sheet-loading">
        <span className="dl-spinner" />
      </div>
    </div>
  ),
});
