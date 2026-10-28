export function resolveAvatarSource(
  source?: string | null,
): string | undefined {
  const value = source?.trim();
  if (!value) return undefined;

  try {
    const url = new URL(value, "https://storylio.invalid");
    if (
      decodeURIComponent(url.pathname).toLowerCase() === "/images/heinz.jpg"
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return value;
}
