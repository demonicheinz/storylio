"use client";

import { useState } from "react";

/** Copy into a temporary public route only for the documented retry check. */
export default function BoundaryFixture() {
  const [failed, setFailed] = useState(false);
  if (failed)
    throw new Error(
      "Private fixture details must not appear in the recovery UI",
    );
  return (
    <main style={{ padding: "160px 24px" }}>
      <button type="button" onClick={() => setFailed(true)}>
        Trigger fixture error
      </button>
    </main>
  );
}
