/**
 * Standardized action result type for all Server Actions.
 * Every dashboard mutation returns this shape so the client
 * can handle success/error consistently.
 */
export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/** Convenience constructors */
export function actionSuccess<T>(data?: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { success: false, error, fieldErrors };
}
