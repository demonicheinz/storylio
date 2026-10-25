import { notFound } from "next/navigation";

// Explicit rewrite destination for detail requests rejected before streaming.
export default function MissingPublicContent() {
  notFound();
}
