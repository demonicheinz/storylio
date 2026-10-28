type AuthError = { status?: number; code?: string } | null;

export function getSignInError(
  error: AuthError,
  method: "password" | "github" | "passkey",
) {
  if (error?.status === 0) return SIGN_IN_CONNECTION_ERROR;
  if (error?.code === "MFA_PASSWORD_REQUIRED")
    return "Two-factor authentication is enabled. Sign in with your password, then use your authenticator or a backup code.";
  if (error?.status === 429)
    return "Too many attempts. Please wait a minute and try again.";
  if (
    method === "password" &&
    (error?.status === 401 || error?.code === "INVALID_EMAIL_OR_PASSWORD")
  )
    return "Email or password is incorrect.";
  if (
    method === "passkey" &&
    [
      "AUTH_CANCELLED",
      "ERROR_CEREMONY_ABORTED",
      "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    ].includes(error?.code ?? "")
  )
    return "Passkey sign-in was cancelled. Try again or use your password.";
  if (method === "github")
    return "Unable to sign in with GitHub. Please try again.";
  if (method === "passkey")
    return "Unable to sign in with this passkey. Try again or use your password.";
  return "Unable to sign in. Please try again.";
}

export const SIGN_IN_CONNECTION_ERROR =
  "Unable to connect. Check your connection and try again.";
