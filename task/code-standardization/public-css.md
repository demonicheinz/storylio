# Public/common CSS lint coverage

Activate public/common stylesheet lint after the user authorized incremental
cleanup with a commit after each verified batch. The 48 diagnostics were 28
CSS Modules pseudo-class errors and 20 intentional important-style warnings.

Allow only `global`/`local` pseudo-classes in `**/*.module.css` through Biome's
documented ignore option. All other pseudo-class validation remains active.
Remove now-redundant selector exceptions from the sidebar/auth styles. Add local
declaration explanations for reduced-motion overrides, recovery/history layout,
scroll-driven compact footer geometry and the approved mobile avatar dimensions.
No tokens, selector order, animation values or declarations changed.

PostCSS AST comparisons matched every changed stylesheet after ignoring comments
and source formatting. TypeScript, build (38/38 pages), lint and whitespace checks
passed. Actual lint coverage is now **378 source files**, no diagnostics. A temporary
real-file probe confirmed valid :global passes and misspelled :globla still fails
with noUnknownPseudoClass. The stdin CLI probe did not exercise that validation;
it is not counted as evidence. The real-file probe was removed in a finally block.

A script temporarily rewrote line endings in unchanged module styles; their exact
HEAD bytes were restored before verification. No unrelated stylesheet edits remain.
No extra unit/browser tests were added for comment-only equivalent stylesheet
output. Official configuration reference:
https://biomejs.dev/linter/rules/no-unknown-pseudo-class/

Review: positive lint coverage, narrowly scoped CSS Modules syntax, no global rule
disable, identical stylesheet AST. No runtime/security/data contract changes or
new dependencies. Self-evaluation: accuracy 4/5 (AST and invalid-selector probe;
no fresh visual audit claim), completeness 4/5 (public/common CSS covered, effects
remain), clarity 4/5 (explicit exceptions), actionability 4/5 (commands reproducible),
conciseness 4/5 (declaration-local explanations, no new styling abstraction).
