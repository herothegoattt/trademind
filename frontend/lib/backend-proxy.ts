/**
 * Server-side helper for proxying requests to the FastAPI backend.
 * Use only in Next.js API routes (Node.js runtime).
 */

function getBackendUrl(): string {
  return process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** Validate a Bearer token by calling /api/v1/auth/me on the backend. */
export async function getUserFromBackendToken(
  authHeader: string | null
): Promise<Record<string, unknown> | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const res = await fetchWithTimeout(
      `${getBackendUrl()}/api/v1/auth/me`,
      { headers: { Authorization: authHeader } },
      12000,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Forward a request to the FastAPI backend and return the response.
 *  Retries once on ECONNREFUSED (Azure cold-start) after a short delay. */
export async function proxyToBackend(
  path: string,
  method: string,
  body?: unknown,
  authHeader?: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;

  const options: RequestInit = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  const url = `${getBackendUrl()}${path}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await fetchWithTimeout(url, options, 20000);
    } catch (err: any) {
      const isConnRefused = err?.cause?.code === "ECONNREFUSED";
      const isTimeout     = err?.name === "AbortError";

      if (attempt === 1 && isConnRefused) {
        // Cold-start: give the backend 3 s to wake up, then retry
        console.warn(`[backend-proxy] ECONNREFUSED on attempt 1 — BACKEND_INTERNAL_URL=${process.env.BACKEND_INTERNAL_URL ?? "(unset)"}. Retrying in 3 s…`);
        await new Promise<void>(r => setTimeout(r, 3000));
        continue;
      }

      if (isConnRefused) {
        console.error(`[backend-proxy] ECONNREFUSED after retry — ${url}`);
        throw new Error("Service temporarily unavailable. Please try again later.");
      }
      if (isTimeout) {
        console.error(`[backend-proxy] Timeout after ${attempt} attempt(s) — ${url}`);
        throw new Error("The server is taking too long to respond. Please try again.");
      }
      throw err;
    }
  }

  // TypeScript: unreachable but required
  throw new Error("Unexpected exit from retry loop");
}
