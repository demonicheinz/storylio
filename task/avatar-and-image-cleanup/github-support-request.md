# GitHub Support request draft

Draft only — not submitted.

Subject: Personal portrait remains reachable through PR refs after history cleanup

I maintain the repository `demonicheinz/storylio`. I removed a personal portrait
from its Git history using git-filter-repo 2.47.0 and successfully force-pushed
all three writable branches (`main`, `staging`, and `refactor/ui-base-ui`). There
are no tags. The cleaned branch tips were verified again on October 25, 2026.

Details:

- Removed path: `public/images/heinz.jpg`.
- Original blob: `2217f18d64edd7acbb6188fd0e32179f7cbf9724`.
- First changed commit: `16afb70873aaa88863d66d7669968fc06db0d3b1`.
- git-filter-repo rewrote 149 of 167 commits in the isolated mirror.
- Its cleaned object database no longer contains the original portrait blob.
- A post-push audit found `refs/pull/1/head` through `refs/pull/19/head` still
  pointing to original commit hashes. These GitHub-managed refs retain old
  ancestry and cannot be replaced by a normal push.

Could you review whether this personal-data removal is eligible for assistance,
and help remove GitHub-managed references and cached views that continue to make
the old portrait accessible? I can provide the ref map and original/rewritten
branch hashes if needed.

I understand that this request cannot remove copies in independent forks,
existing clones, third-party caches, or old hosting deployments.
