/**
 * Whether GitHub OAuth login is configured.
 * Only true when both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set.
 * Safe to import from both server and client contexts (reads env at import time).
 */
export const isGitHubEnabled =
  !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
