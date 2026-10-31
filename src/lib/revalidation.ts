import {
  revalidatePath as invalidatePath,
  updateTag as invalidateTag,
} from "next/cache";

// Database commits cannot be undone when subsequent cache invalidation fails.
export function revalidatePath(...args: Parameters<typeof invalidatePath>) {
  try {
    invalidatePath(...args);
  } catch {
    console.error("Saved changes, but path revalidation failed.");
  }
}

export function updateTag(...args: Parameters<typeof invalidateTag>) {
  try {
    invalidateTag(...args);
  } catch {
    console.error("Saved changes, but tag revalidation failed.");
  }
}
