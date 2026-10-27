/**
 * Whether GitHub OAuth login is configured.
 * Require both OAuth credentials and the pinned owner identity.
 * Safe to import from both server and client contexts (reads env at import time).
 */
export const isGitHubEnabled =
  !!process.env.GITHUB_CLIENT_ID &&
  !!process.env.GITHUB_CLIENT_SECRET &&
  !!process.env.OWNER_GITHUB_ID;
