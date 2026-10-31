/** Only dashboard paths are valid return destinations for this private CMS. */
export function getAuthRedirect(value?: string | null | readonly string[]) {
  const candidate = typeof value === "string" ? value : value?.[0];
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Reject control characters and whitespace before parsing untrusted redirect destinations.
  if (!candidate?.startsWith("/") || /[\\\u0000-\u0020\u007f]/.test(candidate))
    return "/dashboard";
  try {
    const url = new URL(candidate, "https://storylio.invalid");
    if (
      url.origin !== "https://storylio.invalid" ||
      !/^\/dashboard(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(url.pathname)
    )
      return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}
