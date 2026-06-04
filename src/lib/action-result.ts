/**
 * Standardized action result type for all Server Actions.
 * Every dashboard mutation returns this shape so the client
 * can handle success/error consistently.
 */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Convenience constructors */
export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionError(error: string): ActionResult<never> {
  return { success: false, error };
}
