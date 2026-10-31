# Fixture lint coverage

Positive coverage includes `tests/fixtures/**` (64 lintable files), bringing the
selected total to 663 files with no diagnostics. Initial findings: sixteen
string-template style findings and one missing button type. Fixture app/server
strings retain the same IDs, labels, slugs and SVG data URLs. The Projects mock
Toggle disabled action explicitly uses type=button. No production file changed.

Normalized AST comparison passed for all twelve changed code files, accounting
explicitly for that button attribute; JSX/MJS parse without diagnostics. Existing
local SVG assets and data remain unchanged. The actual Projects editor fixture
passed consistency checks against About at five widths, including eight-tag
geometry, toolbar equivalence, image remove controls, screenshot rail geometry,
keyboard reorder and tablet stacking. Its first attempt reached the absent About
comparison server and failed; after starting the documented second fixture it
passed. This is fixture behavior, not real CMS/authentication verification.

Lint passed. Existing 104-file/795-test run applies to the prior test assertion
batch; no repeated full-suite or production-build claim for this fixture-only
change. Updated screenshots are local diagnostics; tracked previous screenshots
are restored unchanged. Known low deepmerge audit advisory remains unchanged.

Review/self-evaluation: accuracy 4/5 (AST/lint/real fixture, not every server run),
completeness 4/5 (fixtures covered; Overview/root still pending), clarity 4/5
(exceptions and verification limits explicit), actionability 4/5 (ordinary lint
now enforces fixture scope), conciseness 4/5 (no generic fixture framework).
Overall 4.0/5. No push.
