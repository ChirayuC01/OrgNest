"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // In production this would go to an error-reporting service (Sentry, etc.)
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          background: "#0f172a",
          color: "#f8fafc",
          margin: 0,
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💥</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.75rem" }}>
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                background: "transparent",
                color: "#94a3b8",
                border: "1px solid #334155",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
