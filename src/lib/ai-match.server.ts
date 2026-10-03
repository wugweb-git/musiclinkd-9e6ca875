import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const RUN_ID = "X-Lovable-AIG-Run-ID";

export type MatchPick = { id: string; reason: string };
export type MatchPicks = { people: MatchPick[]; opportunities: MatchPick[] };

/** Thrown with the gateway's status so the screen can say what went wrong. */
export class MatchError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Asks the model to pick, from the candidates it is given, the ones that fit the brief. It can
 * only return ids it was shown; anything else is dropped by the caller.
 */
export async function pickMatches(
  brief: string,
  candidates: { people: unknown[]; opportunities: unknown[] },
): Promise<MatchPicks> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new MatchError(401, "AI matching is not configured.");

  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(RUN_ID, runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get(RUN_ID) ?? undefined;
      if (!res.ok) {
        const body = await res.clone().text();
        let message = "AI matching failed. Try again in a moment.";
        try {
          const j = JSON.parse(body) as { message?: string; error?: { message?: string } };
          message = j.message ?? j.error?.message ?? message;
        } catch {
          /* keep default */
        }
        throw new MatchError(res.status, message);
      }
      return res;
    },
  });

  let failure: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    system:
      "You match music-industry briefs to real MusicLinkd profiles and open opportunities. " +
      "Only use ids from the candidate lists. Pick at most 6 people and 4 opportunities that " +
      "genuinely fit; return fewer or none rather than weak matches. Each reason is one short " +
      "sentence (under 20 words) naming what fits, using only facts in the candidate data. " +
      'Reply with JSON only: {"people":[{"id":"","reason":""}],"opportunities":[{"id":"","reason":""}]}',
    prompt: `Brief:\n${brief}\n\nCandidates:\n${JSON.stringify(candidates)}`,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  let text = "";
  try {
    text = await result.text;
  } catch (e) {
    failure ??= e;
  }
  if (failure) {
    const cause = (failure as { cause?: unknown }).cause ?? failure;
    if (cause instanceof MatchError) throw cause;
    if (failure instanceof MatchError) throw failure;
    throw new MatchError(500, "AI matching failed. Try again in a moment.");
  }
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    const parsed = JSON.parse(json) as Partial<MatchPicks>;
    const clean = (list: unknown): MatchPick[] =>
      Array.isArray(list)
        ? list
            .filter(
              (p): p is MatchPick =>
                !!p && typeof p.id === "string" && typeof p.reason === "string",
            )
            .map((p) => ({ id: p.id, reason: p.reason.slice(0, 160) }))
        : [];
    return { people: clean(parsed.people).slice(0, 6), opportunities: clean(parsed.opportunities).slice(0, 4) };
  } catch {
    return { people: [], opportunities: [] };
  }
}
