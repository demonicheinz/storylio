# Scripts and test-helper lint coverage

Include scripts and tests/helpers through positive patterns; total lint coverage
is 402 files without diagnostics. Application source coverage remains 379; do not
confuse the combined source/tooling count with a new application-only count.

Seeder owner requirements remain explicit: dependent projects/posts/notes branches
narrow owner before reading its ID, preserving the existing early preflight before
any requested group writes. Remove a redundant owner return assertion. Menu output
does not return incidental values from forEach. Test migration URLs use equivalent
template syntax, and the HAST text converter import is aliased rather than shadowing
Object.toString. No database/repair/backfill script was executed against real data.

Five seed/helper suites passed 29 tests. Three new PGlite cases verify missing
owner rejects a plan containing earlier Home work without writing any group.
Removing the early preflight deliberately failed all three cases; production source
was restored before final verification. No optional chaining substituted for
required owner identity, and existing overwrite/profile/selection policy remains.
TypeScript/lint/whitespace results follow final completion.

Final run: all 29 tests passed again after restoring the deliberate mutation.
TypeScript, lint and whitespace checks passed. Source/tooling changes are small;
the prior 38-page production build/full suite belongs to the legacy-removal batch,
not a newly claimed full build of scripts. Review: owner preflight ordering is
preserved, no real administrative action was run and helper output is equivalent.
