export function getAuthAllowedHosts(
  authUrl: string,
  env: Record<string, string | undefined>,
) {
  const hosts = new Set([new URL(authUrl).host]);
  if (env.NODE_ENV !== "production") hosts.add("localhost:*");
  // Exact Vercel deployment/branch hosts, never every *.vercel.app project.
  for (const name of ["VERCEL_URL", "VERCEL_BRANCH_URL"]) {
    const host = env[name];
    if (host && /^[a-zA-Z0-9-]+\.vercel\.app$/.test(host)) hosts.add(host);
  }
  return [...hosts];
}

export function isAllowedGitHubAccount(
  accountId: string,
  ownerGitHubId?: string,
) {
  return Boolean(ownerGitHubId && accountId === ownerGitHubId);
}
