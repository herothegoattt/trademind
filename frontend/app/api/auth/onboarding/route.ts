import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken, updateUser, userToResponse } from "@/lib/auth-server";

/** POST /api/auth/onboarding — mark user as onboarded, optionally save preferred_market */
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromToken(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const updates: { is_onboarded: boolean; preferred_market?: string } = {
      is_onboarded: true,
    };

    if (typeof body.preferred_market === "string" && body.preferred_market.trim()) {
      updates.preferred_market = body.preferred_market.trim();
    }

    const updated = updateUser(user.id, updates);
    if (!updated) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userToResponse(updated));
  } catch (err) {
    console.error("Onboarding update error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
