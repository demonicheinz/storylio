function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}

export function authEmail({
  to,
  name,
  url,
  newEmail,
  passwordReset = false,
}: {
  to: string;
  name?: string | null;
  url: string;
  newEmail?: string;
  passwordReset?: boolean;
}) {
  const approval = Boolean(newEmail);
  const subject = passwordReset
    ? "Reset your password — Storylio"
    : approval
      ? "Approve your email change — Storylio"
      : "Verify your email — Storylio";
  const action = passwordReset
    ? "Reset password"
    : approval
      ? "Approve email change"
      : "Verify email";
  const message = passwordReset
    ? "Choose a new password for your Storylio account. This link can be used once. Resetting your password signs out all existing sessions; your authenticator remains enabled."
    : approval
      ? `You requested to change your Storylio login email to ${escapeHtml(newEmail ?? "")}. Approve this request before the new address is verified.`
      : "Confirm this email address for your Storylio account.";
  return {
    to,
    subject,
    html: `<h2>${action}</h2><p>Hi ${escapeHtml(name ?? "there")},</p><p>${message}</p><p><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;background:#068ce6;color:#000b27;border-radius:8px;text-decoration:none;font-weight:600;">${action}</a></p><p>If you didn't request this, ignore this email.</p><p>This link expires in ${passwordReset ? "30 minutes" : "1 hour"}.</p>`,
  };
}
