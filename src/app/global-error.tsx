"use client";

import { useReportError } from "@/hooks/use-report-error";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useReportError(error, "global");

  return (
    <html lang="en" className="dark">
      <body
        style={{
          alignItems: "center",
          background: "#05070c",
          color: "#f2fbfe",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100svh",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "560px" }}>
          <h1 style={{ fontSize: "36px", lineHeight: 1.15, margin: "16px 0" }}>
            Something went wrong at the application level.
          </h1>
          <p style={{ color: "#a7b8c6", lineHeight: 1.7 }}>
            Try loading Storylio again. No sensitive error details are shown
            here.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#068ce6",
              border: 0,
              borderRadius: "8px",
              color: "#000b27",
              cursor: "pointer",
              fontWeight: 700,
              marginTop: "24px",
              padding: "12px 20px",
              minHeight: "48px",
            }}
          >
            Try again
          </button>
          <p>
            <a
              href="/"
              style={{
                color: "#78c6f5",
                display: "inline-flex",
                alignItems: "center",
                minHeight: "44px",
                marginTop: "12px",
              }}
            >
              Back to home
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
