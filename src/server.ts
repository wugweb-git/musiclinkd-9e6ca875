import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// The calendar subscription feed (queue item 5d): answered here, before the app renders, as plain
// text/calendar for calendar apps to poll. An unknown or replaced link is a 404.
const CALENDAR_FEED = /^\/cal\/([A-Za-z0-9_-]{20,64})\.ics$/;

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const feed =
      request.method === "GET" ? CALENDAR_FEED.exec(new URL(request.url).pathname) : null;
    if (feed) {
      try {
        const { calendarFeed } = await import("./lib/calendar-feed.server");
        const body = await calendarFeed(feed[1]!);
        return body
          ? new Response(body, {
              headers: {
                "content-type": "text/calendar; charset=utf-8",
                "cache-control": "private, max-age=900",
              },
            })
          : new Response("Not found", { status: 404 });
      } catch (error) {
        console.error(error);
        return new Response("Calendar unavailable", { status: 503 });
      }
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
