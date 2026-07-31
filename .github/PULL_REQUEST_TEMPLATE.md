## Summary
<!-- What changed and why — bullet points, not a diff narration. Reference exact
     files/functions where it helps ("new `documentService.duplicateDocumentForUser`"),
     and call out any deliberate scope decisions. -->

-

## Linked Issue
Closes #

## Testing Performed
<!-- Mirror what's actually true — check only what you ran, leave the rest
     unchecked rather than claiming it. -->
- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run lint` — clean
- [ ] `npm test` — unit tests pass
- [ ] `npm run test:int` — integration tests pass (requires Docker Postgres)
- [ ] `npm run build` — succeeds
- [ ] Manual verification in a running app

## Breaking Changes
<!-- API/action signature changes, schema changes, anything that changes existing
     behavior for an existing caller. "None" is a valid answer. -->

## Deployment Notes
<!-- Anything the person merging/deploying needs to do or know — most commonly:
     a generated-but-unapplied migration ("run `npm run db:migrate`"), a new
     backfill script, a new required/optional env var, or nothing at all. -->
