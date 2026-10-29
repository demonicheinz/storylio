## Summary

Describe the problem this pull request solves and the outcome of the changes.

## Changes

* <!-- Describe the main changes -->

## Impact

Select the areas affected by this change:

* [ ] Public site
* [ ] Dashboard or CMS
* [ ] Authentication or authorization
* [ ] Database, Drizzle schema, migrations, or seeds
* [ ] MDX or content rendering
* [ ] Uploads, Cloudinary, or media metadata
* [ ] Environment or deployment
* [ ] Tooling, dependencies, or CI
* [ ] None of the above

## Verification

Check the commands that were executed:

* [ ] `bun run typecheck`
* [ ] `bun run lint`
* [ ] `bun run test` (or targeted tests listed below)
* [ ] `bun run test:security` (when relevant)
* [ ] `bun run build`
* [ ] Browser checks with Playwright CLI (commands and scenarios listed below)
* [ ] Manual verification of affected routes or user flows
* [ ] Not applicable (explain below)

List commands, results, relevant routes, and any checks blocked by the environment.
For browser checks, distinguish local fixtures/mocked actions from authenticated
application flows. Include viewport sizes for responsive changes. Use
`bun run build:hosted` only when the environment is already injected; local
scripts use Infisical (`dev`, `staging`, or `prod`). Never include secret values.

```text

```

## Safety Checklist

* [ ] No secrets or server-only environment variables are exposed
* [ ] Unrelated business logic and user-facing behavior remain unchanged
* [ ] Drizzle/schema changes include required migrations and relevant seed updates, or are not applicable
* [ ] Cache or revalidation logic has been updated when public content changes
* [ ] Dashboard access and Server Actions continue to validate the current user/session
* [ ] Upload flows continue to validate files and preserve media metadata
* [ ] MDX fallbacks and safety rules remain intact
* [ ] Non-applicable items have been reviewed and require no action

## UI Evidence

Attach screenshots or recordings for UI-related changes. Enter `N/A` if there are no visual changes.
For shared components, include affected states such as mobile/tablet/desktop,
keyboard focus, open popovers/dialogs, and loading/error states where relevant.
Link reviewable evidence in `task/<task-name>/`; local diagnostics and generated
skill history belong in ignored `.tmp/` and `.impeccable/` directories.

## Linked Issue

Closes #

## Deployment Notes

List any required environment variables, migrations, backfills, OAuth callback updates, or deployment steps. Enter `None` if no deployment actions are required.
For database changes, describe rollout order and compatibility with the currently
deployed app. Identify backups required before destructive migrations; do not
assume the migrator can stop at an arbitrary journal entry. Existing databases
require the reviewed baseline described in `docs/DRIZZLE_MIGRATION.md`.
