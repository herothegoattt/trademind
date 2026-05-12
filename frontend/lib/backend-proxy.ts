/**
 * Server-side helper for proxying requests to the FastAPI backend.
 * Use only in Next.js API routes (Node.js runtime).
 */

function getBackendUrl(): string {
  return process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
}

/** Validate a Bearer token by calling /api/v1/auth/me on the backend. */
export async function getUserFromBackendToken(
  authHeader: string | null
): Promise<Record<string, unknown> | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${getBackendUrl()}/api/v1/auth/me`, {
      headers: { Authorization: authHeader },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Forward a request to the FastAPI backend and return the response. */
export async function proxyToBackend(
  path: string,
  method: string,
  body?: unknown,
  authHeader?: string | null
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authHeader) headers["Authorization"] = authHeader;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${getBackendUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      console.error(`[backend-proxy] Timeout reaching ${getBackendUrl()}${path}`);
      throw new Error("Service is temporarily slow. Please try again in a moment.");
    }
    if (err?.cause?.code === "ECONNREFUSED") {
      console.error(`[backend-proxy] ECONNREFUSED reaching ${getBackendUrl()}${path} — BACKEND_INTERNAL_URL=${process.env.BACKEND_INTERNAL_URL ?? "(unset)"}`);
      throw new Error("Service temporarily unavailable. Please try again later.");
    }
    throw err;
  }
}
