export interface DeepSeekOptions {
  /**
   * Output budget. IMPORTANT: deepseek-v4-flash is a REASONING model and its
   * hidden reasoning is billed against this same budget. Measured Jul 28 2026 on
   * the DA price sheet: at 8192 the reasoning consumed all 8192 tokens and the
   * API returned an EMPTY string with finish_reason "length" — no error, just
   * nothing. That silently blanked the live site for five days.
   *
   * 32000 lets reasoning finish and still leaves room for the answer, but the
   * call then takes ~82s, which does NOT fit Vercel Hobby's 60s function limit.
   * So this path is a FALLBACK only; lib/da-parser.ts is the primary reader.
   */
  maxTokens?: number;
  /** 0 for data extraction. The old 0.7 was a creative-writing default. */
  temperature?: number;
  model?: string;
  /**
   * Hard wall-clock limit. Vercel Hobby kills a function at 60s and there is no
   * way to extend it, so a call that would take longer must be abandoned early
   * enough to leave time for a clean response. Measured Jul 28 2026: a full
   * extraction at maxTokens 32000 takes ~82s, so on Hobby it CANNOT finish —
   * this makes it fail in a controlled way instead of eating the whole budget.
   */
  timeoutMs?: number;
}

export interface DeepSeekResult {
  content: string;
  finishReason: string;
  reasoningTokens: number;
  answerTokens: number;
  /** True when the budget ran out before the model finished answering. */
  truncated: boolean;
}

/**
 * Call DeepSeek and return the response WITH the usage telemetry.
 *
 * The old signature returned a bare string, so an empty answer was
 * indistinguishable from a legitimate one. Callers must now be able to see that
 * the model produced nothing and why.
 */
export async function callDeepSeekWithUsage(
  prompt: string,
  systemPrompt?: string,
  options: DeepSeekOptions = {},
): Promise<DeepSeekResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const {
    maxTokens = 32000,
    temperature = 0,
    model = "deepseek-v4-flash",
    timeoutMs,
  } = options;

  const messages: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  // NOTE: fetch resolves when the response HEADERS arrive, which for this API is
  // about 0.2s regardless of how long generation takes. The body read is the
  // real wait, so the abort controller must stay armed across BOTH.
  const controller = new AbortController();
  const timer =
    timeoutMs && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

  let response: Response;
  let raw: string;
  try {
    response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    raw = await response.text();
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        `DeepSeek call aborted after ${timeoutMs}ms. A full extraction takes ~82s, ` +
          `which does not fit inside Vercel Hobby's 60s function limit.`,
      );
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }

  // Parsed from the text already read above; the body can only be consumed once.
  const data = JSON.parse(raw);
  const choice = data.choices?.[0];
  const finishReason: string = choice?.finish_reason ?? "unknown";

  let content: string = choice?.message?.content ?? "";

  // Safety net: strip markdown fences, which arrive regardless of instructions.
  content = content
    .replace(/```(json|csv)?\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  const completionTokens: number = data.usage?.completion_tokens ?? 0;
  const reasoningTokens: number = data.usage?.completion_tokens_details?.reasoning_tokens ?? 0;

  return {
    content,
    finishReason,
    reasoningTokens,
    answerTokens: Math.max(0, completionTokens - reasoningTokens),
    truncated: finishReason === "length",
  };
}

/**
 * Backwards-compatible wrapper used by the "Bakit?" prose generation in
 * app/api/cron/suggest/route.ts.
 *
 * Throws when the model returns an empty answer instead of handing back "", so
 * an exhausted reasoning budget can never again look like a successful call.
 */
export async function callDeepSeekAPI(
  prompt: string,
  systemPrompt?: string,
  options: DeepSeekOptions = {},
): Promise<string> {
  const result = await callDeepSeekWithUsage(prompt, systemPrompt, options);

  if (!result.content) {
    throw new Error(
      `DeepSeek returned an empty answer (finish_reason=${result.finishReason}, ` +
        `reasoning_tokens=${result.reasoningTokens}). The reasoning budget was exhausted ` +
        `before any answer was produced; raise maxTokens.`,
    );
  }

  return result.content;
}
