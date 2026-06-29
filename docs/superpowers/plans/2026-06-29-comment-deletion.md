# Comment Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure comment deletion so admins can delete any comment and normal users can delete only their own comments.

**Architecture:** Add a server-side `deleteComment` helper that enforces ownership/admin permissions, expose it through `DELETE /api/comments/[id]`, and add delete buttons to article comments and the admin review page. Keep authorization on the server; UI visibility is only convenience.

**Tech Stack:** Astro SSR API routes, better-sqlite3, Vitest, vanilla client-side JavaScript.

---

### Task 1: Server deletion behavior

**Files:**
- Modify: `src/lib/server/comments.ts`
- Test: `src/lib/server/comments.test.ts`

- [ ] Write tests for owner deletion, non-owner rejection, admin deletion, and parent-comment cascade deletion.
- [ ] Run `pnpm test src/lib/server/comments.test.ts` and confirm the new tests fail because `deleteComment` is missing.
- [ ] Implement `deleteComment(db, id, viewer)` with server-side permission checks.
- [ ] Re-run `pnpm test src/lib/server/comments.test.ts` and confirm it passes.

### Task 2: API route

**Files:**
- Create: `src/pages/api/comments/[id].ts`

- [ ] Add `DELETE` route with same-origin check and login requirement.
- [ ] Call `deleteComment(getDb(), id, locals.user)` and return `{ ok: true }`.
- [ ] Return 401 for logged-out users, 403 for forbidden deletion, and 404 for missing comments.

### Task 3: Article page UI

**Files:**
- Modify: `src/components/PostInteractions.astro`

- [ ] Restore readable Chinese labels in the component.
- [ ] Store current user in the component state.
- [ ] Render a delete button for admins and comment owners.
- [ ] On click, confirm, call `DELETE /api/comments/[id]`, then reload comments.

### Task 4: Admin review UI

**Files:**
- Modify: `src/pages/admin/comments.astro`

- [ ] Add a delete button to each moderation card.
- [ ] On click, confirm, call `DELETE /api/comments/[id]`, then remove the card from the page.
- [ ] Restore readable Chinese labels in touched text if needed.

### Task 5: Verification and deployment

**Files:**
- All modified files

- [ ] Run `pnpm test`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm audit:build`.
- [ ] Scan source for suspicious repeated question marks and common mojibake markers.
- [ ] Commit, push to `main`, watch GitHub Actions, and verify the deployed site.
