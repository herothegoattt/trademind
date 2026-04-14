import { NextRequest, NextResponse } from "next/server";
import { getUsers, verifyToken, userToResponse } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ detail: "Missing token" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ detail: "Invalid or expired token" }, { status: 401 });
    }

    const users = getUsers();
    const user = users.find((u) => u.id === Number(payload.sub));
    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userToResponse(user));
  } catch (err) {
    console.error("Me error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
