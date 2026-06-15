## Summary

Describe the problem this pull request solves and the outcome of the changes.

## Changes

* <!-- Describe the main changes -->

## Impact

Select the areas affected by this change:

* [ ] Public site
* [ ] Dashboard or CMS
* [ ] Authentication or authorization
* [ ] Database, Prisma, migrations, or seeds
* [ ] MDX or content rendering
* [ ] Uploads, Cloudinary, or media metadata
* [ ] Environment or deployment
* [ ] Tooling, dependencies, or CI
* [ ] None of the above

## Verification

Check the commands that were executed:

* [ ] `bun run typecheck`
* [ ] `bun run lint`
* [ ] `bun run build`
* [ ] Manual verification of affected routes or user flows
* [ ] Not applicable (explain below)

Provide the relevant routes, scenarios, or reasoning:

```text

```

## Safety Checklist

* [ ] No secrets or server-only environment variables are exposed
* [ ] Unrelated business logic and user-facing behavior remain unchanged
* [ ] Prisma changes include the required migration and/or seed updates
* [ ] Cache or revalidation logic has been updated when public content changes
* [ ] Dashboard access and Server Actions continue to validate the current user/session
* [ ] Upload flows continue to validate files and preserve media metadata
* [ ] MDX fallbacks and safety rules remain intact
* [ ] Non-applicable items have been reviewed and require no action

## UI Evidence

Attach screenshots or recordings for UI-related changes. Enter `N/A` if there are no visual changes.

## Linked Issue

Closes #

## Deployment Notes

List any required environment variables, migrations, backfills, OAuth callback updates, or deployment steps. Enter `None` if no deployment actions are required.
