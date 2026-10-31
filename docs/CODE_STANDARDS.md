# Code standards

Use these rules when changing Storylio. Keep the existing public appearance,
CMS contracts, and security behavior unless the task explicitly changes them.

## Module ownership

- Keep feature behavior under `src/features/dashboard/<feature>/`. Reuse shared
  dashboard UI under `src/features/dashboard/shared/` when consumers have the
  same interaction and state contract.
- Keep domain-independent helpers under `src/lib/`; keep them free of React,
  database clients, and environment access when used by client components.
- Use the checked-in `src/components/ui/` primitives. Change common behavior
  there instead of repeating overrides in each screen.
- Batch selection uses each item's checkbox and action menu as sequential
  keyboard targets. Do not add a focusable card wrapper. Existing Gallery/Media
  preview/title buttons leave the Tab order only during batch mode; retain
  pointer interaction and restore ordinary preview tab stops on exit.
- Default route components to the server. Add a client boundary for browser
  state or client hooks, and keep database/auth modules out of that boundary.
- Do not introduce a wrapper that only renames another function. An extraction
  should remove duplicated policy, reduce state ownership, or isolate a task.

## Shared contracts

- Use `DashboardPagination` for Projects, Posts, Gallery, and Media. Managers
  own the current page, filtering, and page-size reset; pagination renders the
  range, controls, and page-size choices without owning collection state.
- Use `formatBytes` from `src/lib/format-bytes.ts` for file sizes. Keep contextual
  missing-data labels in the caller: an unavailable Gallery size is "Not stored",
  while a known zero-byte file is "0 B".
- Use existing pagination/filter/sort helpers before adding another one.
  Preserve query canonicalization and stable ordering when consolidating them.
- Use `confirmAction` and the dashboard `DashboardConfirmationHost` for imperative
  confirmation choices. Await the result before submitting actions; a modal close
  handler must cancel its original event synchronously before opening confirmation.
  Keep multi-step mutation dialogs local when they own pending/error/retry UI.
  Native `beforeunload` protection remains for tab close/reload; in-app draft links
  use the shared navigation guard and styled confirmation instead of window.confirm.
- Keep record slug generation distinct from heading anchor generation. They
  serve different contracts; similar code alone is not proof they are interchangeable.
- Follow [IMAGE_DELIVERY.md](IMAGE_DELIVERY.md) for responsive image sizes and
  quality. Use [DESIGN.md](../DESIGN.md) for visual tokens and component geometry.
- Public Blog/Project cover adapters keep their fallback copy and hover styles;
  `ContentCover` owns image loading/failure behavior and shared geometry. Scope
  failure state to the source so replacing a failed URL can load a new image.

## Validation and error handling

- Validate untrusted input at API/action boundaries using the feature's schema.
  Draft and publication validation may intentionally differ.
- Require the current owner session before every CMS mutation. Use native
  Drizzle queries and `src/lib/db/schema.ts`; do not restore Prisma-shaped APIs.
- Return `ActionResult` from dashboard mutations and preserve field errors.
  Separate an already committed write from refresh/revalidation failure.
- Attach rejection handling immediately to background promises. Do not log raw
  passwords, tokens, email bodies, provider responses, or sensitive URLs.
- An empty catch is acceptable only for an intentional best-effort operation
  such as optional browser storage. Database failures must remain diagnosable.

## Dependencies and tooling

- Classify dependencies by their actual consumers, including CSS imports.
  Tests, linters and standalone generators normally belong in `devDependencies`.
  Keep `shadcn` in `dependencies`: globals.css imports `shadcn/tailwind.css`, which
  supplies shared Tailwind utilities resolved during the application build.
  The local UI component source does not make that CSS dependency unnecessary.
- Review the dependency tree and advisory before changing a version. Moving
  a tool to dev dependencies does not fix its advisory or make all-dependency
  audits clean. Record unresolved upstream findings explicitly.
- Let Bun generate `bun.lock`. Inspect resolved versions and install with the
  frozen lockfile in CI. Do not hand-edit resolutions to silence an audit.
- Biome is the formatter/import organizer; use the repository configuration
  and local schema. Avoid an unrelated repository-wide formatting pass.
- Source lint is being enabled incrementally through positive `linter.includes`
  patterns. An area is covered only when it matches those patterns; a successful
  `bun run lint` does not establish lint coverage for the rest of the repository.
  Formatter/assist checks still apply repository-wide. Expand coverage after
  reviewing the area's diagnostics, with narrow justified exceptions instead
  of disabling rules globally. Never use a list containing only negative globs.

## Refactoring and verification

- Change one contract at a time. First compare callers, state ownership, tests
  and failure paths; then consolidate only behavior that is actually equivalent.
- A file near 1,000 lines merits inspection, not an arbitrary split. Extract
  self-contained UI/policy before growing a manager; moving the same complexity
  into equally coupled files is not an improvement.
- Keep behavior changes separate from mechanical refactors. Retain visual
  labels, accessibility names, focus behavior and responsive geometry.
- Test observed outcomes and boundaries. For a regression, demonstrate failure
  before the fix; for a shared control, verify it with keyboard and pointer in
  a browser fixture. A deliberate mutation should fail the relevant test.
- Run scoped tests after each increment, then lint, TypeScript and build. Run
  the full Vitest suite when shared behavior spans multiple features.
- Use local PGlite fixtures for database tests. Browser fixtures must not modify
  real CMS content to demonstrate behavior. See [../README.md](../README.md).
- Put review plans/evidence in `task/<task-name>/`, temporary scripts in `.tmp/`,
  and durable operating guides in `docs/`. Keep local graph outputs ignored.

Use [../.github/BRANCH_CONVENTION.md](../.github/BRANCH_CONVENTION.md) as the
branch/merge policy. Source and tests take precedence over a stale generated
graph; use graph relationships to guide inspection, then verify the current code.
