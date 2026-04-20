/**
 * Server-side helper for proxying requests to the FastAPI backend.
 * Use only in Next.js API routes (Node.js runtime).
 */

export const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";

/** Validate a Bearer token by calling /api/v1/auth/me on the backend. */
export async function getUserFromBackendToken(
  authHeader: string | null
): Promise<Record<string, unknown> | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Authorization: authHeader },
    });
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

  return fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
