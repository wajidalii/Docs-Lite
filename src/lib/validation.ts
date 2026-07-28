import { z } from 'zod';

// Shared Zod schemas — imported by both client forms (UX) and server actions
// (the authoritative trust boundary).

export const zUuid = z.uuid();
export const zEmail = z.email();
export const zRole = z.enum(['viewer', 'editor']);
export const zTitle = z.string().trim().min(1, 'Title is required').max(200, 'Title is too long');
export const zPassword = z.string().min(8, 'Password must be at least 8 characters').max(200);
export const zName = z.string().trim().min(1, 'Name is required').max(100, 'Name is too long');

export const zSignUpInput = z.object({ email: zEmail, password: zPassword, name: zName });
export const zSignInInput = z.object({ email: zEmail, password: zPassword });

// Shape guard for Tiptap/ProseMirror JSON. We validate the top-level shape but
// always persist the ORIGINAL object (never the parsed result) so no nested
// node data is stripped.
export const zTiptapDoc = z.object({
  type: z.literal('doc'),
  content: z.array(z.any()).optional(),
});

export type Role = z.infer<typeof zRole>;
