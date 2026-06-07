"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          alignItems: "center",
          background: "#090615",
          color: "#f8f7ff",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "560px" }}>
          <p style={{ color: "#c4b5fd", fontSize: "12px", fontWeight: 700 }}>
            STORYLIO
          </p>
          <h1 style={{ fontSize: "36px", lineHeight: 1.15, margin: "16px 0" }}>
            Something went wrong at the application level.
          </h1>
          <p style={{ color: "#b8b4c7", lineHeight: 1.7 }}>
            Try loading Storylio again. No sensitive error details are shown
            here.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              background: "#7c3aed",
              border: 0,
              borderRadius: "999px",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              marginTop: "24px",
              padding: "12px 20px",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
