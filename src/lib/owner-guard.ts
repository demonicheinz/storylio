export function getOwnerEmails() {
  return (process.env.OWNER_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email: string | null | undefined) {
  if (!email) return false;

  return getOwnerEmails().includes(email.trim().toLowerCase());
}
