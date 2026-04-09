/**
 * Server-side only auth utilities.
 * Used exclusively in Next.js API routes (Node.js runtime).
 * Never import this in client components.
 */
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const JWT_SECRET =
  process.env.JWT_SECRET || "trademind-dev-secret-key-changeme-in-prod";

const DATA_DIR   = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TradingViewData {
  username: string;
  connected_at: string;
  last_sync?: string;
  status: "connected" | "syncing" | "error";
}

export interface StoredUser {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  is_active: boolean;
  avatar_url?: string;
  plan?: "core" | "edge" | "apex";
  tradingview?: TradingViewData | null;
  is_onboarded?: boolean;
  preferred_market?: string;
  google_id?: string;
}

// ─── File-based user storage ──────────────────────────────────────────────────
export function getUsers(): StoredUser[] {
  try {
    if (!existsSync(USERS_FILE)) return [];
    return JSON.parse(readFileSync(USERS_FILE, "utf8")) as StoredUser[];
  } catch {
    return [];
  }
}

export function saveUsers(users: StoredUser[]): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

// ─── Password hashing (PBKDF2-SHA512) ─────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const attempt = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
    const a = Buffer.from(hash,    "hex");
    const b = Buffer.from(attempt, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── JWT (HS256, pure crypto) ─────────────────────────────────────────────────
export function createToken(userId: number): string {
  const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp     = Math.floor(Date.now() / 1000) + 7 * 24 * 3600; // 7 days
  const payload = b64url(JSON.stringify({ sub: String(userId), exp, type: "access" }));
  const sig     = sign(`${header}.${payload}`);
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const [header, payload, sig] = token.split(".");
    if (!header || !payload || !sig) return null;
    if (sign(`${header}.${payload}`) !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (data.type !== "access") return null;
    return data as { sub: string };
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function b64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
}

export function userToResponse(u: StoredUser) {
  return {
    id:               u.id,
    email:            u.email,
    name:             u.name,
    avatar_url:       u.avatar_url || null,
    verified:         u.is_active,
    created_at:       u.created_at,
    plan:             u.plan || "core",
    tradingview:      u.tradingview || null,
    is_onboarded:     u.is_onboarded ?? false,
    preferred_market: u.preferred_market || null,
  };
}

/** Find user by token, returns null if not found/invalid */
export function getUserFromToken(authHeader: string | null): StoredUser | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) return null;
  const users = getUsers();
  return users.find((u) => u.id === Number(payload.sub)) || null;
}

/** Update user fields and persist */
export function updateUser(userId: number, updates: Partial<StoredUser>): StoredUser | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return users[idx];
}
