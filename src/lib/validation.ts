import { z } from 'zod';

// Shared Zod schemas — imported by both client forms (UX) and server actions
// (the authoritative trust boundary).

export const zUuid = z.uuid();
export const zEmail = z.email();
export const zRole = z.enum(['viewer', 'editor']);
export const zTitle = z.string().trim().min(1, 'Title is required').max(200, 'Title is too long');

// Shape guard for Tiptap/ProseMirror JSON. We validate the top-level shape but
// always persist the ORIGINAL object (never the parsed result) so no nested
// node data is stripped.
export const zTiptapDoc = z.object({
  type: z.literal('doc'),
  content: z.array(z.any()).optional(),
});

export type Role = z.infer<typeof zRole>;
