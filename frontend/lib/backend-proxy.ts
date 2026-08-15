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
      57000,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Forward a request to the FastAPI backend and return the response.
 *  Render free web services sleep after ~15 min idle and take up to ~50 s to
 *  wake, so we wait out the whole cold start in a single attempt (Vercel Hobby
 *  caps function time at 60 s). */
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

  try {
    return await fetchWithTimeout(url, options, 57000);
  } catch (err: any) {
    const isConnRefused = err?.cause?.code === "ECONNREFUSED";
    const isTimeout     = err?.name === "AbortError";

    if (isConnRefused) {
      console.error(`[backend-proxy] ECONNREFUSED — ${url}`);
      throw new Error("Service temporarily unavailable. Please try again later.");
    }
    if (isTimeout) {
      console.error(`[backend-proxy] Timeout — ${url}`);
      throw new Error("The server is taking too long to respond. Please try again.");
    }
    throw err;
  }
}
