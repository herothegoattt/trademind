import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken, updateUser, userToResponse } from "@/lib/auth-server";

/** PUT /api/auth/profile — update profile fields (name, avatar_url) */
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromToken(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const allowed: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      allowed.name = body.name.trim();
    }
    if (typeof body.avatar_url === "string") {
      allowed.avatar_url = body.avatar_url;
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ detail: "No valid fields to update" }, { status: 400 });
    }

    const updated = updateUser(user.id, allowed);
    if (!updated) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userToResponse(updated));
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
