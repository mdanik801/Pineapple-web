/**
 * Safe retry helper for idempotent GET/read requests on unstable mobile networks.
 * Do NOT use for non-idempotent mutations (order create, payment, courier booking, etc.).
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  opts: { retries?: number; baseDelayMs?: number; timeoutMs?: number } = {}
): Promise<Response> {
  const method = String(init.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return fetch(input, init);
  }

  const retries = Math.max(0, Math.min(3, opts.retries ?? 2));
  const baseDelayMs = Math.max(200, opts.baseDelayMs ?? 400);
  const timeoutMs = Math.max(1000, opts.timeoutMs ?? 8000);

  let attempt = 0;
  let lastErr: unknown = null;

  while (attempt <= retries) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => { try { controller.abort(); } catch {} }, timeoutMs) : null;
    try {
      const res = await fetch(input, {
        ...init,
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (timeout) clearTimeout(timeout);

      // Retry on transient server/network gateway statuses for idempotent reads
      if ((res.status >= 500 || res.status === 429 || res.status === 408) && attempt < retries) {
        attempt++;
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 150);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err) {
      if (timeout) clearTimeout(timeout);
      lastErr = err;
      if (attempt >= retries) throw err;
      attempt++;
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 150);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Request failed");
}
