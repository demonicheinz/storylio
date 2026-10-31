import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

/** Validate configuration without exposing the DSN's credentials to logs. */
export function getSentryDsn(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^\/\d+$/.test(url.pathname)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

export function getSentryIngestOrigin(value?: string) {
  const dsn = getSentryDsn(value);
  return dsn ? new URL(dsn).origin : undefined;
}

export function isExpectedNavigationError(error: unknown) {
  const digest =
    error && typeof error === "object" && "digest" in error
      ? String(error.digest)
      : "";
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /^(NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND|NEXT_REDIRECT)(?:;|$)/.test(
    digest || message,
  );
}

function safeText(value: string) {
  return value
    .replace(/https?:\/\/[^\s<>"']+/gi, (value) => safeUrl(value))
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [redacted]")
    .replace(
      /\b(password|token|secret|authorization|cookie|session[_-]?id)["']?\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1=[redacted]",
    )
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[token]",
    );
}

function safeUrl(value: string) {
  try {
    const url = new URL(value, "https://relative.invalid");
    const path = url.pathname.replace(
      /[A-Z0-9._%+-]+(?:@|%40)[A-Z0-9.-]+/gi,
      "[redacted]",
    );
    return url.origin === "https://relative.invalid"
      ? path
      : `${url.origin}${path}`;
  } catch {
    return "[invalid-url]";
  }
}

function safeSourcePath(value: string) {
  // Preserve app://, webpack://, file paths and source-map identifiers.
  return /^https?:\/\//i.test(value) ? safeUrl(value) : value.split(/[?#]/)[0];
}

/** Error-only policy: no form values, cookies, headers, user identity or dumps. */
export function scrubErrorEvent(event: ErrorEvent): ErrorEvent | null {
  if (
    event.exception?.values?.some((value) =>
      isExpectedNavigationError(value.value),
    )
  )
    return null;
  delete event.user;
  delete event.extra;
  delete event.contexts;
  delete event.breadcrumbs;
  if (event.request) {
    event.request = {
      ...(event.request.url ? { url: safeUrl(event.request.url) } : {}),
      ...(event.request.method ? { method: event.request.method } : {}),
    };
  }
  if (event.message) event.message = safeText(event.message);
  if (event.transaction)
    event.transaction = safeText(event.transaction.split(/[?#]/)[0]);
  if (event.logentry) {
    event.logentry = event.logentry.message
      ? { message: safeText(event.logentry.message) }
      : {};
  }
  if (event.tags) {
    const tags: NonNullable<ErrorEvent["tags"]> = event.tags.boundary
      ? { boundary: safeText(String(event.tags.boundary)) }
      : {};
    const allowed: Record<string, readonly string[]> = {
      "next.route_type": ["render", "route", "action", "proxy"],
      "next.render_source": [
        "react-server-components",
        "react-server-components-payload",
        "server-rendering",
        "unknown",
      ],
      "next.revalidate_reason": ["on-demand", "stale", "none"],
      "next.resume": ["true", "false"],
    };
    for (const [key, values] of Object.entries(allowed)) {
      const value = event.tags[key];
      if (typeof value === "string" && values.includes(value))
        tags[key] = value;
    }
    event.tags = tags;
  }
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = safeText(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) {
      delete frame.vars;
      if (frame.filename) frame.filename = safeSourcePath(frame.filename);
      if (frame.abs_path) frame.abs_path = safeSourcePath(frame.abs_path);
    }
  }
  return event;
}

// Disable breadcrumbs altogether initially: DOM text, console arguments and
// request URLs can otherwise include authored CMS content or auth parameters.
export function discardBreadcrumb(_breadcrumb: Breadcrumb): null {
  return null;
}

export function errorOnlyIntegrations<T extends { name: string }>(
  defaults: T[],
): T[] {
  return defaults.filter(
    (integration) =>
      ![
        "BrowserTracing",
        "Replay",
        "CaptureConsole",
        "Console",
        "Breadcrumbs",
        "BrowserSession",
        "ProcessSession",
        "ConversationId",
      ].includes(integration.name),
  );
}

export function errorMonitoringOptions(dsn: string, environment: string) {
  return {
    dsn,
    environment,
    sendDefaultPii: false,
    sendClientReports: false,
    enableLogs: false,
    maxBreadcrumbs: 0,
    integrations: errorOnlyIntegrations,
    beforeSend: scrubErrorEvent,
    beforeBreadcrumb: discardBreadcrumb,
  };
}
